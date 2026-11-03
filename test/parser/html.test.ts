import { describe, expect, it } from 'vitest';
import {
  decodeEntities,
  descendants,
  type HtmlElement,
  type HtmlNode,
  parseHtml,
  rebuild,
} from '../../src/parser/html';

function only(nodes: HtmlNode[] | null): HtmlElement {
  const [node] = nodes ?? [];
  if (node?.type !== 'element') throw new Error('expected one element');
  return node;
}

describe('parseHtml', () => {
  it('builds a tree with lower-cased names and decoded attribute values', () => {
    const root = only(
      parseHtml(
        '<BlockQuote Class="a b" data-x=\'1\' data-y=2 data-flag><p>Hi &amp; bye</p></BlockQuote>',
      ),
    );
    expect(root.tag).toBe('blockquote');
    expect([...root.attrs]).toEqual([
      ['class', 'a b'],
      ['data-x', '1'],
      ['data-y', '2'],
      ['data-flag', ''],
    ]);
    expect(root.children).toEqual([
      {
        type: 'element',
        tag: 'p',
        attrs: new Map(),
        children: [{ type: 'text', raw: 'Hi &amp; bye' }],
      },
    ]);
  });

  it('decodes entities in attributes', () => {
    const root = only(
      parseHtml('<a href="https://a.test/?x=1&amp;y=&#39;2&#x27;">t</a>'),
    );
    expect(root.attrs.get('href')).toBe("https://a.test/?x=1&y='2'");
  });

  it('keeps the first of duplicated attributes', () => {
    expect(only(parseHtml('<a href="1" href="2"></a>')).attrs.get('href')).toBe(
      '1',
    );
  });

  it('handles void elements, self-closing tags and comments', () => {
    const nodes = parseHtml(
      '<p>a<br>b<br/></p><!-- note --><svg><path d="M0"/></svg>',
    );
    expect(nodes?.map((node) => node.type)).toEqual([
      'element',
      'comment',
      'element',
    ]);
    expect(descendants(nodes ?? []).map((element) => element.tag)).toEqual([
      'p',
      'br',
      'br',
      'svg',
      'path',
    ]);
  });

  it('reads script content as raw text', () => {
    const script = only(parseHtml('<script>if (a < b) {}</SCRIPT >'));
    expect(script.children).toEqual([{ type: 'text', raw: 'if (a < b) {}' }]);
  });

  it.each([
    ['an unclosed element', '<blockquote><p>x</p>'],
    ['a mismatched end tag', '<p><a>x</p></a>'],
    ['an end tag with nothing open', '</p>'],
    ['a stray <', '<p>a < b</p>'],
    ['an unterminated quote', '<a href="x>t</a>'],
    ['an unterminated comment', '<!-- x'],
    ['an unclosed script', '<script>x'],
    ['attributes without separating space', '<a class="a"id="b"></a>'],
    [
      'nesting deeper than 100 levels',
      '<div>'.repeat(101) + '</div>'.repeat(101),
    ],
  ])('rejects %s', (_, input) => {
    expect(parseHtml(input)).toBeNull();
  });
});

describe('decodeEntities', () => {
  it('decodes numeric and known named references', () => {
    expect(decodeEntities('&lt;&#169;&#xA9;&quot;&apos;&nbsp;')).toBe(
      '<©©"\' ',
    );
  });

  it('leaves unknown names, missing semicolons and invalid code points alone', () => {
    expect(decodeEntities('&copy; &amp &#xD800; &#0;')).toBe(
      '&copy; &amp &#xD800; &#0;',
    );
  });
});

describe('rebuild', () => {
  const whitelist = new Map([
    ['p', []],
    ['a', ['href']],
    ['br', []],
  ]);

  it('keeps whitelisted elements and attributes and drops everything else', () => {
    const nodes = parseHtml(
      '<p class="x">Hi <a href="https://a.test/?q=1&amp;r=2" onclick="evil()">link</a><br>' +
        '<span>gone</span><script>gone()</script></p>',
    );
    expect(rebuild(nodes ?? [], whitelist)).toBe(
      '<p>Hi <a href="https://a.test/?q=1&amp;r=2">link</a><br></p>',
    );
  });

  it('drops non-http(s) links', () => {
    const nodes = parseHtml(
      '<a href="javascript:alert(1)">x</a><a href="//a.test">y</a>',
    );
    expect(rebuild(nodes ?? [], whitelist)).toBe('<a>x</a><a>y</a>');
  });

  it('escapes attribute values', () => {
    const nodes = parseHtml('<a href="https://a.test/&quot;&gt;&lt;">x</a>');
    expect(rebuild(nodes ?? [], whitelist)).toBe(
      '<a href="https://a.test/&quot;&gt;&lt;">x</a>',
    );
  });
});
