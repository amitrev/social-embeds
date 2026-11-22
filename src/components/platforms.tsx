import { parseIframe } from '../parser/iframe';
import { applemusic as applemusicParser } from '../parser/platforms/applemusic';
import { applepodcasts as applepodcastsParser } from '../parser/platforms/applepodcasts';
import { bluesky as blueskyParser } from '../parser/platforms/bluesky';
import { dailymotion as dailymotionParser } from '../parser/platforms/dailymotion';
import { facebook as facebookParser } from '../parser/platforms/facebook';
import { flickr as flickrParser } from '../parser/platforms/flickr';
import { giphy as giphyParser } from '../parser/platforms/giphy';
import { imgur as imgurParser } from '../parser/platforms/imgur';
import { instagram as instagramParser } from '../parser/platforms/instagram';
import { kick as kickParser } from '../parser/platforms/kick';
import { linkedin as linkedinParser } from '../parser/platforms/linkedin';
import { pinterest as pinterestParser } from '../parser/platforms/pinterest';
import { reddit as redditParser } from '../parser/platforms/reddit';
import { rumble as rumbleParser } from '../parser/platforms/rumble';
import { snapchat as snapchatParser } from '../parser/platforms/snapchat';
import { soundcloud as soundcloudParser } from '../parser/platforms/soundcloud';
import { spotify as spotifyParser } from '../parser/platforms/spotify';
import { strava as stravaParser } from '../parser/platforms/strava';
import { streamable as streamableParser } from '../parser/platforms/streamable';
import { telegram as telegramParser } from '../parser/platforms/telegram';
import { tenor as tenorParser } from '../parser/platforms/tenor';
import { threads as threadsParser } from '../parser/platforms/threads';
import { tiktok as tiktokParser } from '../parser/platforms/tiktok';
import { truthsocial as truthsocialParser } from '../parser/platforms/truthsocial';
import { tumblr as tumblrParser } from '../parser/platforms/tumblr';
import { twitch as twitchParser } from '../parser/platforms/twitch';
import { vimeo as vimeoParser } from '../parser/platforms/vimeo';
import { x as xParser } from '../parser/platforms/x';
import { youtube as youtubeParser } from '../parser/platforms/youtube';
import { AppleMusicEmbed, ApplePodcastsEmbed } from './apple-embed';
import { BlueskyEmbed } from './bluesky-embed';
import { DailymotionEmbed } from './dailymotion-embed';
import { FacebookEmbed } from './facebook-embed';
import { FlickrEmbed } from './flickr-embed';
import { GiphyEmbed } from './giphy-embed';
import { ImgurEmbed } from './imgur-embed';
import { InstagramEmbed } from './instagram-embed';
import { KickEmbed } from './kick-embed';
import { LinkedInEmbed } from './linkedin-embed';
import { PinterestEmbed } from './pinterest-embed';
import { RedditEmbed } from './reddit-embed';
import { RumbleEmbed } from './rumble-embed';
import { SnapchatEmbed } from './snapchat-embed';
import { SoundCloudEmbed } from './soundcloud-embed';
import { SpotifyEmbed } from './spotify-embed';
import { StravaEmbed } from './strava-embed';
import { StreamableEmbed } from './streamable-embed';
import { TelegramEmbed } from './telegram-embed';
import { TenorEmbed } from './tenor-embed';
import { ThreadsEmbed } from './threads-embed';
import { TikTokEmbed } from './tiktok-embed';
import { TruthSocialEmbed } from './truthsocial-embed';
import { TumblrEmbed } from './tumblr-embed';
import { TwitchEmbed } from './twitch-embed';
import { VimeoEmbed } from './vimeo-embed';
import { XEmbed } from './x-embed';
import { YouTubeEmbed } from './youtube-embed';
import { GenericIframeEmbed } from './generic-iframe-embed';
import type { EmbedPlatform } from './social-embed';

// Object literals, not calls, so a bundler drops the platforms a page never imports (docs/decisions.md D113).

export const x: EmbedPlatform = {
  kind: 'platform',
  parser: xParser,
  render: (embed, { shared, onError }) => (
    <XEmbed {...shared} onError={onError} embed={embed} />
  ),
};

export const instagram: EmbedPlatform = {
  kind: 'platform',
  parser: instagramParser,
  render: (embed, { shared, onError }) => (
    <InstagramEmbed {...shared} onError={onError} embed={embed} />
  ),
};

