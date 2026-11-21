import { describe, expect, it } from 'vitest';
import { appleMusicPlan, applePodcastsPlan } from '../../src/core/plans/apple';
import { blueskyPlan } from '../../src/core/plans/bluesky';
import { dailymotionPlan } from '../../src/core/plans/dailymotion';
import { flickrPlan } from '../../src/core/plans/flickr';
import { giphyPlan } from '../../src/core/plans/giphy';
import { imgurPlan } from '../../src/core/plans/imgur';
import { kickPlan } from '../../src/core/plans/kick';
import { soundcloudPlan } from '../../src/core/plans/soundcloud';
import { spotifyPlan } from '../../src/core/plans/spotify';
import { stravaPlan } from '../../src/core/plans/strava';
import { truthSocialPlan } from '../../src/core/plans/truthsocial';
import { tumblrPlan } from '../../src/core/plans/tumblr';
import { rumblePlan } from '../../src/core/plans/rumble';
import { streamablePlan } from '../../src/core/plans/streamable';
import { tenorPlan } from '../../src/core/plans/tenor';
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
import rumbleDialog from '../fixtures/rumble/embed-dialog-iframe.html?raw';
import rumbleOembed from '../fixtures/rumble/oembed.html?raw';
import streamableApi from '../fixtures/streamable/api-embed-code.html?raw';
import streamableOembed from '../fixtures/streamable/oembed.html?raw';
import tenorDialog from '../fixtures/tenor/embed-dialog.html?raw';
import vimeoResponsive from '../fixtures/vimeo/responsive-docs.html?raw';
import truthVideo from '../fixtures/truthsocial/embed-dialog-video.html?raw';
import truthText from '../fixtures/truthsocial/oembed-text.html?raw';
import imgurAlbum from '../fixtures/imgur/embed-dialog-album.html?raw';
import imgurHideTitle from '../fixtures/imgur/embed-dialog-album-hide-title.html?raw';
import imgurImage from '../fixtures/imgur/oembed-image.html?raw';
import stravaRoute from '../fixtures/strava/route-derived.html?raw';
import flickrDialog from '../fixtures/flickr/embed-dialog.html?raw';
import flickrHeaderFooter from '../fixtures/flickr/embed-dialog-header-footer.html?raw';
import flickrSlideshow from '../fixtures/flickr/embed-dialog-slideshow.html?raw';
import flickrAlbum from '../fixtures/flickr/embed-dialog-album.html?raw';

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

describe('tenorPlan', () => {
  it('defaults a URL to 4:3', () => {
    expect(
      tenorPlan(
        fromUrl('https://tenor.com/view/hello-wave-gif-12345', 'tenor'),
      ),
    ).toEqual({
      kind: 'iframe',
      src: 'https://tenor.com/embed/12345',
      title: 'Tenor GIF',
      allow: 'fullscreen',
      ratio: { width: 133, height: 100 },
      size: undefined,
    });
  });

  it('keeps the embed code ratio', () => {
    expect(tenorPlan(fromCode(tenorDialog, 'tenor'))).toMatchObject({
      src: 'https://tenor.com/embed/12328062661350661133',
      size: { width: 1, height: 1 },
    });
  });
});

