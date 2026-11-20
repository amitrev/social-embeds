import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import comment from '../fixtures/reddit/comment-share.html?raw';
import post from '../fixtures/reddit/post-share.html?raw';

const POST_URL = 'https://www.reddit.com/r/reddit/comments/11zso11/';
const COMMENT_URL =
  'https://www.reddit.com/r/reddit/comments/11zso11/comment/jde89cx/';

describe('Reddit embed code', () => {
  it('parses a post', () => {
    expect(parseEmbed(post)).toEqual({
      platform: 'reddit',
      kind: 'post',
      url: POST_URL,
      id: '11zso11',
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
      id: 'jde89cx',
      variant: 'iframe',
      options: {},
      size: { height: 552 },
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
        '<blockquote class="reddit-embed-bq"><a href="https://www.reddit.com/r/reddit/">reddit</a></blockquote>',
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
    [POST_URL, '11zso11', POST_URL],
    [
      'https://reddit.com/r/reddit/comments/11zso11/some_title/?utm_source=share',
      '11zso11',
      POST_URL,
    ],
    ['https://old.reddit.com/r/reddit/comments/11zso11', '11zso11', POST_URL],
    [COMMENT_URL, 'jde89cx', COMMENT_URL],
    [
      'https://www.reddit.com/r/reddit/comments/11zso11/some_title/jde89cx/',
      'jde89cx',
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
    'https://redd.it/11zso11',
    'https://www.reddit.com/r/reddit/s/AbCdEf123',
    'https://www.reddit.com/r/reddit/',
    'https://www.reddit.com/user/joyventure/',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
