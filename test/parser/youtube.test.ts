import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import oembed from '../fixtures/youtube/oembed.html?raw';
import nocookie from '../fixtures/youtube/share-nocookie-controls-start.html?raw';
import shareStart from '../fixtures/youtube/share-start.html?raw';
import share from '../fixtures/youtube/share.html?raw';

const zoo = {
  platform: 'youtube',
  kind: 'video',
  url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  id: 'jNQXAC9IVRw',
  variant: 'iframe',
} as const;

describe('YouTube embed code', () => {
  it('parses the share dialog code', () => {
    expect(parseEmbed(share)).toEqual({
      ...zoo,
      options: { si: 'zgsn8wwuM9wOXrRk' },
      size: { width: 560, height: 315 },
    });
  });

  it('keeps the start time', () => {
    expect(parseEmbed(shareStart)?.options).toEqual({
      si: 'zgsn8wwuM9wOXrRk',
      start: 11,
    });
  });

  it('keeps privacy-enhanced mode and every query parameter', () => {
    expect(parseEmbed(nocookie)?.options).toEqual({
      si: 'zgsn8wwuM9wOXrRk',
      controls: 0,
      start: 11,
      nocookie: true,
    });
  });

  it('parses the oEmbed code', () => {
    expect(parseEmbed(oembed)).toEqual({
      ...zoo,
      options: { feature: 'oembed' },
      size: { width: 200, height: 150 },
    });
  });

  it('converts t to start', () => {
    const code = share.replace('?si=zgsn8wwuM9wOXrRk', '?t=1m30s');
    expect(parseEmbed(code)?.options).toEqual({ start: 90 });
  });

  it.each([
    [
      'a playlist',
      share.replace('/embed/jNQXAC9IVRw?', '/embed/videoseries?list=PL1&'),
    ],
    ['an id of the wrong length', share.replace('jNQXAC9IVRw', 'jNQXAC9IVR')],
    ['another host', share.replace('www.youtube.com', 'www.example.com')],
  ])('rejects %s', (_, code) => {
    expect(parseEmbed(code)).toBeNull();
  });
});

describe('YouTube URLs', () => {
  it.each([
    ['https://www.youtube.com/watch?v=jNQXAC9IVRw', {}],
    ['https://m.youtube.com/watch?v=jNQXAC9IVRw&feature=share', {}],
    ['https://youtu.be/jNQXAC9IVRw?si=abc', {}],
    ['https://youtu.be/jNQXAC9IVRw?t=90', { start: 90 }],
    ['https://www.youtube.com/watch?v=jNQXAC9IVRw&t=1m30s', { start: 90 }],
    ['https://www.youtube.com/watch?v=jNQXAC9IVRw&t=1h2m3s', { start: 3723 }],
    ['https://www.youtube.com/embed/jNQXAC9IVRw?start=11', { start: 11 }],
    ['https://www.youtube.com/live/jNQXAC9IVRw', {}],
    ['https://www.youtube-nocookie.com/embed/jNQXAC9IVRw', { nocookie: true }],
    ['https://www.youtube.com/watch?v=jNQXAC9IVRw&t=soon', {}],
  ])('%s', (url, options) => {
    expect(matchUrl(url)).toEqual({ ...zoo, options });
  });

  it('keeps Shorts as a Shorts URL', () => {
    expect(matchUrl('https://youtube.com/shorts/jNQXAC9IVRw')).toEqual({
      ...zoo,
      url: 'https://www.youtube.com/shorts/jNQXAC9IVRw',
      options: {},
    });
  });

  it.each([
    'https://www.youtube.com/watch',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/@jawed',
    'https://www.youtube.com/playlist?list=PL1',
    'https://www.youtube.com/embed/videoseries?list=PL1',
    'https://www.youtube-nocookie.com/watch?v=jNQXAC9IVRw',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
