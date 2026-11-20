import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import album from '../fixtures/applemusic/share-album.html?raw';
import song from '../fixtures/applemusic/share-song.html?raw';

const base = {
  platform: 'applemusic',
  kind: 'post',
  variant: 'iframe',
} as const;

describe('Apple Music embed code', () => {
  it('parses an album without its slug', () => {
    expect(parseEmbed(album)).toEqual({
      ...base,
      url: 'https://music.apple.com/us/album/1440857781',
      id: '1440857781',
      options: {},
      size: { height: 450 },
    });
  });

  it('parses a song', () => {
    expect(parseEmbed(song)).toEqual({
      ...base,
      url: 'https://music.apple.com/us/song/1440857786',
      id: '1440857786',
      options: {},
      size: { height: 175 },
    });
  });

  it.each([
    ['a page host', album.replace('embed.music.apple.com', 'music.apple.com')],
    ['another host', album.replace('embed.music.apple.com', 'example.com')],
    [
      'a music video',
      song.replace('/song/better-together/', '/music-video/x/'),
    ],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Apple Music URLs', () => {
  it.each([
    [
      'https://music.apple.com/us/album/better-together/1440857781?i=1440857786&uo=4',
      'https://music.apple.com/us/album/1440857781?i=1440857786',
      '1440857786',
    ],
    [
      'https://music.apple.com/gb/album/in-between-dreams/1440857781',
      'https://music.apple.com/gb/album/1440857781',
      '1440857781',
    ],
    [
      'https://music.apple.com/us/song/better-together/1440857786',
      'https://music.apple.com/us/song/1440857786',
      '1440857786',
    ],
    [
      'https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb',
      'https://music.apple.com/us/playlist/pl.f4d106fed2bd41149aaacabb233eb5eb',
      'pl.f4d106fed2bd41149aaacabb233eb5eb',
    ],
  ])('matches %s', (url, canonical, id) => {
    expect(matchUrl(url)).toEqual({ ...base, url: canonical, id, options: {} });
  });

  it.each([
    'https://music.apple.com/us/music-video/the-fate-of-ophelia/1845446611',
    'https://music.apple.com/us/artist/jack-johnson/909253',
    'https://music.apple.com/us/album/x/abc',
    'https://music.apple.com/usa/album/1440857781',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
