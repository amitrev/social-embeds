import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import oembed from '../fixtures/vimeo/oembed.html?raw';
import responsive from '../fixtures/vimeo/responsive-docs.html?raw';

const video = {
  platform: 'vimeo',
  kind: 'video',
  url: 'https://vimeo.com/76979871',
  id: '76979871',
  variant: 'iframe',
} as const;

describe('Vimeo embed code', () => {
  it('parses the oEmbed iframe with its size, without app_id', () => {
    expect(parseEmbed(oembed)).toEqual({
      ...video,
      options: {},
      size: { width: 480, height: 270 },
    });
  });

  it("reads the responsive snippet's ratio from its wrapper", () => {
    expect(parseEmbed(responsive)).toEqual({
      ...video,
      options: { badge: 0, autopause: 0 },
      size: { width: 16, height: 9 },
    });
  });

  it('reads a vertical ratio', () => {
    expect(parseEmbed(responsive.replace('56.25%', '177.78%'))?.size).toEqual({
      width: 5000,
      height: 8889,
    });
  });

  it('keeps an unlisted video hash in the URL, and the start time', () => {
    expect(
      parseEmbed(
        oembed.replace('?app_id=122963', '?h=7a8b9c0d1e&app_id=122963#t=1m2s'),
      ),
    ).toMatchObject({
      url: 'https://vimeo.com/76979871/7a8b9c0d1e',
      id: '76979871',
      options: { t: '1m2s' },
    });
  });

  // The credit paragraph older embed code ends with.
  const credit =
    '<p><a href="https://vimeo.com/76979871">The New Vimeo Player (You Know, For Videos)</a> from <a href="https://vimeo.com/staff">Vimeo Staff</a> on <a href="https://vimeo.com">Vimeo</a>.</p>';

  it.each([
    ['the oEmbed iframe', `${oembed}\n${credit}`],
    ['the responsive snippet', responsive.replace('</div>', `</div>${credit}`)],
    ['an http credit', `${oembed} ${credit.replaceAll('https:', 'http:')}`],
  ])("accepts and drops Vimeo's credit after %s", (_, html) => {
    expect(parseEmbed(html)).toMatchObject({ ...video, options: {} });
  });

  it.each([
    ['another video', credit.replace('vimeo.com/76979871', 'vimeo.com/1')],
    [
      'a link elsewhere',
      credit.replace('https://vimeo.com/staff', 'https://example.com/staff'),
    ],
    ['an attribute', credit.replace('<p>', '<p class="credit">')],
    [
      'a link attribute',
      credit.replace(
        '<a href="https://vimeo.com">',
        '<a href="https://vimeo.com" onclick="x()">',
      ),
    ],
    ['other text', credit.replace(' on ', ' at ')],
    ['more content', credit.replace('.</p>', '. <b>!</b></p>')],
    [
      'a home link to a page',
      credit.replace('"https://vimeo.com"', '"https://vimeo.com/76979871"'),
    ],
  ])('rejects a credit with %s', (_, extra) => {
    expect(parseEmbed(`${oembed}${extra}`)).toBeNull();
  });

  it.each([
    [
      'another wrapper style',
      responsive.replace('position:relative;', 'position:relative;color:red;'),
    ],
    [
      'a wrapper with an id',
      responsive.replace('<div style=', '<div id="x" style='),
    ],
    [
      'a wrapper with two iframes',
      responsive.replace(
        '</iframe>',
        '</iframe><iframe src="https://player.vimeo.com/video/1"></iframe>',
      ),
    ],
    [
      'another script',
      responsive.replace(
        'player.vimeo.com/api/player.js',
        'example.com/player.js',
      ),
    ],
    ['another host', oembed.replace('player.vimeo.com', 'example.com')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Vimeo URLs', () => {
  it.each([
    'https://vimeo.com/76979871',
    'https://www.vimeo.com/76979871/',
    'https://vimeo.com/channels/staffpicks/76979871',
    'https://vimeo.com/groups/motion/videos/76979871',
    'https://vimeo.com/showcase/1234567/video/76979871',
    'https://player.vimeo.com/video/76979871',
  ])('%s', (url) => {
    expect(matchUrl(url)).toEqual({ ...video, options: {} });
  });

  it('keeps the hash of an unlisted video and the start time', () => {
    expect(matchUrl('https://vimeo.com/76979871/7a8b9c0d1e#t=90')).toEqual({
      ...video,
      url: 'https://vimeo.com/76979871/7a8b9c0d1e',
      options: { t: '90' },
    });
  });

  it.each(['https://vimeo.com/staff', 'https://vimeo.com/channels/staffpicks'])(
    'rejects %s',
    (url) => {
      expect(matchUrl(url)).toBeNull();
    },
  );
});
