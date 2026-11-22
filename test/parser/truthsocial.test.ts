import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed, parseIframe } from '../../src/parser';
import { truthsocial } from '../../src/parser/platforms/truthsocial';
import { parseUrl } from '../../src/parser/url';
import { verifyEmbed } from '../../src/parser/verify';
import video from '../fixtures/truthsocial/embed-dialog-video.html?raw';
import text from '../fixtures/truthsocial/oembed-text.html?raw';

const base = {
  platform: 'truthsocial',
  kind: 'post',
  variant: 'iframe',
} as const;

describe('Truth Social embed code', () => {
  it('parses a text post with the code’s width', () => {
    expect(parseEmbed(text)).toEqual({
      ...base,
      url: 'https://truthsocial.com/@truthsocial/posts/108318911610590772',
      id: '108318911610590772',
      options: {},
      size: { width: 600 },
    });
  });

  it('marks a video post', () => {
    expect(parseEmbed(video)).toEqual({
      ...base,
      url: 'https://truthsocial.com/@truthsocial/posts/117529982042129746',
      id: '117529982042129746',
      options: { video: true },
      size: { width: 600 },
    });
  });

  it('keeps 18-digit ids as strings', () => {
    expect(parseEmbed(text)?.id).toBe('108318911610590772');
  });

  it('drops the code’s style and class', () => {
    expect(parseEmbed(text)?.options).toEqual({});
  });

  it('passes verifyEmbed', () => {
    for (const html of [text, video]) {
      const embed = parseEmbed(html);
      expect(embed && verifyEmbed(embed)).toEqual(embed);
    }
  });

  it.each([
    ['another host', text.replace('truthsocial.com/@', 'example.com/@')],
    ['a non-numeric id', text.replace('/108318911610590772/', '/abc/')],
    ['no embed path', text.replace('/embed"', '/"')],
    [
      'a foreign script',
      text.replace('truthsocial.com/embed.js', 'x.test/e.js'),
    ],
    ['a user-less path', text.replace('/@truthsocial/', '/')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Truth Social URLs', () => {
  it.each([
    'https://truthsocial.com/@truthsocial/posts/117529982042129746',
    'https://www.truthsocial.com/@truthsocial/posts/117529982042129746',
    'https://truthsocial.com/@truthsocial/117529982042129746',
  ])('matches %s', (url) => {
    expect(matchUrl(url)).toEqual({
      ...base,
      url: 'https://truthsocial.com/@truthsocial/posts/117529982042129746',
      id: '117529982042129746',
      options: {},
    });
  });

  it('matches a short id', () => {
    expect(
      matchUrl('https://truthsocial.com/@truthsocial/posts/1'),
    ).toMatchObject({ platform: 'truthsocial', kind: 'post' });
  });

  it.each([
    'https://truthsocial.com/@truthsocial',
    'https://truthsocial.com/embed/117529982042129746',
    'https://truthsocial.com/@truthsocial/posts/abc',
    'https://truthsocial.com/users/x/statuses/1',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});

describe('Truth Social frame guard', () => {
  const owns = (src: string): boolean => {
    const url = parseUrl(src);
    return url !== null && truthsocial.ownsFrame?.(url) === true;
  };

  it.each([
    'https://truthsocial.com/@truthsocial/117529982042129746/embed',
    'https://truthsocial.com/@truthsocial',
    'https://truthsocial.com/@truthsocial/1/embed?x=1',
  ])('owns %s', (src) => {
    expect(owns(src)).toBe(true);
  });

  it.each([
    'https://truthsocial.com/about',
    'https://example.com/@truthsocial/1/embed',
  ])('does not own %s', (src) => {
    expect(owns(src)).toBe(false);
  });

  it('keeps an owned frame the parser rejects off the generic path', () => {
    expect(
      parseIframe(
        '<iframe src="https://truthsocial.com/@truthsocial"></iframe>',
      ),
    ).toBeNull();
  });
});
