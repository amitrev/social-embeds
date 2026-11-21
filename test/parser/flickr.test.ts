import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { decodeFlickrCode } from '../../src/parser/platforms/flickr';
import { verifyEmbed } from '../../src/parser/verify';
import albumDialog from '../fixtures/flickr/embed-dialog-album.html?raw';
import headerFooter from '../fixtures/flickr/embed-dialog-header-footer.html?raw';
import slideshow from '../fixtures/flickr/embed-dialog-slideshow.html?raw';
import dialog from '../fixtures/flickr/embed-dialog.html?raw';
import oembedAlbum from '../fixtures/flickr/oembed-album.html?raw';
import oembed from '../fixtures/flickr/oembed.html?raw';

const ID = '55618331478';
const PHOTO_URL = `https://www.flickr.com/photos/flickr/${ID}/`;
const IMG = `${ID}_aa284e58b6_4k.jpg`;
const base = { platform: 'flickr', kind: 'post', variant: 'iframe' } as const;

describe('decodeFlickrCode', () => {
  it('decodes base 58', () => {
    expect(decodeFlickrCode('2sJNueC')).toBe(ID);
    expect(decodeFlickrCode('2oKLMQ')).toBe('913860170');
  });

  it.each(['', '0OIl', '2sJNue!', ' ', '2sJ Nu'])('rejects %j', (code) => {
    expect(decodeFlickrCode(code)).toBeNull();
  });
});

describe('Flickr embed code', () => {
  it('parses the dialog code with the image ratio and the linked image', () => {
    expect(parseEmbed(dialog)).toEqual({
      ...base,
      url: PHOTO_URL,
      id: ID,
      options: {},
      size: { width: 4096, height: 2301 },
      fallbackHtml: `<a href="${PHOTO_URL}"><img src="https://live.staticflickr.com/65535/${IMG}" width="4096" height="2301" alt="Flickr for the Planet Feature - Rio Arrayanes, Patagonia Argentina"></a>`,
    });
  });

  it('keeps header and footer', () => {
    expect(parseEmbed(headerFooter)?.options).toEqual({
      header: true,
      footer: true,
    });
  });

  it('keeps context', () => {
    expect(parseEmbed(slideshow)?.options).toEqual({ context: true });
  });

  it('parses an album', () => {
    expect(parseEmbed(albumDialog)).toMatchObject({
      ...base,
      url: 'https://www.flickr.com/photos/flickr/albums/72157716823987722',
      id: '72157716823987722',
      size: { width: 800, height: 600 },
    });
  });

  it('parses the oEmbed code, single-quoted and unclosed', () => {
    expect(parseEmbed(oembed)).toMatchObject({ id: ID, url: PHOTO_URL });
    expect(parseEmbed(oembedAlbum)).toMatchObject({
      id: '72157716823987722',
    });
  });

  it('drops an image on another host from the fallback', () => {
    const html = dialog.replace('live.staticflickr.com', 'example.com');
    expect(parseEmbed(html)?.fallbackHtml).toBe(`<a href="${PHOTO_URL}"></a>`);
  });

  it('accepts a farm host', () => {
    const html = dialog.replace(
      'live.staticflickr.com',
      'farm5.staticflickr.com',
    );
    expect(parseEmbed(html)?.fallbackHtml).toContain('farm5.staticflickr.com');
  });

  it('passes verifyEmbed with its fallback', () => {
    for (const html of [
      dialog,
      headerFooter,
      slideshow,
      albumDialog,
      oembed,
      oembedAlbum,
    ]) {
      const embed = parseEmbed(html);
      expect(embed?.fallbackHtml).toBeDefined();
      expect(embed && verifyEmbed(embed)).toEqual(embed);
    }
  });

  it('verifyEmbed strips a foreign image from a host-built fallback', () => {
    const embed = parseEmbed(dialog);
    if (!embed) throw new Error('did not parse');
    const forged = {
      ...embed,
      fallbackHtml: '<img src="https://example.com/x.jpg">',
    };
    expect(verifyEmbed(forged)?.fallbackHtml).toBeUndefined();
  });

  it.each([
    ['another link host', dialog.replace('www.flickr.com', 'example.com')],
    ['a missing marker', dialog.replace(' data-flickr-embed="true"', '')],
    ['a non-numeric id', dialog.replaceAll(`/${ID}/`, '/abc/')],
    ['a foreign script', dialog.replace('embedr.flickr.com', 'example.com')],
    ['no image', dialog.replace(/<img[^>]*>/, '')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Flickr URLs', () => {
  it.each([
    PHOTO_URL,
    `https://www.flickr.com/photos/flickr/${ID}`,
    `https://flickr.com/photos/flickr/${ID}/in/photostream/`,
  ])('matches %s', (url) => {
    expect(matchUrl(url)).toEqual({
      ...base,
      url: PHOTO_URL,
      id: ID,
      options: {},
    });
  });

  it('matches an album', () => {
    expect(
      matchUrl('https://www.flickr.com/photos/flickr/albums/72157716823987722'),
    ).toEqual({
      ...base,
      url: 'https://www.flickr.com/photos/flickr/albums/72157716823987722',
      id: '72157716823987722',
      options: {},
    });
  });

  it('gives a short link the same id as the long URL, under its own URL', () => {
    const short = matchUrl('https://flic.kr/p/2sJNueC');
    expect(short).toEqual({
      ...base,
      url: 'https://flic.kr/p/2sJNueC',
      id: ID,
      options: {},
    });
    expect(short?.id).toBe(matchUrl(PHOTO_URL)?.id);
    expect(matchUrl('https://flic.kr/p/2oKLMQ')?.id).toBe('913860170');
  });

  it('round-trips a short link', () => {
    const short = matchUrl('https://flic.kr/p/2sJNueC');
    expect(short && matchUrl(short.url)).toEqual(short);
    expect(short && verifyEmbed(short)).toEqual(short);
  });

  it.each([
    'https://flic.kr/p/0OIl',
    'https://flic.kr/p/',
    'https://flic.kr/p/12sJNueC',
    'https://flic.kr/s/aHsk',
    'https://www.flickr.com/photos/flickr/',
    'https://www.flickr.com/photos/flickr/abc',
    'https://www.flickr.com/explore',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
