import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { verifyEmbed } from '../../src/parser/verify';
import hideTitle from '../fixtures/imgur/embed-dialog-album-hide-title.html?raw';
import dialog from '../fixtures/imgur/embed-dialog-album.html?raw';
import oembedAlbum from '../fixtures/imgur/oembed-album.html?raw';
import oembedImage from '../fixtures/imgur/oembed-image.html?raw';

const base = { platform: 'imgur', kind: 'post', variant: 'iframe' } as const;
const album = {
  ...base,
  url: 'https://imgur.com/a/04b1CmA',
  id: 'a/04b1CmA',
} as const;

describe('Imgur embed code', () => {
  it('parses the dialog code with its protocol-relative link', () => {
    expect(parseEmbed(dialog)).toEqual({
      ...album,
      options: {},
      fallbackHtml:
        '<a href="https://imgur.com/a/04b1CmA">It&#39;s Imgur&#39;s 16th Birthday Week! Share Memories and Reminisce.</a>',
    });
  });

  it('keeps the hidden title as an option', () => {
    expect(parseEmbed(hideTitle)?.options).toEqual({ context: false });
  });

  it('reads analytics', () => {
    const html = dialog.replace('lang="en"', 'data-analytics="false"');
    expect(parseEmbed(html)?.options).toEqual({ analytics: false });
  });

  it('drops a context other than false', () => {
    const html = dialog.replace('lang="en"', 'data-context="true"');
    expect(parseEmbed(html)?.options).toEqual({});
  });

  it('parses the oEmbed album', () => {
    expect(parseEmbed(oembedAlbum)).toMatchObject({ ...album, options: {} });
  });

  it('parses an image with a bare id', () => {
    expect(parseEmbed(oembedImage)).toEqual({
      ...base,
      url: 'https://imgur.com/yOBT04V',
      id: 'yOBT04V',
      options: {},
      fallbackHtml:
        '<a href="https://imgur.com/yOBT04V">View post on imgur.com</a>',
    });
  });

  it('passes verifyEmbed', () => {
    for (const html of [dialog, hideTitle, oembedAlbum, oembedImage]) {
      const embed = parseEmbed(html);
      expect(embed && verifyEmbed(embed)).toEqual(embed);
    }
  });

  it('drops a link to another host from the fallback', () => {
    const html = dialog.replace('//imgur.com/a/', '//example.com/a/');
    expect(parseEmbed(html)?.fallbackHtml).toBe(
      '<a>It&#39;s Imgur&#39;s 16th Birthday Week! Share Memories and Reminisce.</a>',
    );
  });

  it.each([
    [
      'a bad id',
      dialog
        .replaceAll('a/04b1CmA"', 'a/04b/CmA"')
        .replace('data-id="a/04b1CmA"', 'data-id="a/x"'),
    ],
    ['a missing id', dialog.replace(' data-id="a/04b1CmA"', '')],
    [
      'a path in the id',
      dialog.replace('data-id="a/04b1CmA"', 'data-id="../x"'),
    ],
    ['a foreign script', dialog.replace('s.imgur.com', 'example.com')],
    ['another class', dialog.replace('imgur-embed-pub', 'other')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Imgur URLs', () => {
  it.each([
    'https://imgur.com/a/04b1CmA',
    'https://www.imgur.com/a/04b1CmA',
    'https://imgur.com/gallery/04b1CmA',
    'https://imgur.com/gallery/its-imgurs-16th-birthday-week-04b1CmA',
  ])('reaches the album form from %s', (url) => {
    expect(matchUrl(url)).toEqual({ ...album, options: {} });
  });

  it.each([
    'https://imgur.com/yOBT04V',
    'https://i.imgur.com/yOBT04V.jpg',
    'https://i.imgur.com/yOBT04V.png',
  ])('reaches the image form from %s', (url) => {
    expect(matchUrl(url)).toEqual({
      ...base,
      url: 'https://imgur.com/yOBT04V',
      id: 'yOBT04V',
      options: {},
    });
  });

  it.each([
    'https://imgur.com/',
    'https://imgur.com/upload',
    'https://imgur.com/gallery',
    'https://imgur.com/a/ab',
    'https://i.imgur.com/yOBT04V',
    'https://i.imgur.com/yOBT04V.exe',
    'https://imgur.com/user/someone',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
