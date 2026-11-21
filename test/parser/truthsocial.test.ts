import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
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
      url: 'https://truthsocial.com/@truthsocial/posts/116862065232992052',
      id: '116862065232992052',
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
    expect(parseEmbed(text)?.id).toBe('116862065232992052');
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
    ['a non-numeric id', text.replace('/116862065232992052/', '/abc/')],
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