export const facebook: EmbedPlatform = {
  kind: 'platform',
  parser: facebookParser,
  render: (embed, { shared, frame, onError }) => (
    <FacebookEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const threads: EmbedPlatform = {
  kind: 'platform',
  parser: threadsParser,
  render: (embed, { shared, onError }) => (
    <ThreadsEmbed {...shared} onError={onError} embed={embed} />
  ),
};

export const tiktok: EmbedPlatform = {
  kind: 'platform',
  parser: tiktokParser,
  render: (embed, { shared, frame, onError }) => (
    <TikTokEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const youtube: EmbedPlatform = {
  kind: 'platform',
  parser: youtubeParser,
  render: (embed, { shared, frame, onError }) => (
    <YouTubeEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const telegram: EmbedPlatform = {
  kind: 'platform',
  parser: telegramParser,
  render: (embed, { shared, onError }) => (
    <TelegramEmbed {...shared} onError={onError} embed={embed} />
  ),
};

export const snapchat: EmbedPlatform = {
  kind: 'platform',
  parser: snapchatParser,
  render: (embed, { shared, frame, onError }) => (
    <SnapchatEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const linkedin: EmbedPlatform = {
  kind: 'platform',
  parser: linkedinParser,
  render: (embed, { shared, frame, onError }) => (
    <LinkedInEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const reddit: EmbedPlatform = {
  kind: 'platform',
  parser: redditParser,
  render: (embed, { shared, onError }) => (
    <RedditEmbed {...shared} onError={onError} embed={embed} />
  ),
};

export const pinterest: EmbedPlatform = {
  kind: 'platform',
  parser: pinterestParser,
  render: (embed, { shared, onError }) => (
    <PinterestEmbed {...shared} onError={onError} embed={embed} />
  ),
};

export const spotify: EmbedPlatform = {
  kind: 'platform',
  parser: spotifyParser,
  render: (embed, { shared, frame, onError }) => (
    <SpotifyEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const vimeo: EmbedPlatform = {
  kind: 'platform',
  parser: vimeoParser,
  render: (embed, { shared, frame, onError }) => (
    <VimeoEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const twitch: EmbedPlatform = {
  kind: 'platform',
  parser: twitchParser,
  render: (embed, { shared, frame, onError }) => (
    <TwitchEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const dailymotion: EmbedPlatform = {
  kind: 'platform',
  parser: dailymotionParser,
  render: (embed, { shared, frame, onError }) => (
    // No Player ID prop here: only embed code that carries one renders (D63).
    <DailymotionEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const soundcloud: EmbedPlatform = {
  kind: 'platform',
  parser: soundcloudParser,
  render: (embed, { shared, frame, onError }) => (
    <SoundCloudEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const applemusic: EmbedPlatform = {
  kind: 'platform',
  parser: applemusicParser,
  render: (embed, { shared, frame, onError }) => (
    <AppleMusicEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const applepodcasts: EmbedPlatform = {
  kind: 'platform',
  parser: applepodcastsParser,
  render: (embed, { shared, frame, onError }) => (
    <ApplePodcastsEmbed
      {...shared}
      {...frame}
      onError={onError}
      embed={embed}
    />
  ),
};

export const kick: EmbedPlatform = {
  kind: 'platform',
  parser: kickParser,
  render: (embed, { shared, frame, onError }) => (
    <KickEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const giphy: EmbedPlatform = {
  kind: 'platform',
  parser: giphyParser,
  render: (embed, { shared, frame, onError }) => (
    <GiphyEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const tenor: EmbedPlatform = {
  kind: 'platform',
  parser: tenorParser,
  render: (embed, { shared, frame, onError }) => (
    <TenorEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const streamable: EmbedPlatform = {
  kind: 'platform',
  parser: streamableParser,
  render: (embed, { shared, frame, onError }) => (
    <StreamableEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const rumble: EmbedPlatform = {
  kind: 'platform',
  parser: rumbleParser,
  render: (embed, { shared, frame, onError }) => (
    <RumbleEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const truthsocial: EmbedPlatform = {
  kind: 'platform',
  parser: truthsocialParser,
  render: (embed, { shared, onError }) => (
    <TruthSocialEmbed {...shared} onError={onError} embed={embed} />
  ),
};

export const imgur: EmbedPlatform = {
  kind: 'platform',
  parser: imgurParser,
  render: (embed, { shared, onError }) => (
    <ImgurEmbed {...shared} onError={onError} embed={embed} />
  ),
};

export const strava: EmbedPlatform = {
  kind: 'platform',
  parser: stravaParser,
  render: (embed, { shared, onError }) => (
    <StravaEmbed {...shared} onError={onError} embed={embed} />
  ),
};

export const flickr: EmbedPlatform = {
  kind: 'platform',
  parser: flickrParser,
  render: (embed, { shared, frame, onError }) => (
    <FlickrEmbed {...shared} {...frame} onError={onError} embed={embed} />
  ),
};

export const bluesky: EmbedPlatform = {
  kind: 'platform',
  parser: blueskyParser,
  render: (embed, { shared, onError }) => (
    <BlueskyEmbed {...shared} onError={onError} embed={embed} />
  ),
};

export const tumblr: EmbedPlatform = {
  kind: 'platform',
  parser: tumblrParser,
  render: (embed, { shared, onError }) => (
    <TumblrEmbed {...shared} onError={onError} embed={embed} />
  ),
};

/** Iframe embed code that no listed platform recognises, checked as `GenericIframeEmbed` does. */
export const genericIframe: EmbedPlatform = {
  kind: 'iframe',
  parse: parseIframe,
  render: (embed, { shared, frame, onError }) => (
    <GenericIframeEmbed
      {...shared}
      {...frame}
      onError={onError}
      embed={embed}
    />
  ),
};

export const EVERY_PLATFORM: readonly EmbedPlatform[] = [
  genericIframe,
  x,
  instagram,
  facebook,
  threads,
  tiktok,
  youtube,
  telegram,
  snapchat,
  linkedin,
  reddit,
  pinterest,
  spotify,
  vimeo,
  twitch,
  dailymotion,
  soundcloud,
  applemusic,
  applepodcasts,
  kick,
  giphy,
  tenor,
  streamable,
  rumble,
  truthsocial,
  imgur,
  strava,
  flickr,
  bluesky,
  tumblr,
];
