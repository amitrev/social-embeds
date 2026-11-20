import { describe, expect, it } from 'vitest';
import { appleMusicPlan, applePodcastsPlan } from '../../src/core/plans/apple';
import { blueskyPlan } from '../../src/core/plans/bluesky';
import { dailymotionPlan } from '../../src/core/plans/dailymotion';
import { giphyPlan } from '../../src/core/plans/giphy';
import { kickPlan } from '../../src/core/plans/kick';
import { soundcloudPlan } from '../../src/core/plans/soundcloud';
import { spotifyPlan } from '../../src/core/plans/spotify';
import { tumblrPlan } from '../../src/core/plans/tumblr';
import { twitchPlan } from '../../src/core/plans/twitch';
import { vimeoPlan } from '../../src/core/plans/vimeo';
import { resolveEmbed } from '../../src/core/resolve';
import { parseEmbed, type ParsedEmbed, type Platform } from '../../src/parser';
import blueskyOembed from '../fixtures/bluesky/oembed.html?raw';
import tumblrOembed from '../fixtures/tumblr/oembed.html?raw';
import appleAlbum from '../fixtures/applemusic/share-album.html?raw';
import appleSong from '../fixtures/applemusic/share-song.html?raw';
import podcastEpisode from '../fixtures/applepodcasts/share-episode.html?raw';
import giphyFixed from '../fixtures/giphy/embed-fixed.html?raw';
import kickChannel from '../fixtures/kick/player-channel.html?raw';
import soundcloudClassic from '../fixtures/soundcloud/share-classic.html?raw';
import dailymotionOembed from '../fixtures/dailymotion/oembed.html?raw';
import dailymotionPlayer from '../fixtures/dailymotion/player-id-docs.html?raw';
import spotifyShowVideo from '../fixtures/spotify/oembed-show-video.html?raw';
import spotifyTrack from '../fixtures/spotify/oembed-track.html?raw';
import twitchChannel from '../fixtures/twitch/docs-channel.html?raw';
import twitchVideo from '../fixtures/twitch/docs-video.html?raw';
import vimeoResponsive from '../fixtures/vimeo/responsive-docs.html?raw';

function fromUrl(url: string, platform: Platform): ParsedEmbed {
  const { embed } = resolveEmbed(url, undefined, platform);
  if (!embed) throw new Error('url did not resolve');
  return embed;
}

function fromCode(html: string, platform: Platform): ParsedEmbed {
  const parsed = parseEmbed(html);
  if (!parsed) throw new Error('fixture did not parse');
  const { embed } = resolveEmbed(undefined, parsed, platform);
  if (!embed) throw new Error('fixture did not verify');
  return embed;
}

const SPOTIFY_ALLOW =
  'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
const VIMEO_ALLOW =
  'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share';
const DAILYMOTION_ALLOW = 'autoplay; fullscreen; picture-in-picture; web-share';
const APPLE_ALLOW =
  'autoplay *; encrypted-media *; fullscreen *; clipboard-write';
const APPLE_SANDBOX =
  'allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation';

describe('spotifyPlan', () => {
  it('builds a compact track player for a URL', () => {
    const embed = fromUrl(
      'https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS?si=abc',
      'spotify',
    );
    expect(spotifyPlan(embed, {})).toEqual({
      kind: 'iframe',
      src: 'https://open.spotify.com/embed/track/0LrHzQHk5gYGbMsoVbKDuS',
      title: 'Spotify Embed',
      allow: SPOTIFY_ALLOW,
      ratio: { width: 16, height: 9 },
      size: undefined,
      height: 152,
      borderRadius: 12,
    });
  });

  it('uses the full height for a playlist URL', () => {
    const embed = fromUrl(
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
      'spotify',
    );
    expect(spotifyPlan(embed, {})).toEqual({
      kind: 'iframe',
      src: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
      title: 'Spotify Embed',
      allow: SPOTIFY_ALLOW,
      ratio: { width: 16, height: 9 },
      size: undefined,
      height: 352,
      borderRadius: 12,
    });
  });

  it('keeps the embed code options and height', () => {
    expect(spotifyPlan(fromCode(spotifyTrack, 'spotify'), {})).toEqual({
      kind: 'iframe',
      src: 'https://open.spotify.com/embed/track/0LrHzQHk5gYGbMsoVbKDuS',
      title: 'Spotify Embed',
      allow: SPOTIFY_ALLOW,
      ratio: { width: 16, height: 9 },
      size: undefined,
      height: 152,
      borderRadius: 12,
    });
  });

  it('keeps a video show at its aspect ratio, with no fixed height', () => {
    expect(spotifyPlan(fromCode(spotifyShowVideo, 'spotify'), {})).toEqual({
      kind: 'iframe',
      src: 'https://open.spotify.com/embed/show/4OsuS4G6ukepPsjme51uFt/video',
      title: 'Spotify Embed',
      allow: SPOTIFY_ALLOW,
      ratio: { width: 16, height: 9 },
      size: { width: 624, height: 351 },
      height: undefined,
      borderRadius: 12,
    });
  });

  it('adds the dark theme', () => {
    const embed = fromUrl(
      'https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS',
      'spotify',
    );
    expect(spotifyPlan(embed, { theme: 0 })).toEqual({
      kind: 'iframe',
      src: 'https://open.spotify.com/embed/track/0LrHzQHk5gYGbMsoVbKDuS?theme=0',
      title: 'Spotify Embed',
      allow: SPOTIFY_ALLOW,
      ratio: { width: 16, height: 9 },
      size: undefined,
      height: 152,
      borderRadius: 12,
    });
  });
});

