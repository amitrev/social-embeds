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
      url: 'https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS',
      id: '0LrHzQHk5gYGbMsoVbKDuS',
      options: {},
      size: { height: 152 },
    });
  });

  it.each([
    [playlist, 'playlist/37i9dQZF1DX4sWSpwq3LiO', 352],
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
      url: 'https://open.spotify.com/show/4OsuS4G6ukepPsjme51uFt',
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
    ['a short id', track.replace('0LrHzQHk5gYGbMsoVbKDuS', 'abc')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Spotify URLs', () => {
  it.each([
    'https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS',
    'https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS?si=abc123',
    'https://open.spotify.com/intl-de/track/0LrHzQHk5gYGbMsoVbKDuS',
    'https://open.spotify.com/embed/track/0LrHzQHk5gYGbMsoVbKDuS',
  ])('%s', (url) => {
    expect(matchUrl(url)).toEqual({
      ...base,
      kind: 'post',
      url: 'https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS',
      id: '0LrHzQHk5gYGbMsoVbKDuS',
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
