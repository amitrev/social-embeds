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
  'https://www.instagram.com/p/Dc85J9XNoGN/?utm_source=ig_embed&amp;utm_campaign=loading';

describe('Instagram embed code', () => {
  it('parses the embed dialog code with caption', () => {
    expect(parseEmbed(captioned)).toEqual({
      ...post('p', 'Dc85J9XNoGN'),
      options: { captioned: true, version: 14 },
      // Inline styles and the logo SVG are dropped; the placeholder structure, the
      // "View this post" text and the attribution link remain.
      fallbackHtml:
        `<div> <a href="${link}"> <div> <div></div> <div> <div></div> <div></div></div></div>` +
        '<div></div> <div></div><div> <div>View this post on Instagram</div></div><div></div> ' +
        '<div><div> <div></div> <div></div> <div></div></div><div> <div></div> <div></div></div>' +
        '<div> <div></div> <div></div> <div></div></div></div> <div> <div></div> <div></div></div></a>' +
        `<p><a href="${link}">A post shared by LuLu LoveBottom (@lululovebttm)</a></p></div>`,
    });
  });

  it('reads captioned only from the attribute being present', () => {
    const code = captioned.replace(' data-instgrm-captioned', '');
    expect(parseEmbed(code)?.options).toEqual({ version: 14 });
  });

  it('falls back to the last post link when the permalink attribute is missing', () => {
    const code = captioned.replace(/ data-instgrm-permalink="[^"]*"/, '');
    expect(parseEmbed(code)).toMatchObject(post('p', 'Dc85J9XNoGN'));
  });

  it.each([
    ['https://www.instagram.com/reel/DfQCqMnhpsG/', 'reel', 'DfQCqMnhpsG'],
    ['https://www.instagram.com/reels/DfQCqMnhpsG/', 'reel', 'DfQCqMnhpsG'],
    ['https://www.instagram.com/tv/DfQCqMnhpsG/', 'tv', 'DfQCqMnhpsG'],
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
    expect(parseEmbed(code)?.id).toBe('Dc85J9XNoGN');
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
    ['https://www.instagram.com/p/DfPQchkG1tg/', 'p', 'DfPQchkG1tg'],
    ['https://instagram.com/p/DfPQchkG1tg', 'p', 'DfPQchkG1tg'],
    [
      'https://www.instagram.com/p/DfPQchkG1tg/?utm_source=ig_web_copy_link&igsh=abc',
      'p',
      'DfPQchkG1tg',
    ],
    ['https://www.instagram.com/reel/DfQCqMnhpsG/', 'reel', 'DfQCqMnhpsG'],
    ['https://www.instagram.com/reels/DfQCqMnhpsG/', 'reel', 'DfQCqMnhpsG'],
    ['https://www.instagram.com/tv/DfQCqMnhpsG/', 'tv', 'DfQCqMnhpsG'],
    ['https://www.instagram.com/instagram/p/DfPQchkG1tg/', 'p', 'DfPQchkG1tg'],
    [
      'https://www.instagram.com/instagram/reel/DfQCqMnhpsG/',
      'reel',
      'DfQCqMnhpsG',
    ],
  ])('%s', (url, type, code) => {
    expect(matchUrl(url)).toEqual({ ...post(type, code), options: {} });
  });

  it.each([
    'https://www.instagram.com/instagram/',
    'https://www.instagram.com/instagram/tv/DfQCqMnhpsG/',
    'https://www.instagram.com/p/reel/DfQCqMnhpsG/',
    'https://www.instagram.com/stories/instagram/123/',
    'https://www.instagram.com/p/',
    'https://instagr.am/p/DfPQchkG1tg/',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
