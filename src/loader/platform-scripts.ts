import { loadScript, type PlatformScript } from './load-script';

// Script URLs, globals and ready signals are taken from the platforms' own scripts and
// from browser probes (docs/decisions.md D24–D26).

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
};

const globals = () => window as unknown as PlatformGlobals;

/**
 * The SDK refuses to parse without a Graph API version. Social plugins render with old and
 * new versions alike; this is the one Meta's Embedded Posts documentation uses.
 */
export const FACEBOOK_SDK_VERSION = 'v26.0';

const LOCALE = /^[a-z]{2,3}_[A-Z]{2}$/;

/** Instagram and Threads share `instgrm.Embeds`; each registers its name when loaded. */
function embedSdkRegistered(name: string): () => boolean {
  return () => {
    const embeds = globals().instgrm?.Embeds;
    return (
      embeds?.registeredEmbedSDKs?.[name] === true &&
      typeof embeds.process === 'function'
    );
  };
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

/**
 * Instagram's and Threads' embed.js do nothing when a loaded Facebook SDK is on the page:
 * both start with `(window.FB && !window.FB.__buffer) || …`. The SDK's own stub carries
 * `__buffer` while the SDK loads, so a loaded SDK is marked the same way while the script
 * runs. Neither script reads `FB` anywhere else (docs/decisions.md D38).
 */
function besideFacebookSdk(): () => void {
  const fb = globals().FB;
  if (!fb || fb.__buffer) return () => {};
  fb.__buffer = true;
  return () => {
    delete fb.__buffer;
  };
}

const instagram: PlatformScript = {
  key: 'instagram',
  url: 'https://www.instagram.com/embed.js',
  isOwn: (src) =>
    /^https?:\/\/www\.instagram\.com\/embed\.js(?:[?#]|$)/.test(src),
  isPresent: embedSdkRegistered('instagram'),
  prepare: besideFacebookSdk,
};

const threads: PlatformScript = {
  key: 'threads',
  url: 'https://www.threads.com/embed.js',
  isOwn: (src) =>
    /^https?:\/\/www\.threads\.(?:com|net)\/embed\.js(?:[?#]|$)/.test(src),
  isPresent: embedSdkRegistered('threads'),
  prepare: besideFacebookSdk,
};

/**
 * `xfbml=0` stops the SDK from scanning the whole page; embeds are parsed explicitly. One
 * SDK serves the whole page, so the first locale requested wins.
 */
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

export type ScriptPlatform = 'x' | 'instagram' | 'threads' | 'facebook';

export function loadPlatformScript(
  platform: ScriptPlatform,
  { locale = 'en_US' }: { locale?: string } = {},
): Promise<void> {
  switch (platform) {
    case 'x':
      return loadScript(x);
    case 'instagram':
      return loadScript(instagram);
    case 'threads':
      return loadScript(threads);
    case 'facebook':
      return LOCALE.test(locale)
        ? loadScript(facebook(locale))
        : Promise.reject(
            new Error(`social-embeds: invalid Facebook locale "${locale}"`),
          );
  }
}
