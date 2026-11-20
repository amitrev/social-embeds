import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { needsLookup } from '../../src/parser/lookup';
import { verifyEmbed } from '../../src/parser/verify';
import oembed from '../fixtures/bluesky/oembed.html?raw';

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';
const URL = `https://bsky.app/profile/${DID}/post/3mxu3hsnebc2v`;
const base = {
  platform: 'bluesky',
  kind: 'post',
  variant: 'iframe',
  url: URL,
  id: `${DID}/app.bsky.feed.post/3mxu3hsnebc2v`,
} as const;

describe('Bluesky embed code', () => {
  it('parses oEmbed code with its post text as fallback content', () => {
    expect(parseEmbed(oembed)).toEqual({
      ...base,
      options: {
        cid: 'bafyreihprzpev5lpm4wkevfteaurguvmtmzq4cmg6guzwxvmlumvfdcsmy',
      },
      fallbackHtml: `<p lang="en">saw some cool clouds today</p>&mdash; <a href="https://bsky.app/profile/${DID}?ref_src=embed">Bluesky (@bsky.app)</a> <a href="${URL}?ref_src=embed">2026-10-14T17:35:30.592Z</a>`,
    });
  });

  it('keeps the colour mode', () => {
    const html = oembed.replace(
      'data-bluesky-cid=',
      'data-bluesky-embed-color-mode="dark" data-bluesky-cid=',
    );
    expect(parseEmbed(html)?.options).toMatchObject({ colorMode: 'dark' });
  });

  it('drops an unknown colour mode', () => {
    const html = oembed.replace(
      'data-bluesky-cid=',
      'data-bluesky-embed-color-mode="neon" data-bluesky-cid=',
    );
    expect(parseEmbed(html)?.options).not.toHaveProperty('colorMode');
  });

  it('passes verifyEmbed with its fallback content', () => {
    const embed = parseEmbed(oembed);
    expect(embed && verifyEmbed(embed)).toEqual(embed);
  });

  it.each([
    [
      'a post link that names another post',
      oembed.replace(
        '/post/3mxu3hsnebc2v?ref_src',
        '/post/3aaaaaaaaaaaa?ref_src',
      ),
    ],
    [
      'no post link',
      oembed.replace(/<a href="[^"]*\/post\/[^"]*">[^<]*<\/a>/, ''),
    ],
    [
      'an AT URI that is not a post',
      oembed.replace('app.bsky.feed.post', 'app.bsky.feed.like'),
    ],
    [
      'a foreign script',
      oembed.replace('embed.bsky.app/static', 'example.com/static'),
    ],
    ['another class', oembed.replace('bluesky-embed', 'other-embed')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Bluesky URLs', () => {
  it.each(['a', 'ab', 'a.b'])('matches the short record key %s', (rkey) => {
    expect(
      matchUrl(`https://bsky.app/profile/${DID}/post/${rkey}`),
    ).not.toBeNull();
  });

  it.each(['.', '..'])('does not match the record key %s', (rkey) => {
    expect(matchUrl(`https://bsky.app/profile/${DID}/post/${rkey}`)).toBeNull();
    expect(parseEmbed(oembed.replaceAll('3mxu3hsnebc2v', rkey))).toBeNull();
  });

  it('matches a post URL with a DID', () => {
    expect(matchUrl(`${URL}?ref_src=embed`)).toEqual({ ...base, options: {} });
  });

  it('does not match a post URL with a handle, which needs a lookup', () => {
    const url = 'https://bsky.app/profile/bsky.app/post/3mxu3hsnebc2v';
    expect(matchUrl(url)).toBeNull();
    expect(needsLookup(url)).toBe('bluesky');
  });

  it.each([
    'https://example.com/',
    URL,
    `https://bsky.app/profile/${DID}`,
    'not a url',
    'https://bsky.app/profile/did:plc:Z72I7HDYNMK6R22Z27H6TVUR/post/3mxu3hsnebc2v',
    'https://bsky.app/profile/did:key:z6Mk/post/3mxu3hsnebc2v',
    'https://bsky.app/profile/not a handle/post/3mxu3hsnebc2v',
  ])('needs no lookup for %s', (url) => {
    expect(needsLookup(url)).toBeNull();
  });
});
