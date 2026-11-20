import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import oembed from '../fixtures/dailymotion/oembed.html?raw';
import playerId from '../fixtures/dailymotion/player-id-docs.html?raw';

const base = {
  platform: 'dailymotion',
  kind: 'video',
  variant: 'iframe',
} as const;

describe('Dailymotion embed code', () => {
  it('parses the documented snippet with its Player ID and wrapper ratio', () => {
    expect(parseEmbed(playerId)).toEqual({
      ...base,
      url: 'https://www.dailymotion.com/video/x84sh87',
      id: 'x84sh87',
      options: { mute: true, playerId: 'x8lr5' },
      size: { width: 16, height: 9 },
    });
  });

  // Without a Player ID it renders only with the host's own (docs/decisions.md D63).
  it('parses the oEmbed code, which has no Player ID', () => {
    expect(parseEmbed(oembed)).toEqual({
      ...base,
      url: 'https://www.dailymotion.com/video/x84qh50',
      id: 'x84qh50',
      options: {},
      size: { width: 480, height: 269 },
    });
  });

  it('parses the legacy embed URL', () => {
    expect(
      parseEmbed(
        '<iframe src="https://www.dailymotion.com/embed/video/x84qh50" width="480" height="270"></iframe>',
      )?.id,
    ).toBe('x84qh50');
  });

  it.each([
    ['a playlist', playerId.replace('video=x84sh87', 'playlist=x5zhzj')],
    [
      'a video followed by a playlist',
      playerId.replace('&amp;mute=true', '&amp;playlist=x5zhzj'),
    ],
    [
      'another wrapper style',
      playerId.replace('overflow:hidden;"', 'overflow:visible;"'),
    ],
    ['another host', oembed.replace('geo.dailymotion.com', 'example.com')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Dailymotion URLs', () => {
  it.each([
    'https://www.dailymotion.com/video/x84qh50',
    'https://dailymotion.com/video/x84qh50/',
    'https://dai.ly/x84qh50',
    'https://www.dailymotion.com/embed/video/x84qh50',
  ])('%s', (url) => {
    expect(matchUrl(url)).toEqual({
      ...base,
      url: 'https://www.dailymotion.com/video/x84qh50',
      id: 'x84qh50',
      options: {},
    });
  });

  it('keeps the Player ID of a player URL', () => {
    expect(
      matchUrl('https://geo.dailymotion.com/player/x8lr5.html?video=x84sh87')
        ?.options,
    ).toEqual({ playerId: 'x8lr5' });
  });

  it.each([
    'https://www.dailymotion.com/dm-support-policy',
    'https://www.dailymotion.com/playlist/x5zhzj',
    'https://dai.ly/',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