describe('vimeoPlan', () => {
  it('builds the player for a URL', () => {
    expect(
      vimeoPlan(fromUrl('https://vimeo.com/76979871', 'vimeo'), {}),
    ).toEqual({
      kind: 'iframe',
      src: 'https://player.vimeo.com/video/76979871',
      title: 'Vimeo video player',
      allow: VIMEO_ALLOW,
      referrerPolicy: 'strict-origin-when-cross-origin',
      ratio: { width: 16, height: 9 },
      size: undefined,
    });
  });

  it('keeps the embed code options', () => {
    expect(vimeoPlan(fromCode(vimeoResponsive, 'vimeo'), {})).toEqual({
      kind: 'iframe',
      src: 'https://player.vimeo.com/video/76979871?badge=0&autopause=0',
      title: 'Vimeo video player',
      allow: VIMEO_ALLOW,
      referrerPolicy: 'strict-origin-when-cross-origin',
      ratio: { width: 16, height: 9 },
      size: { width: 16, height: 9 },
    });
  });

  it('adds the unlisted hash and the start time from the URL', () => {
    const embed = fromUrl(
      'https://vimeo.com/76979871/abcdef1234#t=1m2s',
      'vimeo',
    );
    expect(vimeoPlan(embed, {})).toEqual({
      kind: 'iframe',
      src: 'https://player.vimeo.com/video/76979871?h=abcdef1234#t=1m2s',
      title: 'Vimeo video player',
      allow: VIMEO_ALLOW,
      referrerPolicy: 'strict-origin-when-cross-origin',
      ratio: { width: 16, height: 9 },
      size: undefined,
    });
  });

  it('lets the options replace the URL start time and add parameters', () => {
    const embed = fromUrl(
      'https://vimeo.com/76979871/abcdef1234#t=1m2s',
      'vimeo',
    );
    expect(vimeoPlan(embed, { t: 30, autoplay: true, muted: false })).toEqual({
      kind: 'iframe',
      src: 'https://player.vimeo.com/video/76979871?h=abcdef1234&autoplay=1&muted=0#t=30',
      title: 'Vimeo video player',
      allow: VIMEO_ALLOW,
      referrerPolicy: 'strict-origin-when-cross-origin',
      ratio: { width: 16, height: 9 },
      size: undefined,
    });
  });
});

