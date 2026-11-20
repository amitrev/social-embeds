import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { verifyEmbed } from '../../src/parser/verify';
import playlist from '../fixtures/soundcloud/oembed-playlist.html?raw';
import track from '../fixtures/soundcloud/oembed-track.html?raw';
import user from '../fixtures/soundcloud/oembed-user.html?raw';
import shareClassic from '../fixtures/soundcloud/share-classic.html?raw';
import shareVisual from '../fixtures/soundcloud/share-visual.html?raw';

const base = {
  platform: 'soundcloud',
  kind: 'post',
  variant: 'iframe',
} as const;

const SHARE_OPTIONS = {
  color: '#ff5500',
  auto_play: false,
  hide_related: false,
  show_comments: true,
  show_user: true,
  show_reposts: false,
  show_teaser: true,
};

describe('SoundCloud embed code', () => {
  it('parses oEmbed code with its API URL and height', () => {
    expect(parseEmbed(track)).toEqual({
      ...base,
      url: 'https://api.soundcloud.com/tracks/293',
      id: '293',
      options: { visual: true, show_artwork: true },
      size: { height: 400 },
    });
  });

  it.each([
    [playlist, 'playlists/18', 450],
    [user, 'users/183', 450],
  ])('parses %#', (html, path, height) => {
    expect(parseEmbed(html)).toMatchObject({
      url: `https://api.soundcloud.com/${path}`,
      size: { height },
    });
  });

  it('parses Share code, whose id is an encoded URN, and drops its credit', () => {
    expect(parseEmbed(shareVisual)).toEqual({
      ...base,
      url: 'https://api.soundcloud.com/tracks/293',
      id: '293',
      options: { ...SHARE_OPTIONS, visual: true },
      size: { height: 300 },
    });
    expect(parseEmbed(shareClassic)).toEqual({
      ...base,
      url: 'https://api.soundcloud.com/tracks/293',
      id: '293',
      options: SHARE_OPTIONS,
      size: { height: 166 },
    });
  });

  it('keeps a private track’s secret token as content, never as an option', () => {
    const html = track.replace(
      'tracks%2F293',
      'tracks%2F293%3Fsecret_token%3Ds-AbC12',
    );
    const embed = parseEmbed(html);
    expect(embed).toMatchObject({
      url: 'https://api.soundcloud.com/tracks/293?secret_token=s-AbC12',
      id: '293',
    });
    expect(embed?.options).not.toHaveProperty('secret_token');
    expect(embed && verifyEmbed(embed)).toEqual(embed);
  });

  it.each([
    ['the credit with a second extra', `${shareVisual}<p>more</p>`],
    [
      'a foreign script',
      `${track}<script src="https://example.com/a.js"></script>`,
    ],
    [
      'a credit linking elsewhere',
      shareVisual.replace(
        'https://soundcloud.com/forss"',
        'https://example.com/"',
      ),
    ],
    ['another host in url', track.replace('api.soundcloud.com', 'example.com')],
    ['another player host', track.replace('w.soundcloud.com', 'example.com')],
    ['no url', track.replace(/url=[^&]*&/, '')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('SoundCloud URLs', () => {
  it('matches a track permalink', () => {
    expect(matchUrl('https://soundcloud.com/forss/flickermood')).toEqual({
      ...base,
      url: 'https://soundcloud.com/forss/flickermood',
      id: 'forss/flickermood',
      options: {},
    });
  });

  it.each([
    ['https://m.soundcloud.com/forss/flickermood?si=x', 'forss/flickermood'],
    ['https://www.soundcloud.com/forss/sets/soulhack/', 'forss/sets/soulhack'],
    ['https://soundcloud.com/forss', 'forss'],
    [
      'https://soundcloud.com/forss/flickermood/s-AbC12',
      'forss/flickermood/s-AbC12',
    ],
    ['https://api.soundcloud.com/tracks/293', 'tracks/293'],
  ])('matches %s', (url, path) => {
    const id = path.startsWith('tracks/') ? '293' : path;
    const host = path.startsWith('tracks/')
      ? 'api.soundcloud.com'
      : 'soundcloud.com';
    expect(matchUrl(url)).toMatchObject({ url: `https://${host}/${path}`, id });
  });

  it.each([
    'https://on.soundcloud.com/abc',
    'https://soundcloud.com/discover',
    'https://soundcloud.com/forss/likes',
    'https://soundcloud.com/forss/sets',
    'https://soundcloud.com/',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
