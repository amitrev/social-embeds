import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import player from '../fixtures/tiktok/oembed-player.html?raw';
import webappShare from '../fixtures/tiktok/webapp-share-player.html?raw';

const video = {
  platform: 'tiktok',
  kind: 'video',
  id: '6718335390845095173',
  variant: 'iframe',
} as const;

describe('TikTok embed code', () => {
  it('parses the Embed Player iframe that oEmbed returns', () => {
    expect(parseEmbed(player)).toEqual({
      ...video,
      url: 'https://www.tiktok.com/@/video/6718335390845095173',
      options: {
        embed_from: 'oembed',
        music_info: 1,
        description: 1,
        autoplay: 1,
        muted: 1,
      },
      size: { width: 325, height: 578 },
    });
  });

  it('parses the code from the TikTok website share dialog', () => {
    expect(parseEmbed(webappShare)).toMatchObject({
      ...video,
      id: '7701153412242574613',
      options: { embed_from: 'webapp_share' },
      size: { width: 325, height: 578 },
    });
  });

  it('rejects an iframe on another path', () => {
    expect(parseEmbed(player.replace('/player/v1/', '/embed/v2/'))).toBeNull();
  });
});

// Legacy blockquote codes, structure as in brief §3. No real fixture yet: TikTok's oEmbed
// and share dialog both return the player iframe now (docs/decisions.md D11).
describe('TikTok legacy blockquote', () => {
  const cite = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
  const blockquote = (attributes: string) =>
    `<blockquote class="tiktok-embed" ${attributes}><section></section></blockquote>` +
    '<script async src="https://www.tiktok.com/embed.js"></script>';

  it('renders through the player, keeping the username from cite', () => {
    expect(
      parseEmbed(
        blockquote(`cite="${cite}" data-video-id="6718335390845095173"`),
      ),
    ).toEqual({ ...video, url: cite, options: {} });
  });

  it('accepts either identifier alone', () => {
    expect(parseEmbed(blockquote(`cite="${cite}"`))?.id).toBe(
      '6718335390845095173',
    );
    expect(
      parseEmbed(blockquote('data-video-id="6718335390845095173"'))?.url,
    ).toBe('https://www.tiktok.com/@/video/6718335390845095173');
  });

  it('rejects conflicting identifiers', () => {
    expect(
      parseEmbed(blockquote(`cite="${cite}" data-video-id="1"`)),
    ).toBeNull();
  });
});

describe('TikTok URLs', () => {
  it.each([
    'https://www.tiktok.com/@scout2015/video/6718335390845095173',
    'https://tiktok.com/@scout2015/video/6718335390845095173/?is_from_webapp=1',
  ])('%s', (url) => {
    expect(matchUrl(url)).toEqual({
      ...video,
      url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173',
      options: {},
    });
  });

  it.each([
    'https://vm.tiktok.com/ZMabcdef/',
    'https://vt.tiktok.com/ZSabcdef/',
    'https://www.tiktok.com/@scout2015',
    'https://www.tiktok.com/@scout2015/video/abc',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