describe('twitchPlan', () => {
  it('builds a channel player and asks for the page host', () => {
    expect(
      twitchPlan(fromUrl('https://www.twitch.tv/Twitch', 'twitch'), {}),
    ).toEqual({
      kind: 'iframe',
      src: 'https://player.twitch.tv/?channel=twitch',
      title: 'Twitch player',
      allow: '',
      ratio: { width: 16, height: 9 },
      size: undefined,
      hostParam: 'parent',
    });
  });

  it('builds a clip player', () => {
    const embed = fromUrl(
      'https://www.twitch.tv/twitch/clip/LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      'twitch',
    );
    expect(twitchPlan(embed, {})).toEqual({
      kind: 'iframe',
      src: 'https://clips.twitch.tv/embed?clip=LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      title: 'Twitch player',
      allow: '',
      ratio: { width: 16, height: 9 },
      size: undefined,
      hostParam: 'parent',
    });
  });

  it('keeps the embed code options and size, without its parent', () => {
    expect(twitchPlan(fromCode(twitchChannel, 'twitch'), {})).toEqual({
      kind: 'iframe',
      src: 'https://player.twitch.tv/?channel=twitch&muted=true',
      title: 'Twitch player',
      allow: '',
      ratio: { width: 16, height: 9 },
      size: { width: 1280, height: 720 },
      hostParam: 'parent',
    });
    expect(twitchPlan(fromCode(twitchVideo, 'twitch'), {})).toEqual({
      kind: 'iframe',
      src: 'https://player.twitch.tv/?video=v1816688726&autoplay=false',
      title: 'Twitch player',
      allow: '',
      ratio: { width: 16, height: 9 },
      size: { width: 1280, height: 720 },
      hostParam: 'parent',
    });
  });

  it('adds the options as true and false', () => {
    const embed = fromUrl('https://www.twitch.tv/Twitch', 'twitch');
    expect(
      twitchPlan(embed, { autoplay: false, muted: true, time: '1h2m3s' }),
    ).toEqual({
      kind: 'iframe',
      src: 'https://player.twitch.tv/?channel=twitch&autoplay=false&muted=true&time=1h2m3s',
      title: 'Twitch player',
      allow: '',
      ratio: { width: 16, height: 9 },
      size: undefined,
      hostParam: 'parent',
    });
  });
});

describe('dailymotionPlan', () => {
  it('builds the player for an embed code with a Player ID', () => {
    expect(
      dailymotionPlan(fromCode(dailymotionPlayer, 'dailymotion'), {}),
    ).toEqual({
      kind: 'iframe',
      src: 'https://geo.dailymotion.com/player/x8lr5.html?video=x84sh87&mute=true',
      title: 'Dailymotion video player',
      allow: DAILYMOTION_ALLOW,
      ratio: { width: 16, height: 9 },
      size: { width: 16, height: 9 },
    });
  });

  it('takes the Player ID and options from the host', () => {
    const embed = fromUrl(
      'https://www.dailymotion.com/video/x84sh87',
      'dailymotion',
    );
    expect(
      dailymotionPlan(embed, {
        playerId: 'x8lr5',
        mute: true,
        startTime: 30,
        loop: false,
      }),
    ).toEqual({
      kind: 'iframe',
      src: 'https://geo.dailymotion.com/player/x8lr5.html?video=x84sh87&mute=true&startTime=30&loop=false',
      title: 'Dailymotion video player',
      allow: DAILYMOTION_ALLOW,
      ratio: { width: 16, height: 9 },
      size: undefined,
    });
  });

  it('errors without a Player ID', () => {
    const embed = fromCode(dailymotionOembed, 'dailymotion');
    expect(dailymotionPlan(embed, {})).toEqual({
      kind: 'error',
      message:
        'social-embeds: a Dailymotion embed needs a Player ID: pass playerId to DailymotionEmbed',
    });
  });

  it('errors on a malformed Player ID', () => {
    const embed = fromUrl(
      'https://www.dailymotion.com/video/x84sh87',
      'dailymotion',
    );
    expect(dailymotionPlan(embed, { playerId: 'nope' })).toEqual({
      kind: 'error',
      message: 'social-embeds: not a Dailymotion Player ID: nope',
    });
  });
});

describe('blueskyPlan', () => {
  const FALLBACK =
    '<p lang="en">saw some cool clouds today</p>&mdash; <a href="https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur?ref_src=embed">Bluesky (@bsky.app)</a> <a href="https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3mxu3hsnebc2v?ref_src=embed">2026-10-14T17:35:30.592Z</a>';

  it('builds the frame and carries the verified fallback', () => {
    const plan = blueskyPlan(fromCode(blueskyOembed, 'bluesky'), {});
    expect(plan).toEqual({
      kind: 'iframe',
      src: 'https://embed.bsky.app/embed/did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mxu3hsnebc2v',
      title: 'Bluesky post',
      allow: '',
      scrolling: 'no',
      ratio: { width: 1, height: 1 },
      messageHeight: {
        origin: 'https://embed.bsky.app',
        read: expect.any(Function) as unknown,
      },
      startHeight: 300,
      maxWidth: 600,
      fallbackHtml: FALLBACK,
    });
  });

  it('reads the height from a message', () => {
    const plan = blueskyPlan(fromCode(blueskyOembed, 'bluesky'), {});
    if (plan.kind !== 'iframe' || !plan.messageHeight) throw new Error('plan');
    expect(plan.messageHeight.read({ height: 321 })).toBe(321);
    expect(plan.messageHeight.read({ height: '321' })).toBeUndefined();
    expect(plan.messageHeight.read(null)).toBeUndefined();
  });

  it('adds the colour mode', () => {
    const plan = blueskyPlan(fromCode(blueskyOembed, 'bluesky'), {
      colorMode: 'dark',
    });
    expect(plan).toMatchObject({
      src: 'https://embed.bsky.app/embed/did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mxu3hsnebc2v?colorMode=dark',
    });
  });
});

