import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import channel from '../fixtures/kick/player-channel.html?raw';

const base = { platform: 'kick', kind: 'video', variant: 'iframe' } as const;

describe('Kick embed code', () => {
  it('parses the player with its size', () => {
    expect(parseEmbed(channel)).toEqual({
      ...base,
      url: 'https://kick.com/xqc',
      id: 'xqc',
      options: {},
      size: { width: 1280, height: 720 },
    });
  });

  it('keeps autoplay and muted, and drops the rest', () => {
    expect(
      parseEmbed(
        channel.replace('/xqc"', '/xqc?autoplay=false&muted=true&x=1"'),
      )?.options,
    ).toEqual({ autoplay: false, muted: true });
  });

  it.each([
    ['another host', channel.replace('player.kick.com', 'example.com')],
    ['a path below the channel', channel.replace('/xqc"', '/xqc/videos"')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Kick URLs', () => {
  it.each([
    ['https://kick.com/xqc', 'xqc'],
    ['https://www.kick.com/XQC/', 'xqc'],
    ['https://player.kick.com/xqc', 'xqc'],
  ])('matches %s', (url, id) => {
    expect(matchUrl(url)).toEqual({
      ...base,
      url: `https://kick.com/${id}`,
      id,
      options: {},
    });
  });

  it.each([
    'https://kick.com/',
    'https://kick.com/categories',
    'https://kick.com/clips',
    'https://kick.com/video',
    'https://kick.com/videos',
    'https://kick.com/xqc/videos/abc',
    'https://kick.com/xqc/clips/clip_01',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
