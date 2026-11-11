/**
 * Loads third-party platform scripts (brief §7): at most once per page, one shared promise
 * for concurrent callers, reusing a script the host already added. Browser-only; nothing
 * here touches `window` or `document` until called, so it is safe to import on the server.
 * Scripts are never removed: other embeds and the host may still need them.
 */

export type PlatformScript = {
  /** One script per key per page. */
  key: string;
  /** The URL added when the page does not have the script yet. */
  url: string;
  crossOrigin?: 'anonymous';
  /** Recognises the platform's script, whether this package or the host added it. */
  isOwn: (src: string) => boolean;
  /** Whether the platform's global is in place. */
  isPresent: () => boolean;
  /** Set up before the script is added; resolves when the platform calls back as ready. */
  readyCallback?: () => Promise<void>;
  /** Once the global is present, waits for the platform's own ready signal. */
  whenPresent?: () => Promise<void>;
  /** Prepares the page for the script to run; the returned function undoes that. */
  prepare?: () => () => void;
  /**
   * Whether the script has run and done nothing. It is then added again, so that `prepare`
   * can act on what stopped it.
   */
  skipped?: () => boolean;
};

// Fixed retry policy (brief §6.2): three attempts, waiting 1 s and then 2 s.
const ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 15_000;
const POLL_MS = 50;

const loading = new Map<string, Promise<void>>();

export function loadScript(script: PlatformScript): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(
      new Error('social-embeds: platform scripts load only in the browser'),
    );
  }
  let promise = loading.get(script.key);
  if (!promise) {
    promise = load(script).catch((error: unknown) => {
      // A failure is not cached, so an embed mounted later can try again.
      loading.delete(script.key);
      throw error;
    });
    loading.set(script.key, promise);
  }
  return promise;
}

async function load(script: PlatformScript): Promise<void> {
  if (!script.isPresent()) {
    const hostTag = [
      ...document.querySelectorAll<HTMLScriptElement>('script[src]'),
    ].some((element) => script.isOwn(element.src));
    // The host's own tag may still be loading: wait for its global instead of adding ours.
    await (hostTag ? poll(script) : add(script));
  }
  await script.whenPresent?.();
}

/** The browser reported the script as failed; its tag has been removed. */
class LoadError extends Error {}

async function add(script: PlatformScript): Promise<void> {
  const ready = script.readyCallback?.();
  for (let attempt = 1; ; attempt++) {
    try {
      const element = await insert(script);
      if (attempt >= ATTEMPTS || !script.skipped?.()) break;
      // Removed like a failed tag; the next one runs on a prepared page.
      element.remove();
    } catch (error) {
      // A tag that timed out may still arrive and run, so only a reported failure is
      // retried; retrying a timeout could run the script twice.
      if (!(error instanceof LoadError) || attempt >= ATTEMPTS) throw error;
      await delay(RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }
  await (ready
    ? timeout(ready, `${script.url} did not report ready`)
    : poll(script));
}

async function insert(script: PlatformScript): Promise<HTMLScriptElement> {
  const restore = script.prepare?.();
  const element = document.createElement('script');
  const loaded = new Promise<void>((resolve, reject) => {
    element.src = script.url;
    element.async = true;
    if (script.crossOrigin) element.crossOrigin = script.crossOrigin;
    element.addEventListener('load', () => {
      resolve();
    });
    element.addEventListener('error', () => {
      // Removed so that a retry, or a later embed, is not mistaken for a host tag.
      element.remove();
      reject(new LoadError(`social-embeds: could not load ${script.url}`));
    });
    document.head.appendChild(element);
  });
  try {
    await timeout(loaded, `${script.url} did not load`);
  } finally {
    // A script runs before its load event, so the page can be put back now.
    restore?.();
  }
  return element;
}

function poll(script: PlatformScript): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + TIMEOUT_MS;
    const check = () => {
      if (script.isPresent()) {
        resolve();
      } else if (Date.now() >= deadline) {
        reject(new Error(`social-embeds: ${script.url} did not initialise`));
      } else {
        setTimeout(check, POLL_MS);
      }
    };
    check();
  });
}

function timeout(promise: Promise<void>, message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`social-embeds: ${message}`));
    }, TIMEOUT_MS);
    promise.then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
