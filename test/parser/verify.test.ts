import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed, type ParsedEmbed } from '../../src/parser';
import { verifyEmbed } from '../../src/parser/verify';
import postIframe from '../fixtures/facebook/post-iframe.html?raw';
import postSdk from '../fixtures/facebook/post-sdk-docs.html?raw';
import videoSdk from '../fixtures/facebook/video-sdk-docs.html?raw';
import instagram from '../fixtures/instagram/post-captioned.html?raw';
import linkedin from '../fixtures/linkedin/post-collapsed.html?raw';
import pinterestIframe from '../fixtures/pinterest/oembed-iframe.html?raw';
import pinterest from '../fixtures/pinterest/widget-docs.html?raw';
import redditComment from '../fixtures/reddit/comment-share.html?raw';
import reddit from '../fixtures/reddit/post-share.html?raw';
import snapchatLens from '../fixtures/snapchat/lens-share.html?raw';
import snapchat from '../fixtures/snapchat/profile-share.html?raw';
import telegram from '../fixtures/telegram/widget-configurator-options.html?raw';
import threads from '../fixtures/threads/oembed.html?raw';
import tiktok from '../fixtures/tiktok/oembed-player.html?raw';
import xHashtag from '../fixtures/x/oembed-hashtag.html?raw';
import xOptions from '../fixtures/x/oembed-options.html?raw';
import youtube from '../fixtures/youtube/share-nocookie-controls-start.html?raw';

const fixtures = {
  postIframe,
  postSdk,
  videoSdk,
  instagram,
  threads,
  tiktok,
  xHashtag,
  xOptions,
  youtube,
  telegram,
  snapchat,
  snapchatLens,
  linkedin,
  reddit,
  redditComment,
  pinterest,
  pinterestIframe,
};

describe('verifyEmbed', () => {
  it.each(Object.entries(fixtures))(
    'accepts what the parser produced from %s, unchanged',
    (_, html) => {
      const embed = parseEmbed(html);
      expect(embed).not.toBeNull();
      expect(verifyEmbed(embed as ParsedEmbed)).toEqual(embed);
    },
  );

  it('accepts what matchUrl produced', () => {
    const embed = matchUrl(
      'https://www.tiktok.com/@/video/6718335390845095173',
    );
    expect(embed?.url).toBe(
      'https://www.tiktok.com/@/video/6718335390845095173',
    );
    expect(verifyEmbed(embed as ParsedEmbed)).toEqual(embed);
  });

  const x = parseEmbed(xHashtag) as ParsedEmbed;

  it.each([
    ['a URL that is not a post URL', { ...x, url: 'javascript:alert(1)' }],
    ['an id that does not match the URL', { ...x, id: '1' }],
    [
      'a platform that does not match the URL',
      { ...x, platform: 'threads' as const },
    ],
    [
      'a variant the platform does not have',
      { ...x, variant: 'iframe' as const },
    ],
    ['a kind the platform does not have', { ...x, kind: 'video' as const }],
    [
      'a URL in another form than the parser writes',
      {
        ...x,
        url: 'https://twitter.com/TheEllenShow/status/440322224407314432',
      },
    ],
    // Components build iframe `src` from the canonical URL (docs/decisions.md D57).
    [
      'a Reddit URL whose path would shift into the iframe host',
      {
        ...(parseEmbed(reddit) as ParsedEmbed),
        url: 'https://reddit.com/r/ab/comments/1xz8iq4/',
      },
    ],
    [
      'a Telegram URL with a query',
      {
        ...(parseEmbed(telegram) as ParsedEmbed),
        url: 'https://t.me/telegram/83?embed=0#x',
      },
    ],
  ])('rejects %s', (_, embed) => {
    expect(verifyEmbed(embed)).toBeNull();
  });

  it('drops X fallback content that links to another post', () => {
    const otherPost = (x.fallbackHtml ?? '').replace(
      'https://x.com/TheEllenShow/status/440322224407314432',
      'https://x.com/jack/status/20',
    );
    expect(otherPost).not.toBe(x.fallbackHtml);
    expect(verifyEmbed({ ...x, fallbackHtml: otherPost })).not.toHaveProperty(
      'fallbackHtml',
    );
  });

  it('drops fallback content the whitelist would not produce', () => {
    const tampered = {
      ...x,
      fallbackHtml: `${x.fallbackHtml ?? ''}<img src=x onerror=alert(1)>`,
    };
    const verified = verifyEmbed(tampered);
    expect(verified).not.toBeNull();
    expect(verified).not.toHaveProperty('fallbackHtml');
  });
});