describe('streamablePlan', () => {
  it('builds the player frame for a URL', () => {
    expect(
      streamablePlan(
        fromUrl('https://streamable.com/abc123', 'streamable'),
        {},
      ),
    ).toEqual({
      kind: 'iframe',
      src: 'https://streamable.com/e/abc123',
      title: 'Streamable video',
      allow: 'autoplay; fullscreen',
      ratio: { width: 16, height: 9 },
      size: undefined,
    });
  });

  it('keeps the wrapper ratio and the frame size', () => {
    expect(
      streamablePlan(fromCode(streamableApi, 'streamable'), {}),
    ).toMatchObject({
      src: 'https://streamable.com/e/lttg48',
      size: { width: 16, height: 9 },
    });
    expect(
      streamablePlan(fromCode(streamableOembed, 'streamable'), {}),
    ).toMatchObject({ size: { width: 1280, height: 720 } });
  });

  it('turns options into player parameters', () => {
    expect(
      streamablePlan(fromUrl('https://streamable.com/abc123', 'streamable'), {
        autoplay: true,
        loop: false,
        nocontrols: true,
        hd: true,
        muted: true,
      }),
    ).toMatchObject({
      src: 'https://streamable.com/e/abc123?autoplay=1&hd=1&loop=0&muted=1&nocontrols=1',
    });
  });

  it('ignores inherited object names in parsed options', () => {
    const embed = fromUrl('https://streamable.com/abc123', 'streamable');
    expect(
      streamablePlan(
        { ...embed, options: { constructor: 'x', toString: 'y', muted: 1 } },
        {},
      ),
    ).toMatchObject({ src: 'https://streamable.com/e/abc123?muted=1' });
  });

  it('ignores parsed options that are not player parameters', () => {
    const embed = fromUrl('https://streamable.com/abc123', 'streamable');
    expect(
      streamablePlan({ ...embed, options: { id: 'x', muted: 1 } }, {}),
    ).toMatchObject({ src: 'https://streamable.com/e/abc123?muted=1' });
  });
});

describe('rumblePlan', () => {
  it('keeps pub from the embed code and its size', () => {
    expect(rumblePlan(fromCode(rumbleDialog, 'rumble'))).toEqual({
      kind: 'iframe',
      src: 'https://rumble.com/embed/v12onr1/?pub=4',
      title: 'Rumble video',
      allow: 'fullscreen',
      ratio: { width: 16, height: 9 },
      size: { width: 640, height: 360 },
    });
  });

  it('adds no pub', () => {
    expect(rumblePlan(fromCode(rumbleOembed, 'rumble'))).toMatchObject({
      src: 'https://rumble.com/embed/v12onr1/',
    });
  });

  it('drops options other than pub', () => {
    const embed = fromCode(rumbleDialog, 'rumble');
    expect(
      rumblePlan({ ...embed, options: { pub: 4, id: 'x' } }),
    ).toMatchObject({ src: 'https://rumble.com/embed/v12onr1/?pub=4' });
  });
});

function readerOf(plan: ReturnType<typeof truthSocialPlan>) {
  if (plan.kind !== 'iframe' || !plan.messageHeight) throw new Error('plan');
  return plan.messageHeight.read;
}

describe('truthSocialPlan', () => {
  const EXPECTED = {
    kind: 'iframe',
    src: 'https://truthsocial.com/@truthsocial/116862065232992052/embed',
    title: 'Truth Social post',
    allow: '',
    scrolling: 'no',
    ratio: { width: 1, height: 1 },
    messageHeight: {
      origin: 'https://truthsocial.com',
      read: expect.any(Function) as unknown,
    },
    startHeight: 300,
    maxWidth: 600,
  };

  it('builds the post frame for embed code', () => {
    expect(truthSocialPlan(fromCode(truthText, 'truthsocial'))).toEqual(
      EXPECTED,
    );
  });

  it('builds the same frame for a URL', () => {
    expect(
      truthSocialPlan(
        fromUrl(
          'https://truthsocial.com/@truthsocial/posts/116862065232992052',
          'truthsocial',
        ),
      ),
    ).toEqual(EXPECTED);
  });

  it('reads the height of a setHeight message, with or without an id', () => {
    const read = readerOf(truthSocialPlan(fromCode(truthText, 'truthsocial')));
    expect(read({ type: 'setHeight', id: undefined, height: 221 })).toBe(221);
    expect(read({ type: 'setHeight', id: 'abc', height: 506 })).toBe(506);
    expect(read({ type: 'other', height: 221 })).toBeUndefined();
    expect(read({ type: 'setHeight', height: '221' })).toBeUndefined();
    expect(read('setHeight')).toBeUndefined();
    expect(read(null)).toBeUndefined();
  });

  it('adds 165px to every height of a video post', () => {
    const plan = truthSocialPlan(fromCode(truthVideo, 'truthsocial'));
    expect(plan).toMatchObject({
      src: 'https://truthsocial.com/@truthsocial/117529982042129746/embed',
      startHeight: 300,
    });
    const read = readerOf(plan);
    expect(read({ type: 'setHeight', height: 530 })).toBe(695);
    expect(read({ type: 'other', height: 530 })).toBeUndefined();
  });

  it('errors on a URL that is not the canonical post URL', () => {
    const embed = fromCode(truthText, 'truthsocial');
    expect(
      truthSocialPlan({ ...embed, url: 'https://truthsocial.com/@a/1' }),
    ).toEqual({
      kind: 'error',
      message:
        'social-embeds: not a Truth Social post URL: https://truthsocial.com/@a/1',
    });
  });

  it('adds 165px only for the flag set to true', () => {
    const embed = fromCode(truthText, 'truthsocial');
    const read = readerOf(
      truthSocialPlan({ ...embed, options: { video: 'true' } }),
    );
    expect(read({ type: 'setHeight', height: 221 })).toBe(221);
  });
});

