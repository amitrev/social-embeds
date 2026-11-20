import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import captioned from '../fixtures/instagram/post-captioned.html?raw';

const post = (type: string, code: string) =>
  ({
    platform: 'instagram',
    kind: 'post',
    url: `https://www.instagram.com/${type}/${code}/`,
    id: code,
    variant: 'sdk',
  }) as const;

const link =
  'https://www.instagram.com/p/Df75lxnmIrF/?utm_source=ig_embed&amp;utm_campaign=loading';

describe('Instagram embed code', () => {
  it('parses the oEmbed code with caption', () => {
    expect(parseEmbed(captioned)).toEqual({
      ...post('p', 'Df75lxnmIrF'),
      options: { captioned: true, version: 14 },
      // Inline styles and the logo SVG are dropped; the placeholder structure, the
      // "View this post" text and the attribution link remain.
      fallbackHtml:
        `<div> <a href="${link}"> <div> <div></div> <div> <div></div> <div></div></div></div>` +
        '<div></div> <div></div><div> <div>View this post on Instagram</div></div><div></div> ' +
        '<div><div> <div></div> <div></div> <div></div></div><div> <div></div> <div></div></div>' +
        '<div> <div></div> <div></div> <div></div></div></div> <div> <div></div> <div></div></div></a>' +
        `<p><a href="${link}">A post shared by Instagram (@instagram)</a></p></div>`,
    });
  });

  it('reads captioned only from the attribute being present', () => {
    const code = captioned.replace(' data-instgrm-captioned', '');
    expect(parseEmbed(code)?.options).toEqual({ version: 14 });
  });

  it('falls back to the last post link when the permalink attribute is missing', () => {
    const code = captioned.replace(/ data-instgrm-permalink="[^"]*"/, '');
    expect(parseEmbed(code)).toMatchObject(post('p', 'Df75lxnmIrF'));
  });

  it.each([
    ['https://www.instagram.com/reel/DfkYarGBOtk/', 'reel', 'DfkYarGBOtk'],
    ['https://www.instagram.com/reels/DfkYarGBOtk/', 'reel', 'DfkYarGBOtk'],
    ['https://www.instagram.com/tv/DfkYarGBOtk/', 'tv', 'DfkYarGBOtk'],
  ])('canonicalises a %s permalink', (permalink, type, code) => {
    const html = captioned.replace(
      /data-instgrm-permalink="[^"]*"/,
      `data-instgrm-permalink="${permalink}"`,
    );
    expect(parseEmbed(html)).toMatchObject(post(type, code));
  });

  it('accepts the https script URL too', () => {
    const code = captioned.replace(
      'src="//www.instagram.com/embed.js"',
      'src="https://www.instagram.com/embed.js"',
    );
    expect(parseEmbed(code)?.id).toBe('Df75lxnmIrF');
  });

  it('rejects a permalink that is not a post', () => {
    const code = captioned.replace(
      /data-instgrm-permalink="[^"]*"/,
      'data-instgrm-permalink="https://www.instagram.com/instagram/"',
    );
    expect(parseEmbed(code)).toBeNull();
  });
});

describe('Instagram URLs', () => {
  it.each([
    ['https://www.instagram.com/p/Df75lxnmIrF/', 'p', 'Df75lxnmIrF'],
    ['https://instagram.com/p/Df75lxnmIrF', 'p', 'Df75lxnmIrF'],
    [
      'https://www.instagram.com/p/Df75lxnmIrF/?utm_source=ig_web_copy_link&igsh=abc',
      'p',
      'Df75lxnmIrF',
    ],
    ['https://www.instagram.com/reel/DfkYarGBOtk/', 'reel', 'DfkYarGBOtk'],
    ['https://www.instagram.com/reels/DfkYarGBOtk/', 'reel', 'DfkYarGBOtk'],
    ['https://www.instagram.com/tv/DfkYarGBOtk/', 'tv', 'DfkYarGBOtk'],
    ['https://www.instagram.com/instagram/p/Df75lxnmIrF/', 'p', 'Df75lxnmIrF'],
    [
      'https://www.instagram.com/instagram/reel/DfkYarGBOtk/',
      'reel',
      'DfkYarGBOtk',
    ],
  ])('%s', (url, type, code) => {
    expect(matchUrl(url)).toEqual({ ...post(type, code), options: {} });
  });

  it.each([
    'https://www.instagram.com/instagram/',
    'https://www.instagram.com/instagram/tv/DfkYarGBOtk/',
    'https://www.instagram.com/p/reel/DfkYarGBOtk/',
    'https://www.instagram.com/stories/instagram/123/',
    'https://www.instagram.com/p/',
    'https://instagr.am/p/Df75lxnmIrF/',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
