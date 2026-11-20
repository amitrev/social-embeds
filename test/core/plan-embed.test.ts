import { describe, expect, it } from 'vitest';
import { planEmbed } from '../../src/core/plan-embed';
import type { Plan, PlanError } from '../../src/core/plan';
import { appleMusicPlan, applePodcastsPlan } from '../../src/core/plans/apple';
import { blueskyPlan } from '../../src/core/plans/bluesky';
import { dailymotionPlan } from '../../src/core/plans/dailymotion';
import { facebookPlan } from '../../src/core/plans/facebook';
import { giphyPlan } from '../../src/core/plans/giphy';
import { instagramPlan } from '../../src/core/plans/instagram';
import { kickPlan } from '../../src/core/plans/kick';
import { linkedinPlan } from '../../src/core/plans/linkedin';
import { pinterestPlan } from '../../src/core/plans/pinterest';
import { redditPlan } from '../../src/core/plans/reddit';
import { snapchatPlan } from '../../src/core/plans/snapchat';
import { soundcloudPlan } from '../../src/core/plans/soundcloud';
import { spotifyPlan } from '../../src/core/plans/spotify';
import { telegramPlan } from '../../src/core/plans/telegram';
import { threadsPlan } from '../../src/core/plans/threads';
import { tiktokPlan } from '../../src/core/plans/tiktok';
import { tumblrPlan } from '../../src/core/plans/tumblr';
import { twitchPlan } from '../../src/core/plans/twitch';
import { vimeoPlan } from '../../src/core/plans/vimeo';
import { xPlan } from '../../src/core/plans/x';
import { youtubePlan } from '../../src/core/plans/youtube';
import { parseEmbed, type ParsedEmbed, type Platform } from '../../src/parser';
import appleMusic from '../fixtures/applemusic/share-song.html?raw';
import applePodcasts from '../fixtures/applepodcasts/share-episode.html?raw';
import bluesky from '../fixtures/bluesky/oembed.html?raw';
import dailymotion from '../fixtures/dailymotion/player-id-docs.html?raw';
import fbVideo from '../fixtures/facebook/video-sdk-docs.html?raw';
import giphy from '../fixtures/giphy/embed-responsive.html?raw';
import instagram from '../fixtures/instagram/post-captioned.html?raw';
import kick from '../fixtures/kick/player-channel.html?raw';
import linkedin from '../fixtures/linkedin/post-full.html?raw';
import pinterest from '../fixtures/pinterest/widget-docs.html?raw';
import reddit from '../fixtures/reddit/post-share.html?raw';
import snapchat from '../fixtures/snapchat/profile-share.html?raw';
import soundcloud from '../fixtures/soundcloud/share-visual.html?raw';
import spotify from '../fixtures/spotify/oembed-track.html?raw';
import telegram from '../fixtures/telegram/widget-configurator.html?raw';
import threads from '../fixtures/threads/embed-dialog.html?raw';
import tiktok from '../fixtures/tiktok/oembed-player.html?raw';
import tumblr from '../fixtures/tumblr/oembed.html?raw';
import twitch from '../fixtures/twitch/docs-channel.html?raw';
import vimeo from '../fixtures/vimeo/responsive-docs.html?raw';
import x from '../fixtures/x/oembed-basic.html?raw';
import youtube from '../fixtures/youtube/share.html?raw';

type Case = [string, (embed: ParsedEmbed) => Plan | PlanError];

const cases = {
  x: [x, (e) => xPlan(e, {})],
  instagram: [instagram, (e) => instagramPlan(e, {})],
  facebook: [fbVideo, (e) => facebookPlan(e, {})],
  threads: [threads, (e) => threadsPlan(e, {})],
  tiktok: [tiktok, (e) => tiktokPlan(e, {})],
  youtube: [youtube, (e) => youtubePlan(e, {})],
  telegram: [telegram, (e) => telegramPlan(e, {})],
  snapchat: [snapchat, (e) => snapchatPlan(e)],
  linkedin: [linkedin, (e) => linkedinPlan(e, {})],
  reddit: [reddit, (e) => redditPlan(e, {})],
  pinterest: [pinterest, (e) => pinterestPlan(e, {})],
  spotify: [spotify, (e) => spotifyPlan(e, {})],
  vimeo: [vimeo, (e) => vimeoPlan(e, {})],
  twitch: [twitch, (e) => twitchPlan(e, {})],
  dailymotion: [dailymotion, (e) => dailymotionPlan(e, {})],
  bluesky: [bluesky, (e) => blueskyPlan(e, {})],
  soundcloud: [soundcloud, (e) => soundcloudPlan(e, {})],
  applemusic: [appleMusic, (e) => appleMusicPlan(e)],
  applepodcasts: [applePodcasts, (e) => applePodcastsPlan(e)],
  tumblr: [tumblr, (e) => tumblrPlan(e)],
  kick: [kick, (e) => kickPlan(e, {})],
  giphy: [giphy, (e) => giphyPlan(e)],
} satisfies Record<Platform, Case>;

describe('planEmbed', () => {
  it.each(Object.entries(cases))(
    'routes %s to its plan',
    (platform, [fixture, plan]) => {
      const embed = parseEmbed(fixture);
      if (!embed) throw new Error('fixture did not parse');
      expect(embed.platform).toBe(platform);
      expect(planEmbed(embed)).toEqual(plan(embed));
    },
  );
});