describe('imgurPlan', () => {
  const ALBUM = {
    kind: 'iframe',
    src: 'https://imgur.com/a/04b1CmA/embed?pub=true',
    title: 'Imgur post',
    allow: '',
    scrolling: 'no',
    ratio: { width: 1, height: 1 },
    messageHeight: {
      origin: 'https://imgur.com',
      read: expect.any(Function) as unknown,
    },
    startHeight: 500,
    maxWidth: 540,
  };

  it('builds the album frame and carries the verified title link', () => {
    expect(imgurPlan(fromCode(imgurAlbum, 'imgur'), {})).toEqual({
      ...ALBUM,
      fallbackHtml:
        '<a href="https://imgur.com/a/04b1CmA">It&#39;s Imgur&#39;s 16th Birthday Week! Share Memories and Reminisce.</a>',
    });
  });

  it('builds the image frame', () => {
    expect(imgurPlan(fromCode(imgurImage, 'imgur'), {})).toMatchObject({
      src: 'https://imgur.com/yOBT04V/embed?pub=true',
      fallbackHtml:
        '<a href="https://imgur.com/yOBT04V">View post on imgur.com</a>',
    });
  });

  it.each([
    'https://imgur.com/a/04b1CmA',
    'https://imgur.com/gallery/its-imgurs-16th-birthday-week-04b1CmA',
  ])('builds the album frame for %s', (url) => {
    expect(imgurPlan(fromUrl(url, 'imgur'), {})).toEqual(ALBUM);
  });

  it('builds the image frame for a file URL', () => {
    expect(
      imgurPlan(fromUrl('https://i.imgur.com/yOBT04V.jpeg', 'imgur'), {}),
    ).toMatchObject({ src: 'https://imgur.com/yOBT04V/embed?pub=true' });
  });

  it('keeps the hidden title and analytics of the embed code', () => {
    expect(imgurPlan(fromCode(imgurHideTitle, 'imgur'), {})).toMatchObject({
      src: 'https://imgur.com/a/04b1CmA/embed?pub=true&context=false',
    });
    const embed = fromCode(imgurAlbum, 'imgur');
    expect(
      imgurPlan({ ...embed, options: { analytics: false } }, {}),
    ).toMatchObject({
      src: 'https://imgur.com/a/04b1CmA/embed?pub=true&analytics=false',
    });
  });

  it('lets the context prop replace the embed code', () => {
    expect(
      imgurPlan(fromCode(imgurHideTitle, 'imgur'), { context: true }),
    ).toMatchObject({ src: 'https://imgur.com/a/04b1CmA/embed?pub=true' });
    expect(
      imgurPlan(fromCode(imgurAlbum, 'imgur'), { context: false }),
    ).toMatchObject({
      src: 'https://imgur.com/a/04b1CmA/embed?pub=true&context=false',
    });
  });

  it('ignores options that are not kept', () => {
    const embed = fromCode(imgurAlbum, 'imgur');
    expect(
      imgurPlan(
        { ...embed, options: { id: 'x', pub: 'false', context: 'no', w: 1 } },
        {},
      ),
    ).toMatchObject({ src: 'https://imgur.com/a/04b1CmA/embed?pub=true' });
  });

  it('reads the height of a resize_imgur message', () => {
    const plan = imgurPlan(fromCode(imgurAlbum, 'imgur'), {});
    if (plan.kind !== 'iframe' || !plan.messageHeight) throw new Error('plan');
    const { read } = plan.messageHeight;
    expect(
      read(
        '{"message":"resize_imgur","href":"https://imgur.com/a/04b1CmA/embed?pub=true","height":415,"width":360,"context":true}',
      ),
    ).toBe(415);
    expect(read('{"message":"404_imgur_embed"}')).toBeUndefined();
    expect(read({ message: 'resize_imgur', height: 415 })).toBeUndefined();
  });
});

