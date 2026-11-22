import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { needsLookup } from '../../src/parser/lookup';
import { verifyEmbed } from '../../src/parser/verify';
import oembed from '../fixtures/tumblr/oembed.html?raw';

const base = {
  platform: 'tumblr',
  kind: 'post',
  variant: 'iframe',
  url: 'https://www.tumblr.com/staff/828009069026721792',
  id: '828009069026721792',
  options: {},
} as const;

describe('Tumblr embed code', () => {
  it('parses oEmbed code by its blog and post, dropping the token', () => {
    expect(parseEmbed(oembed)).toEqual(base);
  });

  it('accepts a frame that names the same blog', () => {
    expect(
      parseEmbed(oembed.replace('t:0aY0xL2Fi1OFJg4YxpmegQ', 'staff')),
    ).toEqual(base);
  });

  it('accepts older code: no `/v2` or `t:`, and secure.assets.tumblr.com', () => {
    const older = oembed
      .replace(
        't:0aY0xL2Fi1OFJg4YxpmegQ/828009069026721792/v2',
        '0aY0xL2Fi1OFJg4YxpmegQ/828009069026721792',
      )
      .replace(
        /https:\/\/assets\.tumblr\.com\/post\.js\?_v=[0-9a-f]+/,
        'https://secure.assets.tumblr.com/post.js',
      );
    expect(older).toContain('secure.assets.tumblr.com/post.js"');
    expect(parseEmbed(older)).toEqual(base);
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
      oembed.replace(
        '/staff/828009069026721792/premium-just-got-better"',
        '/staff/1/premium-just-got-better"',
      ),
    ],
    [
      'a frame for another post',
      oembed.replace('/828009069026721792/v2', '/1/v2'),
    ],
    [
      'an older frame for another post',
      oembed.replace(
        't:0aY0xL2Fi1OFJg4YxpmegQ/828009069026721792/v2',
        '0aY0xL2Fi1OFJg4YxpmegQ/1',
      ),
    ],
    [
      'a frame with another version',
      oembed.replace('/828009069026721792/v2', '/828009069026721792/v3'),
    ],
    [
      'a frame for another blog',
      oembed.replace(
        't:0aY0xL2Fi1OFJg4YxpmegQ/828009069026721792',
        'someoneelse/828009069026721792',
      ),
    ],
    ['another frame host', oembed.replace('embed.tumblr.com', 'example.com')],
    ['a foreign script', oembed.replace('assets.tumblr.com', 'example.com')],
    [
      'a script on another subdomain',
      oembed.replace('assets.tumblr.com', 'cdn.assets.tumblr.com'),
    ],
    ['another class', oembed.replace('tumblr-post', 'other-post')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Tumblr URLs', () => {
  it.each([
    'https://www.tumblr.com/staff/828009069026721792',
    'https://www.tumblr.com/staff/828009069026721792/premium-just-got-better',
    'https://tumblr.com/staff/828009069026721792',
    'https://staff.tumblr.com/post/828009069026721792',
    'https://staff.tumblr.com/post/828009069026721792/premium-just-got-better',
  ])('matches %s', (url) => {
    expect(matchUrl(url)).toEqual(base);
    expect(needsLookup(url)).toBeNull();
  });

  it.each([
    'https://www.tumblr.com/dashboard',
    'https://www.tumblr.com/staff',
    'https://www.tumblr.com/tagged/828009069026721792',
    'https://assets.tumblr.com/post/828009069026721792',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
