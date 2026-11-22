import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed, parseIframe } from '../../src/parser';
import { verifyEmbed } from '../../src/parser/verify';
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
    ['https://www.youtube.com/watch?v=jNQXAC9IVRw&amp;t=30', { start: 30 }],
    ['https://www.youtube.com/watch?v=jNQXAC9IVRw#t=30', { start: 30 }],
    ['https://youtu.be/jNQXAC9IVRw#t=1m30s', { start: 90 }],
    ['https://www.youtube.com/watch?v=jNQXAC9IVRw&t=10#t=30', { start: 10 }],
    ['https://www.youtube.com/watch?v=jNQXAC9IVRw#t=soon', {}],
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
    'https://www.youtube.com/watch?v=live_stream',
    'https://www.youtube.com/watch?v=videoseries',
    'https://www.youtube.com/live/live_stream',
    'https://www.youtube-nocookie.com/watch?v=jNQXAC9IVRw',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});

const CHANNEL = 'UCBR8-60-B28hp2BmDPdntcQ';
const PLAYLIST = 'PL0123456789abcdefghijklmnopqrstuv';

const live = {
  platform: 'youtube',
  kind: 'video',
  url: `https://www.youtube.com/channel/${CHANNEL}/live`,
  id: CHANNEL,
  variant: 'iframe',
} as const;

const playlist = {
  platform: 'youtube',
  kind: 'video',
  url: `https://www.youtube.com/playlist?list=${PLAYLIST}`,
  id: PLAYLIST,
  variant: 'iframe',
} as const;

describe('YouTube channel live streams', () => {
  const code = share.replace(
    '/embed/jNQXAC9IVRw?si=zgsn8wwuM9wOXrRk',
    `/embed/live_stream?channel=${CHANNEL}`,
  );

  it('parses embed code by its channel', () => {
    expect(parseEmbed(code)).toEqual({
      ...live,
      options: {},
      size: { width: 560, height: 315 },
    });
  });

  it('keeps the other query parameters, but not the channel', () => {
    expect(
      parseEmbed(code.replace('?channel=', '?autoplay=1&amp;channel='))
        ?.options,
    ).toEqual({ autoplay: 1 });
  });

  it.each([
    'https://www.youtube.com/channel/UCBR8-60-B28hp2BmDPdntcQ/live',
    'https://youtube.com/channel/UCBR8-60-B28hp2BmDPdntcQ/live/',
    'https://www.youtube.com/embed/live_stream?channel=UCBR8-60-B28hp2BmDPdntcQ',
  ])('matches %s', (url) => {
    expect(matchUrl(url)).toEqual({ ...live, options: {} });
  });

  it('passes verifyEmbed from embed code and from its URL', () => {
    const fromCode = parseEmbed(code);
    const fromUrl = matchUrl(live.url);
    expect(fromCode && verifyEmbed(fromCode)).toEqual(fromCode);
    expect(fromUrl && verifyEmbed(fromUrl)).toEqual(fromUrl);
  });

  it('is never a generic iframe', () => {
    expect(parseIframe(code)).toBeNull();
  });

  it.each([
    ['without a channel', code.replace(`?channel=${CHANNEL}`, '')],
    ['with a bad channel', code.replace(CHANNEL, 'UC1')],
    ['with a user name', code.replace(`channel=${CHANNEL}`, 'user=YouTube')],
  ])('rejects embed code %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });

  it.each([
    'https://www.youtube.com/@YouTube/live',
    'https://www.youtube.com/channel/UCBR8-60-B28hp2BmDPdntcQ',
    'https://www.youtube.com/channel/UCBR8-60-B28hp2BmDPdntcQ/videos',
    'https://www.youtube.com/channel/UC1/live',
    'https://www.youtube-nocookie.com/channel/UCBR8-60-B28hp2BmDPdntcQ/live',
    'https://www.youtube.com/embed/live_stream',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});

describe('YouTube playlists', () => {
  const code = share.replace(
    '/embed/jNQXAC9IVRw?si=zgsn8wwuM9wOXrRk',
    `/embed/videoseries?si=zgsn8wwuM9wOXrRk&amp;list=${PLAYLIST}`,
  );

  it('parses embed code by its list, keeping the other parameters', () => {
    expect(parseEmbed(code)).toEqual({
      ...playlist,
      options: { si: 'zgsn8wwuM9wOXrRk' },
      size: { width: 560, height: 315 },
    });
  });

  it('keeps privacy-enhanced mode', () => {
    expect(
      parseEmbed(code.replace('www.youtube.com', 'www.youtube-nocookie.com'))
        ?.options,
    ).toEqual({ si: 'zgsn8wwuM9wOXrRk', nocookie: true });
  });

  it.each([
    [`https://www.youtube.com/playlist?list=${PLAYLIST}`, {}],
    [`https://m.youtube.com/playlist?list=${PLAYLIST}&si=abc`, {}],
    [`https://www.youtube.com/embed/videoseries?list=${PLAYLIST}`, {}],
    [
      `https://www.youtube-nocookie.com/embed/videoseries?list=${PLAYLIST}`,
      { nocookie: true },
    ],
  ])('matches %s', (url, options) => {
    expect(matchUrl(url)).toEqual({ ...playlist, options });
  });

  it('keeps a video in a playlist as the video', () => {
    expect(
      matchUrl(`https://www.youtube.com/watch?v=jNQXAC9IVRw&list=${PLAYLIST}`),
    ).toEqual({ ...zoo, options: {} });
  });

  it('passes verifyEmbed from embed code and from its URL', () => {
    const fromCode = parseEmbed(code);
    const fromUrl = matchUrl(playlist.url);
    expect(fromCode && verifyEmbed(fromCode)).toEqual(fromCode);
    expect(fromUrl && verifyEmbed(fromUrl)).toEqual(fromUrl);
  });

  it('is never a generic iframe', () => {
    expect(parseIframe(code)).toBeNull();
  });

  it.each([
    ['without a list', code.replace(`&amp;list=${PLAYLIST}`, '')],
    ['with a bad list', code.replace(PLAYLIST, 'PL!')],
  ])('rejects embed code %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });

  it.each([
    'https://www.youtube.com/playlist',
    'https://www.youtube.com/playlist?list=PL!',
    'https://www.youtube.com/embed/videoseries',
    `https://www.youtube-nocookie.com/playlist?list=${PLAYLIST}`,
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