describe('stravaPlan', () => {
  const ROUTE = '3247927232574435836';

  it('builds the route frame for embed code', () => {
    expect(stravaPlan(fromCode(stravaRoute, 'strava'), {})).toEqual({
      kind: 'iframe',
      src: `https://strava-embeds.com/route/${ROUTE}?style=standard#ns=social-embeds`,
      title: 'Strava route',
      allow: '',
      scrolling: 'no',
      ratio: { width: 1, height: 1 },
      messageHeight: {
        origin: 'https://strava-embeds.com',
        read: expect.any(Function) as unknown,
      },
      startHeight: 650,
      maxWidth: 554,
    });
  });

  it('builds the activity frame for a URL', () => {
    expect(
      stravaPlan(
        fromUrl('https://www.strava.com/activities/123456', 'strava'),
        {},
      ),
    ).toMatchObject({
      src: 'https://strava-embeds.com/activity/123456?style=standard#ns=social-embeds',
      title: 'Strava activity',
      maxWidth: 554,
    });
  });

  it('keeps the style, full width and map hash of the embed code', () => {
    const code = stravaRoute.replace(
      'data-style="standard"',
      'data-style="minimal" data-full-width="true" data-map-hash="a1_b-2"',
    );
    const plan = stravaPlan(fromCode(code, 'strava'), {});
    expect(plan).toMatchObject({
      src: `https://strava-embeds.com/route/${ROUTE}?style=minimal&fullWidth=true#ns=social-embeds&mapHash=a1_b-2`,
    });
    expect(plan.kind === 'iframe' ? plan.maxWidth : 'error').toBeUndefined();
  });

  it('lets the option props replace the embed code', () => {
    const code = stravaRoute.replace(
      'data-style="standard"',
      'data-style="minimal" data-full-width="true"',
    );
    expect(
      stravaPlan(fromCode(code, 'strava'), {
        embedStyle: 'standard',
        fullWidth: false,
        mapHash: 'x y',
      }),
    ).toMatchObject({
      src: `https://strava-embeds.com/route/${ROUTE}?style=standard#ns=social-embeds&mapHash=x%20y`,
      maxWidth: 554,
    });
  });

  it('gives an activity no full width', () => {
    const embed = fromUrl('https://www.strava.com/activities/123456', 'strava');
    expect(
      stravaPlan(
        { ...embed, options: { fullWidth: true } },
        { fullWidth: true },
      ),
    ).toMatchObject({
      src: 'https://strava-embeds.com/activity/123456?style=standard#ns=social-embeds',
      maxWidth: 554,
    });
  });

  it('keeps the verified type and id when options name others', () => {
    const embed = fromCode(stravaRoute, 'strava');
    expect(
      stravaPlan(
        {
          ...embed,
          options: {
            embedId: '1',
            embedType: 'activity',
            id: '2',
            type: 'activity',
            style: 'evil',
            fromEmbed: true,
          },
        },
        {},
      ),
    ).toMatchObject({
      src: `https://strava-embeds.com/route/${ROUTE}?style=standard#ns=social-embeds`,
    });
  });

  it('reads the height of a BROADCAST_IFRAME_HEIGHT message', () => {
    const plan = stravaPlan(fromCode(stravaRoute, 'strava'), {});
    if (plan.kind !== 'iframe' || !plan.messageHeight) throw new Error('plan');
    const { read } = plan.messageHeight;
    expect(read(['social-embeds', 'BROADCAST_IFRAME_HEIGHT', 571])).toBe(571);
    expect(read([null, 'BROADCAST_IFRAME_HEIGHT', 571])).toBe(571);
    expect(read(['social-embeds', 'BROADCAST_HOST_FOCUS', {}])).toBeUndefined();
    expect(
      read(['social-embeds', 'BROADCAST_IFRAME_HEIGHT', '571']),
    ).toBeUndefined();
    expect(read({ height: 571 })).toBeUndefined();
  });
});

