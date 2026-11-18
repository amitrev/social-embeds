import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import comment from '../fixtures/reddit/comment-share.html?raw';
import post from '../fixtures/reddit/post-share.html?raw';

const POST_URL = 'https://www.reddit.com/r/bulgaria/comments/1xz8iq4/';
const COMMENT_URL =
  'https://www.reddit.com/r/bulgaria/comments/1xz8iq4/comment/19st69pk12h39/';

describe('Reddit embed code', () => {
  it('parses a post', () => {
    expect(parseEmbed(post)).toEqual({
      platform: 'reddit',
      kind: 'post',
      url: POST_URL,
      id: '1xz8iq4',
      variant: 'iframe',
      options: {},
      size: { height: 316 },
    });
  });

  it('parses a comment', () => {
    expect(parseEmbed(comment)).toEqual({
      platform: 'reddit',
      kind: 'post',
      url: COMMENT_URL,
      id: '19st69pk12h39',
      variant: 'iframe',
      options: {},
      size: { height: 240 },
    });
  });

  it('reads the data-embed options', () => {
    expect(
      parseEmbed(
        post.replace(
          'data-embed-height="316"',
          'data-embed-height="316" data-embed-theme="dark" data-embed-showmedia="false" data-embed-locale="bg-BG" data-embed-depth="2"',
        ),
      )?.options,
    ).toEqual({ theme: 'dark', showmedia: false, locale: 'bg-BG', depth: 2 });
  });

  it('rejects a blockquote without a post link', () => {
    expect(
      parseEmbed(
        '<blockquote class="reddit-embed-bq"><a href="https://www.reddit.com/r/bulgaria/">bulgaria</a></blockquote>',
      ),
    ).toBeNull();
  });

  it('rejects another script', () => {
    expect(
      parseEmbed(
        post.replace(
          'https://embed.reddit.com/widgets.js',
          'https://example.com/widgets.js',
        ),
      ),
    ).toBeNull();
  });
});

describe('Reddit URLs', () => {
  it.each([
    [POST_URL, '1xz8iq4', POST_URL],
    [
      'https://reddit.com/r/bulgaria/comments/1xz8iq4/some_title/?utm_source=share',
      '1xz8iq4',
      POST_URL,
    ],
    ['https://old.reddit.com/r/bulgaria/comments/1xz8iq4', '1xz8iq4', POST_URL],
    [COMMENT_URL, '19st69pk12h39', COMMENT_URL],
    [
      'https://www.reddit.com/r/bulgaria/comments/1xz8iq4/some_title/19st69pk12h39/',
      '19st69pk12h39',
      COMMENT_URL,
    ],
  ])('%s', (input, id, url) => {
    expect(matchUrl(input)).toEqual({
      platform: 'reddit',
      kind: 'post',
      url,
      id,
      variant: 'iframe',
      options: {},
    });
  });

  it.each([
    'https://redd.it/1xz8iq4',
    'https://www.reddit.com/r/bulgaria/s/AbCdEf123',
    'https://www.reddit.com/r/bulgaria/',
    'https://www.reddit.com/user/TastyAd579/',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
