import { hasClass } from '../html';
import type { Options, PlatformParser } from '../platform';
import { item, type Type, stravaMatcher } from '../matchers/strava';

const NUMBER = /^\d{1,20}$/;
const SCRIPT = /^(?:https?:)?\/\/strava-embeds\.com\/embed\.js$/;
const STYLES = new Set(['standard', 'minimal']);
const MAP_HASH = /^[A-Za-z0-9_-]{1,100}$/;

function isType(value: string | undefined): value is Type {
  return value === 'activity' || value === 'route';
}

export const strava: PlatformParser = {
  ...stravaMatcher,
  parse(root) {
    if (root.tag !== 'div' || !hasClass(root, 'strava-embed-placeholder'))
      return null;
    const empty = root.children.every(
      (child) =>
        child.type === 'comment' ||
        (child.type === 'text' && /^\s*$/.test(child.raw)),
    );
    if (!empty) return null;
    const type = root.attrs.get('data-embed-type');
    const number = root.attrs.get('data-embed-id') ?? '';
    if (!isType(type) || !NUMBER.test(number)) return null;

    const options: Options = {};
    const style = root.attrs.get('data-style');
    if (style !== undefined && STYLES.has(style)) options.style = style;
    if (type === 'route' && root.attrs.get('data-full-width') === 'true')
      options.fullWidth = true;
    const mapHash = root.attrs.get('data-map-hash');
    if (mapHash !== undefined && MAP_HASH.test(mapHash))
      options.mapHash = mapHash;
    return { ...item(type, number), options };
  },
  isOwnScript: (src) => SCRIPT.test(src),
};
