import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed, type ParsedEmbed } from '../../src/parser';
import { verifyEmbed } from '../../src/parser/verify';
import postIframe from '../fixtures/facebook/post-iframe.html?raw';
import postSdk from '../fixtures/facebook/post-sdk-docs.html?raw';
import videoSdk from '../fixtures/facebook/video-sdk-docs.html?raw';
import instagram from '../fixtures/instagram/post-captioned.html?raw';
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
  ])('rejects %s', (_, embed) => {
    expect(verifyEmbed(embed)).toBeNull();
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