describe('soundcloudPlan', () => {
  it('builds the visual player at 400px for a URL', () => {
    const embed = fromUrl(
      'https://soundcloud.com/forss/flickermood',
      'soundcloud',
    );
    expect(soundcloudPlan(embed, {})).toEqual({
      kind: 'iframe',
      src: 'https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fforss%2Fflickermood&visual=true',
      title: 'SoundCloud player',
      allow: 'autoplay; encrypted-media',
      scrolling: 'no',
      ratio: { width: 16, height: 9 },
      height: 400,
    });
  });

  it('keeps the embed code options and height', () => {
    expect(
      soundcloudPlan(fromCode(soundcloudClassic, 'soundcloud'), {}),
    ).toEqual({
      kind: 'iframe',
      src: 'https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F293&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true',
      title: 'SoundCloud player',
      allow: 'autoplay; encrypted-media',
      scrolling: 'no',
      ratio: { width: 16, height: 9 },
      height: 166,
    });
  });

  it('lets the options replace the embed code ones', () => {
    const plan = soundcloudPlan(fromCode(soundcloudClassic, 'soundcloud'), {
      color: '#000000',
      autoPlay: true,
      visual: false,
    });
    expect(plan).toMatchObject({
      src: 'https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F293&color=%23000000&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=false',
      height: 166,
    });
  });
});

describe('appleMusicPlan', () => {
  it('builds a song at 175px from a URL', () => {
    const embed = fromUrl(
      'https://music.apple.com/us/album/1357820591?i=1357820597',
      'applemusic',
    );
    expect(appleMusicPlan(embed)).toEqual({
      kind: 'iframe',
      src: 'https://embed.music.apple.com/us/album/1357820591?i=1357820597',
      title: 'Apple Music player',
      allow: APPLE_ALLOW,
      sandbox: APPLE_SANDBOX,
      ratio: { width: 16, height: 9 },
      height: 175,
      maxWidth: 660,
      borderRadius: 10,
    });
  });

  it('builds an album at 450px from a URL', () => {
    const embed = fromUrl(
      'https://music.apple.com/us/album/1357820591',
      'applemusic',
    );
    expect(appleMusicPlan(embed)).toEqual({
      kind: 'iframe',
      src: 'https://embed.music.apple.com/us/album/1357820591',
      title: 'Apple Music player',
      allow: APPLE_ALLOW,
      sandbox: APPLE_SANDBOX,
      ratio: { width: 16, height: 9 },
      height: 450,
      maxWidth: 660,
      borderRadius: 10,
    });
  });

  it('takes the height from the embed code', () => {
    expect(appleMusicPlan(fromCode(appleSong, 'applemusic'))).toMatchObject({
      src: 'https://embed.music.apple.com/us/song/1357820597',
      height: 175,
    });
    expect(appleMusicPlan(fromCode(appleAlbum, 'applemusic'))).toMatchObject({
      height: 450,
    });
  });
});

describe('applePodcastsPlan', () => {
  it('builds a show at 450px from a URL', () => {
    const embed = fromUrl(
      'https://podcasts.apple.com/us/podcast/id947965068',
      'applepodcasts',
    );
    expect(applePodcastsPlan(embed)).toEqual({
      kind: 'iframe',
      src: 'https://embed.podcasts.apple.com/us/podcast/id947965068',
      title: 'Apple Podcasts player',
      allow: APPLE_ALLOW,
      sandbox: APPLE_SANDBOX,
      ratio: { width: 16, height: 9 },
      height: 450,
      maxWidth: 640,
      borderRadius: 12,
    });
  });

  it('builds an episode at 160px from a URL', () => {
    const embed = fromUrl(
      'https://podcasts.apple.com/us/podcast/id947965068?i=1000430702647',
      'applepodcasts',
    );
    expect(applePodcastsPlan(embed)).toEqual({
      kind: 'iframe',
      src: 'https://embed.podcasts.apple.com/us/podcast/id947965068?i=1000430702647',
      title: 'Apple Podcasts player',
      allow: APPLE_ALLOW,
      sandbox: APPLE_SANDBOX,
      ratio: { width: 16, height: 9 },
      height: 160,
      maxWidth: 640,
      borderRadius: 12,
    });
  });

  it('takes the height from the embed code', () => {
    expect(
      applePodcastsPlan(fromCode(podcastEpisode, 'applepodcasts')),
    ).toEqual({
      kind: 'iframe',
      src: 'https://embed.podcasts.apple.com/us/podcast/id947965068?i=1000430702647',
      title: 'Apple Podcasts player',
      allow: APPLE_ALLOW,
      sandbox: APPLE_SANDBOX,
      ratio: { width: 16, height: 9 },
      height: 160,
      maxWidth: 640,
      borderRadius: 12,
    });
  });
});

