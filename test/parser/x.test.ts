import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import basic from '../fixtures/x/oembed-basic.html?raw';
import hashtag from '../fixtures/x/oembed-hashtag.html?raw';
import link from '../fixtures/x/oembed-link.html?raw';
import withOptions from '../fixtures/x/oembed-options.html?raw';

const jack = {
  platform: 'x',
  kind: 'post',
  url: 'https://x.com/jack/status/20',
  id: '20',
  variant: 'sdk',
} as const;

describe('X embed code', () => {
  it('parses the default oEmbed code', () => {
    expect(parseEmbed(basic)).toEqual({
      ...jack,
      options: {},
      fallbackHtml:
        '<p lang="en" dir="ltr">just setting up my twttr</p>&mdash; jack (@jack) ' +
        '<a href="https://x.com/jack/status/20?ref_src=twsrc%5Etfw">March 21, 2006</a>',
    });
  });

  it('extracts options, including the plain align attribute publish.x.com emits', () => {
    expect(parseEmbed(withOptions)).toEqual({
      ...jack,
      options: {
        theme: 'dark',
        cards: 'hidden',
        align: 'center',
        lang: 'es',
        dnt: true,
        width: 400,
      },
      fallbackHtml:
        '<p lang="en" dir="ltr">just setting up my twttr</p>&mdash; jack (@jack) ' +
        '<a href="https://x.com/jack/status/20?ref_src=twsrc%5Etfw">21 de marzo de 2006</a>',
    });
  });

  it('takes the status from the last link, not links inside the text', () => {
    expect(parseEmbed(link)).toMatchObject({
      id: '266031293945503744',
      url: 'https://x.com/BarackObama/status/266031293945503744',
      fallbackHtml:
        '<p lang="en" dir="ltr">Four more years. <a href="http://t.co/bAJE6Vom">pic.twitter.com/bAJE6Vom</a></p>' +
        '&mdash; Barack Obama (@BarackObama) ' +
        '<a href="https://x.com/BarackObama/status/266031293945503744?ref_src=twsrc%5Etfw">November 7, 2012</a>',
    });
  });

  it('reproduces whitelisted content byte for byte', () => {
    const inner = /<blockquote class="twitter-tweet">(.*)<\/blockquote>/s.exec(
      hashtag,
    )?.[1];
    expect(parseEmbed(hashtag)?.fallbackHtml).toBe(inner);
  });

  it('accepts the twitter.com hosts of older embed codes', () => {
    const legacy = basic
      .replaceAll('https://x.com/', 'https://twitter.com/')
      .replace('platform.x.com', 'platform.twitter.com');
    expect(parseEmbed(legacy)).toMatchObject({ ...jack, options: {} });
  });

  it('reads data-align and data-conversation', () => {
    const code = basic.replace(
      '<blockquote class="twitter-tweet">',
      '<blockquote class="twitter-tweet" data-conversation="none" data-align="right" align="center">',
    );
    expect(parseEmbed(code)?.options).toEqual({
      conversation: 'none',
      align: 'right',
    });
  });

  it('rejects a blockquote without a status link', () => {
    expect(
      parseEmbed('<blockquote class="twitter-tweet"><p>text</p></blockquote>'),
    ).toBeNull();
  });
});

describe('X URLs', () => {
  it.each([
    'https://x.com/jack/status/20',
    'https://twitter.com/jack/status/20',
    'https://www.twitter.com/jack/status/20/',
    'https://mobile.twitter.com/jack/status/20?s=20',
    'https://x.com/jack/status/20#reply',
  ])('%s', (url) => {
    expect(matchUrl(url)).toEqual({ ...jack, options: {} });
  });

  it.each([
    'https://x.com/jack',
    'https://x.com/jack/status/abc',
    'https://x.com/i/web/status/20',
    'https://x.com/jack/status/20/photo/1',
    'https://example.com/jack/status/20',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
