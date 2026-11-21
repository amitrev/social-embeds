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
    [
      'a ratio of zero',
      dialog.replace('data-aspect-ratio="1"', 'data-aspect-ratio="0"'),
    ],
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