describe('tumblrPlan', () => {
  const EXPECTED = {
    kind: 'iframe',
    src: 'https://embed.tumblr.com/embed/post/staff/828009069026721792/v2',
    title: 'Tumblr post',
    allow: '',
    scrolling: 'no',
    ratio: { width: 1, height: 1 },
    messageHeight: {
      origin: 'https://embed.tumblr.com',
      read: expect.any(Function) as unknown,
    },
    startHeight: 400,
    maxWidth: 540,
  };

  it('builds the post frame for a URL', () => {
    expect(
      tumblrPlan(
        fromUrl('https://staff.tumblr.com/post/828009069026721792', 'tumblr'),
      ),
    ).toEqual(EXPECTED);
  });

  it('builds the post frame for an embed code', () => {
    expect(tumblrPlan(fromCode(tumblrOembed, 'tumblr'))).toEqual(EXPECTED);
  });

  it('reads the height from a size-change message', () => {
    const plan = tumblrPlan(fromCode(tumblrOembed, 'tumblr'));
    if (plan.kind !== 'iframe' || !plan.messageHeight) throw new Error('plan');
    const { read } = plan.messageHeight;
    expect(
      read(JSON.stringify({ method: 'tumblr-post:sizeChange', args: [512] })),
    ).toBe(512);
    expect(
      read(JSON.stringify({ method: 'other', args: [512] })),
    ).toBeUndefined();
    expect(read({})).toBeUndefined();
  });
});

describe('kickPlan', () => {
  it('builds the player for a URL', () => {
    expect(kickPlan(fromUrl('https://kick.com/kick', 'kick'), {})).toEqual({
      kind: 'iframe',
      src: 'https://player.kick.com/kick',
      title: 'Kick player',
      allow: 'autoplay; fullscreen',
      scrolling: 'no',
      ratio: { width: 16, height: 9 },
      size: undefined,
    });
  });

  it('keeps the embed code size', () => {
    expect(kickPlan(fromCode(kickChannel, 'kick'), {})).toEqual({
      kind: 'iframe',
      src: 'https://player.kick.com/kick',
      title: 'Kick player',
      allow: 'autoplay; fullscreen',
      scrolling: 'no',
      ratio: { width: 16, height: 9 },
      size: { width: 1280, height: 720 },
    });
  });

  it('adds the options', () => {
    expect(
      kickPlan(fromUrl('https://kick.com/kick', 'kick'), {
        autoplay: true,
        muted: false,
      }),
    ).toMatchObject({
      src: 'https://player.kick.com/kick?autoplay=true&muted=false',
    });
  });
});

describe('giphyPlan', () => {
  it('builds a square frame for a URL', () => {
    const embed = fromUrl(
      'https://giphy.com/gifs/originals-animation-kitten-logo-l41YlHs99JsSptZf2',
      'giphy',
    );
    expect(giphyPlan(embed)).toEqual({
      kind: 'iframe',
      src: 'https://giphy.com/embed/l41YlHs99JsSptZf2',
      title: 'Giphy GIF',
      allow: 'fullscreen',
      ratio: { width: 1, height: 1 },
      size: undefined,
    });
  });

  it('keeps the embed code size', () => {
    expect(giphyPlan(fromCode(giphyFixed, 'giphy'))).toEqual({
      kind: 'iframe',
      src: 'https://giphy.com/embed/l41YlHs99JsSptZf2',
      title: 'Giphy GIF',
      allow: 'fullscreen',
      ratio: { width: 1, height: 1 },
      size: { width: 480, height: 269 },
    });
  });
});
