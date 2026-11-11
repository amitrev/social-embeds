import { type HtmlElement, parseHtml } from './html';
import type { Options } from './platform';
import { platforms } from './platforms';
import type { ParsedEmbed } from './types';

/**
 * Never throws. `null` unless the input is one embed element plus, at most, the platform's
 * own scripts, `<div id="fb-root">`, whitespace and comments (docs/decisions.md D14).
 */
export function parseEmbed(html: string): ParsedEmbed | null {
  // Callers without type checking may pass anything.
  if (typeof html !== 'string') return null;
  const nodes = parseHtml(html);
  if (!nodes) return null;

  let root: HtmlElement | undefined;
  const scripts: HtmlElement[] = [];
  let fbRoot = false;
  for (const node of nodes) {
    if (node.type === 'comment') continue;
    if (node.type === 'text') {
      if (/^\s*$/.test(node.raw)) continue;
      return null;
    }
    if (node.tag === 'script') {
      scripts.push(node);
    } else if (isFbRoot(node)) {
      fbRoot = true;
    } else if (root) {
      return null;
    } else {
      root = node;
    }
  }
  if (!root) return null;

  for (const platform of platforms) {
    const embed = platform.parse(root);
    if (!embed) continue;
    if (fbRoot && !platform.allowsFbRoot) return null;
    const sources = scripts.map((script) =>
      script.children.length === 0 ? script.attrs.get('src') : undefined,
    );
    if (!sources.every((src) => src !== undefined && platform.isOwnScript(src)))
      return null;
    // Options from the embed element win over those carried by a script URL.
    const fromScripts = sources.map((src) =>
      src === undefined ? {} : (platform.scriptOptions?.(src) ?? {}),
    );
    return {
      ...embed,
      options: Object.assign({}, ...fromScripts, embed.options) as Options,
    };
  }
  return null;
}

function isFbRoot(element: HtmlElement): boolean {
  return (
    element.tag === 'div' &&
    element.attrs.get('id') === 'fb-root' &&
    element.attrs.size === 1 &&
    element.children.length === 0
  );
}
