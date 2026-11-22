import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { verifyEmbed } from '../../src/parser/verify';
import dialog from '../fixtures/tenor/embed-dialog.html?raw';
import oembed from '../fixtures/tenor/oembed.html?raw';

const ID = '12328062661350661133';
const base = {
  platform: 'tenor',
  kind: 'video',
  variant: 'iframe',
  url: `https://tenor.com/view/${ID}`,
  id: ID,
} as const;

describe('Tenor embed code', () => {
  it('parses the dialog code with its ratio and fallback links', () => {
    expect(parseEmbed(dialog)).toEqual({
      ...base,
      options: {},
      size: { width: 1, height: 1 },
      fallbackHtml:
        '<a href="https://tenor.com/view/happy-cat-day-national-cat-day-cat-day-cat-cat-lover-gif-12328062661350661133">Happy Cat Day National Cat Day Sticker</a>from <a href="https://tenor.com/search/happy+cat+day-stickers">Happy Cat Day Stickers</a>',
    });
  });

  it('defaults a code without a ratio to 1.33', () => {
    const html = dialog.replace(' data-aspect-ratio="1"', '');
    expect(parseEmbed(html)?.size).toEqual({ width: 133, height: 100 });
  });

  it('reads a fractional ratio', () => {
    const html = dialog.replace(
      'data-aspect-ratio="1"',
      'data-aspect-ratio="1.5"',
    );
    expect(parseEmbed(html)?.size).toEqual({ width: 3, height: 2 });
  });

  it('parses code with a ratio of five decimals', () => {
    const html =
      '<div class="tenor-gif-embed" data-postid="14563934" data-share-method="host" data-aspect-ratio="1.33333" data-width="100%"><a href="https://tenor.com/view/x-gif-14563934">X GIF</a></div> <script type="text/javascript" async src="https://tenor.com/embed.js"></script>';
    expect(parseEmbed(html)).toEqual({
      platform: 'tenor',
      kind: 'video',
      variant: 'iframe',
      url: 'https://tenor.com/view/14563934',
      id: '14563934',
      options: {},
      size: { width: 13333, height: 10000 },
      fallbackHtml: '<a href="https://tenor.com/view/x-gif-14563934">X GIF</a>',
    });
  });

  it.each([
    ['1.77778', { width: 8889, height: 5000 }],
    ['0.993789', { width: 4969, height: 5000 }],
    ['1.75352', { width: 3507, height: 2000 }],
    ['2.3380281690140845', { width: 1169, height: 500 }],
    ['100', { width: 100, height: 1 }],
    ['0.01', { width: 1, height: 100 }],
  ])('reads the ratio %s to four decimals', (ratio, size) => {
    const html = dialog.replace(
      'data-aspect-ratio="1"',
      `data-aspect-ratio="${ratio}"`,
    );
    const embed = parseEmbed(html);
    expect(embed?.size).toEqual(size);
    expect(embed && verifyEmbed(embed)).toEqual(embed);
  });

  it('parses the oEmbed iframe with its own size', () => {
    expect(parseEmbed(oembed)).toEqual({
      ...base,
      options: {},
      size: { width: 600, height: 400 },
    });
  });

  it('drops the frame’s canonical URL', () => {
    const html = oembed.replace(
      `embed/${ID}"`,
      `embed/${ID}?canonicalurl=https%3A%2F%2Fexample.com"`,
    );
    expect(parseEmbed(html)?.options).toEqual({});
  });

  it('passes verifyEmbed', () => {
    for (const html of [dialog, oembed]) {
      const embed = parseEmbed(html);
      expect(embed && verifyEmbed(embed)).toEqual(embed);
    }
  });

  it.each([
    ['another host', oembed.replace('tenor.com', 'example.com')],
    [
      'a non-numeric id',
      dialog.replace(`data-postid="${ID}"`, 'data-postid="x"'),
    ],
    ['a missing id', dialog.replace(` data-postid="${ID}"`, '')],
    ...[
      '0',
      '0.0000',
      '0.009',
      '100.01',
      '1000',
      '-1.5',
      '1e2',
      '1.',
      '.5',
      ' 1.5',
      'Infinity',
      `1.${'1'.repeat(21)}`,
    ].map((ratio): [string, string] => [
      `the ratio "${ratio}"`,
      dialog.replace('data-aspect-ratio="1"', `data-aspect-ratio="${ratio}"`),
    ]),
    [
      'a foreign script',
      dialog.replace('tenor.com/embed.js', 'example.com/embed.js'),
    ],
    ['an id with a path', oembed.replace(`embed/${ID}`, `embed/${ID}/x`)],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Tenor URLs', () => {
  it.each([
    `https://tenor.com/view/hello-wave-gif-${ID}`,
    `https://www.tenor.com/view/hello-wave-gif-${ID}`,
    `https://tenor.com/en-GB/view/hello-wave-gif-${ID}`,
    `https://tenor.com/view/${ID}`,
  ])('matches %s', (url) => {
    expect(matchUrl(url)).toEqual({ ...base, options: {} });
  });

  it('reads the numeric id as a string', () => {
    expect(matchUrl('https://tenor.com/view/a-gif-12345')).toMatchObject({
      platform: 'tenor',
      kind: 'video',
      variant: 'iframe',
      id: '12345',
    });
  });

  it('gives a locale URL the same canonical URL', () => {
    expect(
      matchUrl('https://tenor.com/en-GB/view/hello-wave-gif-12345')?.url,
    ).toBe(matchUrl('https://tenor.com/view/hello-wave-gif-12345')?.url);
  });

  it.each([
    'https://media.tenor.com/abc/tenor.gif',
    'https://tenor.com/search/cat-gifs',
    'https://tenor.com/view/hello-wave-gif-abc',
    'https://tenor.com/',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
