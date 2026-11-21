import { describe, expect, it } from 'vitest';
import { parseEmbed, parseIframe } from '../../src/parser';
import { descendants, parseHtml } from '../../src/parser/html';
import { platforms } from '../../src/parser/platforms';
import { parseUrl } from '../../src/parser/url';

const fixtures = import.meta.glob<string>('../fixtures/**/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Named-platform iframe code: a fixture whose platform has no parser yet joins once it has one.
const frames = Object.entries(fixtures).flatMap(([path, html]) => {
  const embed = parseEmbed(html);
  const iframe = descendants(parseHtml(html) ?? []).find(
    (element) => element.tag === 'iframe',
  );
  const src = iframe?.attrs.get('src');
  return embed && src !== undefined
    ? [{ path: path.replace('../fixtures/', ''), html, src, embed }]
    : [];
});

describe('frames of named platforms', () => {
  it.each(frames)('$path: its platform owns its frame', ({ src, embed }) => {
    const parser = platforms.find((p) => p.platform === embed.platform);
    const url = parseUrl(src);
    expect(url).not.toBeNull();
    expect(url && parser?.ownsFrame?.(url)).toBe(true);
  });

  it.each(frames)('$path: is never a generic embed', ({ html }) => {
    expect(parseIframe(html)).toBeNull();
  });

  it('covers every platform that owns frames', () => {
    const covered = new Set(frames.map(({ embed }) => embed.platform));
    const owners = platforms.filter((p) => p.ownsFrame).map((p) => p.platform);
    expect(owners.length).toBeGreaterThan(0);
    expect(owners.filter((platform) => !covered.has(platform))).toEqual([]);
  });

  it.each([
    ['a YouTube embed with a bad id', 'https://www.youtube.com/embed/!!bad'],
    [
      'a YouTube playlist',
      'https://www.youtube.com/embed?listType=playlist&list=PLx',
    ],
    ['a YouTube embed with a port', 'https://www.youtube.com:443/embed/!!bad'],
    ['a YouTube embed in capitals', 'HTTPS://WWW.YOUTUBE.COM/embed/!!bad'],
    [
      'a YouTube embed behind a dot segment',
      'https://www.youtube.com/x/../embed/!!bad',
    ],
    [
      'an unknown Facebook plugin',
      'https://www.facebook.com/plugins/unknown.php?href=x',
    ],
    ['a Vimeo player without a video', 'https://player.vimeo.com/video/abc'],
    [
      'a Spotify embed of an unknown type',
      'https://open.spotify.com/embed/concert/x',
    ],
    ['a Twitch clip with a bad slug', 'https://clips.twitch.tv/embed?clip=!'],
    [
      'a Pinterest frame without an id',
      'https://assets.pinterest.com/ext/embed.html',
    ],
    [
      'a Dailymotion player with a bad video',
      'https://geo.dailymotion.com/player.html?video=bad',
    ],
    ['a TikTok player with a bad id', 'https://www.tiktok.com/player/v1/abc'],
  ])('keeps %s off the generic path', (_, src) => {
    expect(parseIframe(`<iframe src="${src}"></iframe>`)).toBeNull();
  });

  it.each([
    [
      "Spotify's podcaster host",
      'https://podcasters.spotify.com/pod/show/x/embed',
    ],
    [
      "X's script-made frame",
      'https://platform.twitter.com/embed/Tweet.html?id=20',
    ],
    [
      "Reddit's script-made frame",
      'https://embed.reddit.com/r/x/comments/abc/',
    ],
    [
      'a Facebook page outside its plugins',
      'https://www.facebook.com/facebook',
    ],
    ['a YouTube look-alike host', 'https://youtube.com.example/embed/x'],
  ])('leaves %s to the generic path', (_, src) => {
    expect(parseIframe(`<iframe src="${src}"></iframe>`)).not.toBeNull();
  });
});
