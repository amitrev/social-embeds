/**
 * A small, strict HTML tokenizer for platform embed codes.
 *
 * Embed codes are machine-generated and well-formed, so anything this cannot read with
 * certainty (unclosed or mismatched tags, a stray `<`, an unterminated quote or comment)
 * is rejected with `null`. It uses no DOM or browser API, so it runs unchanged in Node,
 * Server Components and browsers.
 */

export type HtmlElement = {
  type: 'element';
  tag: string;
  attrs: ReadonlyMap<string, string>; // names lower-cased, values entity-decoded
  children: HtmlNode[];
};

export type HtmlText = {
  type: 'text';
  raw: string; // as written, never contains `<`
};

export type HtmlComment = { type: 'comment' };

export type HtmlNode = HtmlElement | HtmlText | HtmlComment;

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

const RAW_TEXT_END: ReadonlyMap<string, RegExp> = new Map([
  ['script', /<\/script\s*>/giu],
  ['style', /<\/style\s*>/giu],
]);

// Real embed codes nest about 15 levels deep. The cap keeps the recursive helpers below
// from overflowing the stack on hostile input, so the parser never throws.
const MAX_DEPTH = 100;

const START_TAG = /<([a-zA-Z][a-zA-Z0-9-]*)/y;
const ATTRIBUTE =
  /\s+([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/y;
const START_TAG_END = /\s*(\/?)>/y;
const END_TAG = /<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>/y;

const NAMED_ENTITIES: ReadonlyMap<string, string> = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
  ['nbsp', ' '],
]);

/** Parses an HTML fragment into a node list, or `null` if it is not well-formed. */
export function parseHtml(input: string): HtmlNode[] | null {
  const root: HtmlElement = {
    type: 'element',
    tag: '',
    attrs: new Map(),
    children: [],
  };
  const open: HtmlElement[] = [root];
  let pos = 0;

  while (pos < input.length) {
    const parent = open[open.length - 1] ?? root;
    const lt = input.indexOf('<', pos);
    const textEnd = lt === -1 ? input.length : lt;
    if (textEnd > pos)
      parent.children.push({ type: 'text', raw: input.slice(pos, textEnd) });
    if (lt === -1) break;

    if (input.startsWith('<!--', lt)) {
      const close = input.indexOf('-->', lt + 4);
      if (close === -1) return null;
      parent.children.push({ type: 'comment' });
      pos = close + 3;
      continue;
    }

    END_TAG.lastIndex = lt;
    const end = END_TAG.exec(input);
    if (end) {
      if (parent === root || parent.tag !== end[1]?.toLowerCase()) return null;
      open.pop();
      pos = END_TAG.lastIndex;
      continue;
    }

    const start = readStartTag(input, lt);
    if (!start) return null;
    const { element } = start;
    parent.children.push(element);
    pos = start.end;

    const rawTextEnd = start.selfClosing
      ? undefined
      : RAW_TEXT_END.get(element.tag);
    if (rawTextEnd) {
      rawTextEnd.lastIndex = pos;
      const close = rawTextEnd.exec(input);
      if (!close) return null;
      if (close.index > pos) {
        element.children.push({
          type: 'text',
          raw: input.slice(pos, close.index),
        });
      }
      pos = rawTextEnd.lastIndex;
    } else if (!start.selfClosing && !VOID_TAGS.has(element.tag)) {
      if (open.length > MAX_DEPTH) return null;
      open.push(element);
    }
  }

  return open.length === 1 ? root.children : null;
}

function readStartTag(
  input: string,
  at: number,
): { element: HtmlElement; selfClosing: boolean; end: number } | null {
  START_TAG.lastIndex = at;
  const name = START_TAG.exec(input)?.[1];
  if (name === undefined) return null;

  const attrs = new Map<string, string>();
  let pos = START_TAG.lastIndex;
  for (;;) {
    START_TAG_END.lastIndex = pos;
    const close = START_TAG_END.exec(input);
    if (close) {
      const element: HtmlElement = {
        type: 'element',
        tag: name.toLowerCase(),
        attrs,
        children: [],
      };
      return {
        element,
        selfClosing: close[1] === '/',
        end: START_TAG_END.lastIndex,
      };
    }

    ATTRIBUTE.lastIndex = pos;
    const attribute = ATTRIBUTE.exec(input);
    if (!attribute) return null;
    const [, attributeName = '', doubleQuoted, singleQuoted, unquoted] =
      attribute;
    const key = attributeName.toLowerCase();
    // As in browsers, the first occurrence of a duplicated attribute wins.
    if (!attrs.has(key)) {
      attrs.set(
        key,
        decodeEntities(doubleQuoted ?? singleQuoted ?? unquoted ?? ''),
      );
    }
    pos = ATTRIBUTE.lastIndex;
  }
}

/** Decodes numeric references and the few named entities that appear in embed attributes. */
export function decodeEntities(value: string): string {
  return value.replace(
    /&(#[0-9]{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z]+);/g,
    (reference, body: string) => {
      if (!body.startsWith('#')) return NAMED_ENTITIES.get(body) ?? reference;
      const hex = body[1] === 'x' || body[1] === 'X';
      const codePoint = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      const valid =
        codePoint > 0 &&
        codePoint <= 0x10ffff &&
        (codePoint < 0xd800 || codePoint > 0xdfff);
      return valid ? String.fromCodePoint(codePoint) : reference;
    },
  );
}

export function hasClass(element: HtmlElement, name: string): boolean {
  return (element.attrs.get('class') ?? '').split(/\s+/).includes(name);
}

/** All descendant elements in document order. */
export function descendants(nodes: readonly HtmlNode[]): HtmlElement[] {
  const found: HtmlElement[] = [];
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    found.push(node, ...descendants(node.children));
  }
  return found;
}

/** An allowed attribute, optionally restricted to values matching a pattern. */
export type AttributeRule = string | { name: string; value: RegExp };

/** Allowed elements and, for each, its allowed attributes. */
export type Whitelist = ReadonlyMap<string, readonly AttributeRule[]>;

const URL_ATTRIBUTES = new Set(['href', 'cite']);
const HTTP_URL = /^https?:\/\//i;

/**
 * Rebuilds markup from whitelisted elements and attributes only. Elements not on the list
 * are dropped together with their content; `href` and `cite` must be http(s) URLs. Text is
 * copied as written: the tokenizer guarantees it contains no `<`, so it cannot open a tag.
 */
export function rebuild(
  nodes: readonly HtmlNode[],
  whitelist: Whitelist,
): string {
  let html = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      html += node.raw;
      continue;
    }
    if (node.type !== 'element') continue;
    const allowed = whitelist.get(node.tag);
    if (!allowed) continue;

    html += `<${node.tag}`;
    for (const rule of allowed) {
      const name = typeof rule === 'string' ? rule : rule.name;
      const value = node.attrs.get(name);
      if (value === undefined) continue;
      if (typeof rule !== 'string' && !rule.value.test(value)) continue;
      if (URL_ATTRIBUTES.has(name) && !HTTP_URL.test(value)) continue;
      html += ` ${name}="${escapeAttribute(value)}"`;
    }
    html += '>';
    if (!VOID_TAGS.has(node.tag))
      html += `${rebuild(node.children, whitelist)}</${node.tag}>`;
  }
  return html;
}

export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
