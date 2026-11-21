import { descendants, type HtmlElement, parseHtml } from './html';
import { sizeOf, unwrapRatio } from './platform';
import { platforms } from './platforms';
import { parseUrl, pixels } from './url';

// Security: only the checked fields of `ParsedIframe` may reach the DOM; `srcdoc`, `on*` handlers
// and scripts never do, and a `src` that is not https rejects the code (docs/wave-5-brief.md §3).

const REFERRER_POLICIES = [
  'no-referrer',
  'no-referrer-when-downgrade',
  'origin',
  'origin-when-cross-origin',
  'same-origin',
  'strict-origin',
  'strict-origin-when-cross-origin',
  'unsafe-url',
] as const;

const SANDBOX_KEYWORDS = new Set([
  'allow-downloads',
  'allow-forms',
  'allow-modals',
  'allow-orientation-lock',
  'allow-pointer-lock',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-presentation',
  'allow-same-origin',
  'allow-scripts',
  'allow-top-navigation',
  'allow-top-navigation-by-user-activation',
  'allow-top-navigation-to-custom-protocols',
]);

// A delegated permission is granted in the host site's name: media features only.
const FEATURES = new Set([
  'autoplay',
  'fullscreen',
  'encrypted-media',
  'picture-in-picture',
  'clipboard-write',
  'web-share',
]);

const HOST = '[a-z0-9-]+(?:\\.[a-z0-9-]+)*(?::\\d{1,5})?';
const SRC = new RegExp(`^(?:https:)?//${HOST}(?:[/?#]|$)`, 'i');
const ORIGIN = new RegExp(`^(?:\\*|'self'|'src'|'none'|https://${HOST})$`, 'i');
const DOT_SEGMENT = /\/(?:\.|%2e){1,2}(?:\/|$)/i;
const ASCII_WHITESPACE = /[\t\n\f\r ]+/;
const STYLE_SIZE = /^\s*(width|height)\s*:(.*)$/is;
const PX = /^(\d+)px$/i;
const WRAPPER =
  /(?:^|;)\s*padding-bottom:\s*(\d{1,3}(?:\.\d{1,20})?)%\s*(?:;|$)/i;

export type ParsedIframe = {
  src: string;
  title?: string;
  allow: string;
  allowFullscreen: boolean;
  referrerPolicy?: (typeof REFERRER_POLICIES)[number];
  sandbox?: string; // '' still sandboxes the frame fully
  scrolling?: 'no';
  size: { width?: number; height?: number }; // px; a wrapper's ratio when that is all there is
};

type Unchecked = { readonly [K in keyof ParsedIframe]?: unknown };

/**
 * Never throws. `null` unless the code holds exactly one `<iframe>` with an https `src` that no
 * named platform owns; everything around the iframe is dropped.
 */
export function parseIframe(html: string): ParsedIframe | null {
  // Callers without type checking may pass anything.
  if (typeof html !== 'string') return null;
  const nodes = parseHtml(html);
  if (!nodes) return null;
  const elements = descendants(nodes);
  const [iframe, ...others] = elements.filter(
    (element) => element.tag === 'iframe',
  );
  if (!iframe || others.length > 0) return null;
  const parent = elements.find((element) => element.children.includes(iframe));

  const { attrs } = iframe;
  const candidate: Unchecked = {
    src: attrs.get('src'),
    title: attrs.get('title'),
    allow: attrs.get('allow'),
    allowFullscreen: attrs.has('allowfullscreen'),
    referrerPolicy: attrs.get('referrerpolicy'),
    sandbox: attrs.get('sandbox'),
    scrolling: attrs.get('scrolling'),
    size:
      sizeOf(iframe) ??
      styleSize(iframe) ??
      (parent && unwrapRatio(parent, WRAPPER)?.size) ??
      {},
  };
  // checkIframe reads every field as unknown.
  const embed = checkIframe(candidate as ParsedIframe);
  const url = embed && parseUrl(embed.src);
  if (!embed || !url) return null;
  // A port would hide the platform's host.
  const host = url.host.replace(/:\d+$/, '');
  return platforms.some((platform) => platform.ownsFrame?.({ ...url, host }))
    ? null
    : embed;
}

/** Re-checks a value a host built itself; `null` when its `src` is unsafe. */
export function checkIframe(embed: ParsedIframe): ParsedIframe | null {
  const value: unknown = embed;
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Unchecked;
  const src = checkSrc(raw.src);
  if (src === null) return null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const policy =
    typeof raw.referrerPolicy === 'string'
      ? raw.referrerPolicy.toLowerCase()
      : undefined;
  const referrerPolicy = REFERRER_POLICIES.find(
    (keyword) => keyword === policy,
  );
  return {
    src,
    ...(title ? { title } : {}),
    allow: typeof raw.allow === 'string' ? checkAllow(raw.allow) : '',
    allowFullscreen: raw.allowFullscreen === true,
    ...(referrerPolicy ? { referrerPolicy } : {}),
    ...(typeof raw.sandbox === 'string'
      ? { sandbox: checkSandbox(raw.sandbox) }
      : {}),
    ...(typeof raw.scrolling === 'string' &&
    raw.scrolling.toLowerCase() === 'no'
      ? { scrolling: 'no' as const }
      : {}),
    size: checkSize(raw.size),
  };
}

function checkSrc(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const src = value.trim();
  const url = SRC.test(src) && !src.includes('\\') ? parseUrl(src) : null;
  // Browsers resolve these, so the frame's real path could slip past `ownsFrame`.
  if (!url || DOT_SEGMENT.test(url.path)) return null;
  return src.startsWith('//') ? `https:${src}` : src;
}

/** A feature keeps its origin list as written, or is dropped whole when one origin is not safe. */
function checkAllow(value: string): string {
  return value
    .split(';')
    .map((directive) => directive.split(ASCII_WHITESPACE).filter(Boolean))
    .filter(
      ([feature, ...origins]) =>
        feature !== undefined &&
        FEATURES.has(feature) &&
        origins.every((origin) => ORIGIN.test(origin)),
    )
    .map((tokens) => tokens.join(' '))
    .join('; ');
}

function checkSandbox(value: string): string {
  const keywords = value
    .split(ASCII_WHITESPACE)
    .map((token) => token.toLowerCase())
    .filter((token) => SANDBOX_KEYWORDS.has(token));
  return [...new Set(keywords)].join(' ');
}

function checkSize(value: unknown): ParsedIframe['size'] {
  if (typeof value !== 'object' || value === null) return {};
  const { width, height } = value as { width?: unknown; height?: unknown };
  const checkedWidth =
    typeof width === 'number' ? pixels(String(width)) : undefined;
  const checkedHeight =
    typeof height === 'number' ? pixels(String(height)) : undefined;
  return {
    ...(checkedWidth === undefined ? {} : { width: checkedWidth }),
    ...(checkedHeight === undefined ? {} : { height: checkedHeight }),
  };
}

function styleSize(iframe: HtmlElement): ParsedIframe['size'] | undefined {
  let width: number | undefined;
  let height: number | undefined;
  // The last declaration wins, as in CSS.
  for (const declaration of (iframe.attrs.get('style') ?? '').split(';')) {
    const [, name = '', value = ''] = STYLE_SIZE.exec(declaration) ?? [];
    const px = pixels(PX.exec(value.trim())?.[1]);
    if (name.toLowerCase() === 'width') width = px;
    if (name.toLowerCase() === 'height') height = px;
  }
  return width === undefined && height === undefined
    ? undefined
    : { width, height };
}
