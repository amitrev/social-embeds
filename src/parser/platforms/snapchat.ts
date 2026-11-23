import { descendants, hasClass } from '../html';
import { withSize, type PlatformParser, parserOf } from '../platform';
import { parseUrl, pixels } from '../url';
import { content, snapchatMatcher } from '../matchers/snapchat';

const SCRIPT = /^(?:https?:)?\/\/www\.snapchat\.com\/embed\.js$/;

export const snapchat: PlatformParser = /* @__PURE__ */ parserOf(
  snapchatMatcher,
  {
    parse(root) {
      if (root.tag !== 'blockquote' || !hasClass(root, 'snapchat-embed'))
        return null;
      const embedUrl = parseUrl(
        root.attrs.get('data-snapchat-embed-url') ?? '',
      );
      if (!embedUrl?.path.endsWith('/embed')) return null;
      const found = content({ ...embedUrl, path: embedUrl.path.slice(0, -6) });
      if (!found) return null;
      // The links name the same content as the iframe.
      const links = descendants(root.children).filter((el) => el.tag === 'a');
      const sameContent = links.every((link) => {
        const linked = content(parseUrl(link.attrs.get('href') ?? ''));
        return linked?.kind === found.kind && linked.id === found.id;
      });
      if (!sameContent) return null;

      const title = root.attrs.get('data-snapchat-embed-title');
      const width = pixels(root.attrs.get('data-snapchat-embed-width'));
      const height = pixels(root.attrs.get('data-snapchat-embed-height'));
      return withSize(
        { ...found, options: title === undefined ? {} : { title } },
        width === undefined || height === undefined
          ? undefined
          : { width, height },
      );
    },
    isOwnScript: (src) => SCRIPT.test(src),
  },
);
