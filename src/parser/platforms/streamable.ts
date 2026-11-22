import {
  type Options,
  sizeOf,
  unwrapRatio,
  withSize,
  type PlatformParser,
} from '../platform';
import type { HtmlElement } from '../html';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl } from '../url';
import {
  video,
  validId,
  PLAYER_PATH,
  streamableMatcher,
} from '../matchers/streamable';

const WRAPPER =
  /^width:\s*100%;\s*height:\s*0(?:px)?;\s*position:\s*relative;\s*padding-bottom:\s*(\d{1,3}(?:\.\d{1,4})?)%;?$/;
const KEPT = new Set(['loop', 'autoplay', 'nocontrols', 'hd', 'muted']);
const STRAY_END = /<\/div\s*>$/i;

function fromIframe(iframe: HtmlElement): ParsedEmbed | null {
  if (iframe.tag !== 'iframe') return null;
  const src = parseUrl(iframe.attrs.get('src') ?? '');
  if (!src || src.host !== 'streamable.com') return null;
  const [, id] = PLAYER_PATH.exec(src.path) ?? [];
  if (!validId(id)) return null;
  const options: Options = Object.fromEntries(
    [...src.query]
      .filter(([key]) => KEPT.has(key))
      .map(([key, value]) => [key, coerce(value)]),
  );
  return { ...video(id), options };
}

export const streamable: PlatformParser = {
  ...streamableMatcher,
  parse(root) {
    const wrapped = unwrapRatio(root, WRAPPER);
    const iframe = wrapped?.iframe ?? root;
    const found = fromIframe(iframe);
    if (!found) return null;
    return withSize(found, wrapped?.size ?? sizeOf(iframe));
  },
  isOwnScript: () => false,
  // The player's "Copy embed code" closes a `div` it never opened.
  repair(html) {
    // Trimmed first: a `\s*` before the tag would backtrack across long whitespace runs.
    const code = html.trimEnd();
    const end = STRAY_END.exec(code);
    if (!end) return null;
    const trimmed = code.slice(0, end.index).trimEnd();
    return /^\s*<iframe[\s>]/i.test(trimmed) ? trimmed : null;
  },
};