describe('flickrPlan', () => {
  const PHOTO = 'https://www.flickr.com/photos/flickr/55618331478/';
  const IMAGE_STYLE = 'display:block;width:100%;height:100%;object-fit:cover';

  it('builds the photo frame at the image ratio, with the image as fallback', () => {
    expect(flickrPlan(fromCode(flickrDialog, 'flickr'), {})).toEqual({
      kind: 'iframe',
      src: 'https://embedr.flickr.com/photos/55618331478',
      title: 'Flickr photo',
      allow: '',
      scrolling: 'no',
      ratio: { width: 4, height: 3 },
      size: { width: 4096, height: 2301 },
      sizeInSrc: true,
      maxWidth: 4096,
      fallbackHtml: `<a href="${PHOTO}"><img style="${IMAGE_STYLE}" src="https://live.staticflickr.com/65535/55618331478_aa284e58b6_4k.jpg" width="4096" height="2301" alt="Flickr for the Planet Feature - Rio Arrayanes, Patagonia Argentina"></a>`,
      fallbackImage: true,
    });
  });

  it('builds the album frame', () => {
    expect(flickrPlan(fromCode(flickrAlbum, 'flickr'), {})).toMatchObject({
      src: 'https://embedr.flickr.com/photosets/72157716823987722',
      title: 'Flickr album',
      size: { width: 800, height: 600 },
      maxWidth: 800,
    });
  });

  it('keeps the header, footer and slideshow of the embed code', () => {
    expect(
      flickrPlan(fromCode(flickrHeaderFooter, 'flickr'), {}),
    ).toMatchObject({
      src: 'https://embedr.flickr.com/photos/55618331478?header=true&footer=true',
    });
    expect(flickrPlan(fromCode(flickrSlideshow, 'flickr'), {})).toMatchObject({
      src: 'https://embedr.flickr.com/photos/55618331478?context=true',
      size: { width: 800, height: 449 },
      maxWidth: 800,
    });
  });

  it('lets the option props replace the embed code', () => {
    expect(
      flickrPlan(fromCode(flickrHeaderFooter, 'flickr'), {
        header: false,
        context: true,
      }),
    ).toMatchObject({
      src: 'https://embedr.flickr.com/photos/55618331478?footer=true&context=true',
    });
  });

  it('renders a URL at 4:3 with no maximum width and no fallback', () => {
    expect(flickrPlan(fromUrl(PHOTO, 'flickr'), {})).toEqual({
      kind: 'iframe',
      src: 'https://embedr.flickr.com/photos/55618331478',
      title: 'Flickr photo',
      allow: '',
      scrolling: 'no',
      ratio: { width: 4, height: 3 },
      sizeInSrc: true,
      fallbackImage: true,
    });
  });

  it('builds the same frame for a flic.kr URL as for the long URL', () => {
    const short = flickrPlan(
      fromUrl('https://flic.kr/p/2sJNueC', 'flickr'),
      {},
    );
    expect(short).toEqual(flickrPlan(fromUrl(PHOTO, 'flickr'), {}));
  });

  it('builds the album frame for an album URL', () => {
    expect(
      flickrPlan(
        fromUrl(
          'https://www.flickr.com/photos/flickr/albums/72157716823987722',
          'flickr',
        ),
        {},
      ),
    ).toMatchObject({
      src: 'https://embedr.flickr.com/photosets/72157716823987722',
      title: 'Flickr album',
    });
  });

  it('treats a user named albums as a photo', () => {
    expect(
      flickrPlan(
        fromUrl('https://www.flickr.com/photos/albums/55618331478/', 'flickr'),
        {},
      ),
    ).toMatchObject({ src: 'https://embedr.flickr.com/photos/55618331478' });
  });

  it('ignores options that are not kept', () => {
    const embed = fromCode(flickrDialog, 'flickr');
    expect(
      flickrPlan(
        {
          ...embed,
          options: { id: '1', secret: 'x', width: 9, header: 'true' },
        },
        {},
      ),
    ).toMatchObject({ src: 'https://embedr.flickr.com/photos/55618331478' });
  });
});
