import {
  FACEBOOK_SDK_VERSION,
  loadPlatformScript,
} from '../loader/platform-scripts';

/**
 * How each script-based platform renders the embeds in a container and how it signals that
 * it has. Evidence from the platforms' scripts and browser probes: docs/decisions.md D32.
 */
export type Driver = {
  load: () => Promise<void>;
  /**
   * Asks the platform to render the embed in `container` and calls `done` once it has.
   * Returns a cleanup. May throw; the caller retries.
   */
  render: (container: HTMLElement, done: () => void) => () => void;
};

type Globals = {
  twttr?: {
    widgets?: { load?: (element?: Element) => unknown };
    events?: {
      bind?: (
        event: string,
        handler: (event: { target?: unknown }) => void,
      ) => void;
      unbind?: (
        event: string,
        handler: (event: { target?: unknown }) => void,
      ) => void;
    };
  };
  instgrm?: { Embeds?: { process?: () => void } };
  FB?: {
    init?: (options: { xfbml: boolean; version: string }) => void;
    XFBML?: { parse?: (element: Element, callback?: () => void) => void };
  };
};

const globals = () => window as unknown as Globals;

/** Calls `done` once `rendered(container)` holds, checking after every DOM change. */
function watch(
  container: HTMLElement,
  rendered: (container: HTMLElement) => boolean,
  done: () => void,
): () => void {
  if (rendered(container)) {
    done();
    return () => {};
  }
  const observer = new MutationObserver(() => {
    if (!rendered(container)) return;
    observer.disconnect();
    done();
  });
  observer.observe(container, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'height'],
  });
  return () => {
    observer.disconnect();
  };
}

/** An iframe in `container` that the platform has given a height. */
function hasSizedIframe(container: HTMLElement): boolean {
  return [...container.querySelectorAll('iframe')].some(
    (iframe) => Number.parseFloat(iframe.style.height) > 0,
  );
}

export const xDriver: Driver = {
  load: () => loadPlatformScript('x'),
  render(container, done) {
    const twttr = globals().twttr;
    // widgets.js fires "rendered" per widget; a sized iframe is the fallback signal.
    const onRendered = (event: { target?: unknown }) => {
      if (event.target instanceof Node && container.contains(event.target))
        done();
    };
    twttr?.events?.bind?.('rendered', onRendered);
    const stop = watch(container, hasSizedIframe, done);
    twttr?.widgets?.load?.(container);
    return () => {
      twttr?.events?.unbind?.('rendered', onRendered);
      stop();
    };
  },
};

/** Instagram and Threads share `instgrm.Embeds.process()`, which renders both. */
function processEmbeds() {
  const process = globals().instgrm?.Embeds?.process;
  if (!process)
    throw new Error('social-embeds: instgrm.Embeds.process is missing');
  process();
}

export const instagramDriver: Driver = {
  load: () => loadPlatformScript('instagram'),
  render(container, done) {
    // embed.js marks the iframe "instagram-media-rendered" when the post has mounted.
    const stop = watch(
      container,
      (element) =>
        element.querySelector('iframe.instagram-media-rendered') !== null,
      done,
    );
    processEmbeds();
    return stop;
  },
};

export const threadsDriver: Driver = {
  load: () => loadPlatformScript('threads'),
  render(container, done) {
    // embed.js removes the blockquote when the post has mounted.
    const stop = watch(
      container,
      (element) =>
        element.querySelector('iframe') !== null &&
        element.querySelector('blockquote') === null,
      done,
    );
    processEmbeds();
    return stop;
  },
};

const facebookDrivers = new Map<string, Driver>();

export function facebookDriver(locale: string): Driver {
  let driver = facebookDrivers.get(locale);
  if (!driver) {
    driver = {
      load: () => loadPlatformScript('facebook', { locale }),
      render(container, done) {
        const fb = globals().FB;
        const parse = fb?.XFBML?.parse;
        if (!fb || !parse)
          throw new Error('social-embeds: FB.XFBML.parse is missing');
        // parse() renders the plugins inside the container, then calls back.
        const run = () => {
          parse(container, done);
        };
        try {
          run();
        } catch (error) {
          // A host-loaded SDK may never have been initialised (docs/decisions.md D26).
          if (
            !(error instanceof Error) ||
            !/init not called/.test(error.message)
          )
            throw error;
          fb.init?.({ xfbml: false, version: FACEBOOK_SDK_VERSION });
          run();
        }
        return () => {};
      },
    };
    facebookDrivers.set(locale, driver);
  }
  return driver;
}
