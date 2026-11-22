import { loadScript, type PlatformScript } from './load-script';

// Script URLs, globals and ready signals: docs/decisions.md D24–D26.
// No calls at module level: a bundler keeps a platform's script only if its loader is used.

type PlatformGlobals = {
  twttr?: {
    widgets?: { load?: unknown };
    ready?: (callback: () => void) => void;
  };
  instgrm?: {
    Embeds?: {
      process?: unknown;
      registeredEmbedSDKs?: Partial<Record<string, boolean>>;
    };
  };
  FB?: { XFBML?: { parse?: unknown }; __buffer?: unknown };
  fbAsyncInit?: () => void;
  PinUtils?: { build?: unknown };
};

const globals = () => window as unknown as PlatformGlobals;

/** The SDK refuses to parse without a Graph API version (docs/decisions.md D26). */
export const FACEBOOK_SDK_VERSION = 'v26.0';

const LOCALE = /^[a-z]{2,3}_[A-Z]{2}$/;

/** Instagram and Threads share `instgrm.Embeds`; each registers its name when loaded. */
function embedSdkRegistered(name: string): boolean {
  const embeds = globals().instgrm?.Embeds;
  return (
    embeds?.registeredEmbedSDKs?.[name] === true &&
    typeof embeds.process === 'function'
  );
}

const x: PlatformScript = {
  key: 'x',
  // platform.x.com/widgets.js redirects here.
  url: 'https://platform.twitter.com/widgets.js',
  isOwn: (src) =>
    /^https?:\/\/platform\.(?:twitter|x)\.com\/widgets\.js(?:[?#]|$)/.test(src),
  isPresent: () => typeof globals().twttr?.widgets?.load === 'function',
  whenPresent: () =>
    new Promise((resolve) => {
      const ready = globals().twttr?.ready;
      if (ready) {
        ready(() => {
          resolve();
        });
      } else {
        resolve();
      }
    }),
};

// embed.js does nothing beside a loaded Facebook SDK, unless `FB.__buffer` is set as it is
// while the SDK loads (docs/decisions.md D38).
function besideFacebookSdk(): () => void {
  const fb = globals().FB;
  if (!fb || fb.__buffer) return () => {};
  fb.__buffer = true;
  return () => {
    delete fb.__buffer;
  };
}

// embed.js registers while it runs: no registration beside a loaded SDK means it ran
// before the SDK could be marked, and did nothing (docs/decisions.md D46).
function skippedBesideFacebookSdk(name: string): boolean {
  const fb = globals().FB;
  return !embedSdkRegistered(name) && fb !== undefined && !fb.__buffer;
}

const instagram: PlatformScript = {
  key: 'instagram',
  url: 'https://www.instagram.com/embed.js',
  isOwn: (src) =>
    /^https?:\/\/www\.instagram\.com\/embed\.js(?:[?#]|$)/.test(src),
  isPresent: () => embedSdkRegistered('instagram'),
  prepare: besideFacebookSdk,
  skipped: () => skippedBesideFacebookSdk('instagram'),
};

const threads: PlatformScript = {
  key: 'threads',
  url: 'https://www.threads.com/embed.js',
  isOwn: (src) =>
    /^https?:\/\/www\.threads\.(?:com|net)\/embed\.js(?:[?#]|$)/.test(src),
  isPresent: () => embedSdkRegistered('threads'),
  prepare: besideFacebookSdk,
  skipped: () => skippedBesideFacebookSdk('threads'),
};

// `xfbml=0` stops the SDK from scanning the whole page: each embed is parsed on its own.
function facebook(locale: string): PlatformScript {
  return {
    key: 'facebook',
    url: `https://connect.facebook.net/${locale}/sdk.js#xfbml=0&version=${FACEBOOK_SDK_VERSION}`,
    crossOrigin: 'anonymous',
    isOwn: (src) =>
      /^https?:\/\/connect\.facebook\.net\/[a-z]{2,3}_[A-Z]{2}\/(?:sdk(?:\/debug)?|all)\.js(?:[?#]|$)/.test(
        src,
      ),
    isPresent: () => typeof globals().FB?.XFBML?.parse === 'function',
    // FB exists before the SDK has initialised; fbAsyncInit marks the end of init.
    // A handler the host set up is kept and called first.
    readyCallback: () =>
      new Promise((resolve) => {
        const previous = globals().fbAsyncInit;
        globals().fbAsyncInit = () => {
          previous?.();
          resolve();
        };
      }),
  };
}

// pinit.js only adds pinit_main.js, which builds the widgets (docs/decisions.md D51).
const pinterest: PlatformScript = {
  key: 'pinterest',
  url: 'https://assets.pinterest.com/js/pinit_main.js',
  isOwn: (src) =>
    /^https?:\/\/assets\.pinterest\.com\/js\/pinit(?:_main)?\.js(?:[?#]|$)/.test(
      src,
    ),
  isPresent: () => typeof globals().PinUtils?.build === 'function',
};

export function loadX(): Promise<void> {
  return loadScript(x);
}

export function loadInstagram(): Promise<void> {
  return loadScript(instagram);
}

export function loadThreads(): Promise<void> {
  return loadScript(threads);
}

export function loadPinterest(): Promise<void> {
  return loadScript(pinterest);
}

export function loadFacebook(locale: string): Promise<void> {
  return LOCALE.test(locale)
    ? loadScript(facebook(locale))
    : Promise.reject(
        new Error(`social-embeds: invalid Facebook locale "${locale}"`),
      );
}
