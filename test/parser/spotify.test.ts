import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import episode from '../fixtures/spotify/oembed-episode.html?raw';
import playlist from '../fixtures/spotify/oembed-playlist.html?raw';
import showVideo from '../fixtures/spotify/oembed-show-video.html?raw';
import track from '../fixtures/spotify/oembed-track.html?raw';

const base = { platform: 'spotify', variant: 'iframe' } as const;

describe('Spotify embed code', () => {
  it('parses a track at its fixed height, without utm_source', () => {
    expect(parseEmbed(track)).toEqual({
      ...base,
      kind: 'post',
      url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
      id: '4uLU6hMCjMI75M1A2tKUQC',
      options: {},
      size: { height: 152 },
    });
  });

  it.each([
    [playlist, 'playlist/37i9dQZF1DXcBWIGoYBM5M', 352],
    [episode, 'episode/7makk4oTQel546B0PZlDM5', 152],
  ])('parses %#', (html, path, height) => {
    expect(parseEmbed(html)).toMatchObject({
      url: `https://open.spotify.com/${path}`,
      size: { height },
    });
  });

  it('parses a video show as a video, with its 16:9 size', () => {
    expect(parseEmbed(showVideo)).toMatchObject({
      kind: 'video',
      url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
      size: { width: 624, height: 351 },
    });
  });

  it('keeps the theme', () => {
    expect(
      parseEmbed(
        track.replace('?utm_source=oembed', '?utm_source=oembed&theme=0'),
      )?.options,
    ).toEqual({ theme: 0 });
  });

  it.each([
    ['a page URL', track.replace('/embed/track/', '/track/')],
    ['another host', track.replace('open.spotify.com', 'example.com')],
    ['a short id', track.replace('4uLU6hMCjMI75M1A2tKUQC', 'abc')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Spotify URLs', () => {
  it.each([
    'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
    'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc123',
    'https://open.spotify.com/intl-de/track/4uLU6hMCjMI75M1A2tKUQC',
    'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC',
  ])('%s', (url) => {
    expect(matchUrl(url)).toEqual({
      ...base,
      kind: 'post',
      url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
      id: '4uLU6hMCjMI75M1A2tKUQC',
      options: {},
    });
  });

  it.each([
    'https://spotify.link/abcdef',
    'https://open.spotify.com/user/spotify',
    'https://open.spotify.com/track/abc',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
