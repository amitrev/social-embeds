import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { needsLookup } from '../../src/parser/lookup';
import { verifyEmbed } from '../../src/parser/verify';
import oembed from '../fixtures/tumblr/oembed.html?raw';

const base = {
  platform: 'tumblr',
  kind: 'post',
  variant: 'iframe',
  url: 'https://www.tumblr.com/staff/832577330595643392',
  id: '832577330595643392',
  options: {},
} as const;

describe('Tumblr embed code', () => {
  it('parses oEmbed code by its blog and post, dropping the token', () => {
    expect(parseEmbed(oembed)).toEqual(base);
  });

  it('accepts post.js with any cache key', () => {
    expect(parseEmbed(oembed.replace(/_v=[0-9a-f]+/, '_v=1'))).toEqual(base);
  });

  it('passes verifyEmbed', () => {
    const embed = parseEmbed(oembed);
    expect(embed && verifyEmbed(embed)).toEqual(embed);
  });

  it.each([
    [
      'a link to another post',
      oembed.replace('/staff/832577330595643392"', '/staff/1"'),
    ],
    [
      'a frame for another post',
      oembed.replace('/832577330595643392/v2', '/1/v2'),
    ],
    ['another frame host', oembed.replace('embed.tumblr.com', 'example.com')],
    ['a foreign script', oembed.replace('assets.tumblr.com', 'example.com')],
    ['another class', oembed.replace('tumblr-post', 'other-post')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Tumblr URLs', () => {
  it.each([
    'https://www.tumblr.com/staff/832577330595643392',
    'https://www.tumblr.com/staff/832577330595643392/ao3-is-down',
    'https://tumblr.com/staff/832577330595643392',
    'https://staff.tumblr.com/post/832577330595643392',
    'https://staff.tumblr.com/post/832577330595643392/ao3-is-down',
  ])('matches %s', (url) => {
    expect(matchUrl(url)).toEqual(base);
    expect(needsLookup(url)).toBeNull();
  });

  it.each([
    'https://www.tumblr.com/dashboard',
    'https://www.tumblr.com/staff',
    'https://www.tumblr.com/tagged/832577330595643392',
    'https://assets.tumblr.com/post/832577330595643392',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
