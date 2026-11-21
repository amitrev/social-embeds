import type { ParsedEmbed } from '../parser';
import type { Plan, PlanError } from './plan';
import { appleMusicPlan, applePodcastsPlan } from './plans/apple';
import { blueskyPlan } from './plans/bluesky';
import { dailymotionPlan } from './plans/dailymotion';
import { facebookPlan } from './plans/facebook';
import { giphyPlan } from './plans/giphy';
import { instagramPlan } from './plans/instagram';
import { kickPlan } from './plans/kick';
import { linkedinPlan } from './plans/linkedin';
import { pinterestPlan } from './plans/pinterest';
import { redditPlan } from './plans/reddit';
import { snapchatPlan } from './plans/snapchat';
import { soundcloudPlan } from './plans/soundcloud';
import { spotifyPlan } from './plans/spotify';
import { rumblePlan } from './plans/rumble';
import { streamablePlan } from './plans/streamable';
import { telegramPlan } from './plans/telegram';
import { tenorPlan } from './plans/tenor';
import { threadsPlan } from './plans/threads';
import { tiktokPlan } from './plans/tiktok';
import { tumblrPlan } from './plans/tumblr';
import { twitchPlan } from './plans/twitch';
import { vimeoPlan } from './plans/vimeo';
import { xPlan } from './plans/x';
import { youtubePlan } from './plans/youtube';

/** Plans an embed the way `<SocialEmbed>` does: with no host options. */
export function planEmbed(embed: ParsedEmbed): Plan | PlanError {
  switch (embed.platform) {
    case 'x':
      return xPlan(embed, {});
    case 'instagram':
      return instagramPlan(embed, {});
    case 'threads':
      return threadsPlan(embed, {});
    case 'facebook':
      return facebookPlan(embed, {});
    case 'tiktok':
      return tiktokPlan(embed, {});
    case 'youtube':
      return youtubePlan(embed, {});
    case 'telegram':
      return telegramPlan(embed, {});
    case 'snapchat':
      return snapchatPlan(embed);
    case 'linkedin':
      return linkedinPlan(embed, {});
    case 'reddit':
      return redditPlan(embed, {});
    case 'pinterest':
      return pinterestPlan(embed, {});
    case 'spotify':
      return spotifyPlan(embed, {});
    case 'vimeo':
      return vimeoPlan(embed, {});
    case 'twitch':
      return twitchPlan(embed, {});
    case 'dailymotion':
      return dailymotionPlan(embed, {});
    case 'bluesky':
      return blueskyPlan(embed, {});
    case 'soundcloud':
      return soundcloudPlan(embed, {});
    case 'applemusic':
      return appleMusicPlan(embed);
    case 'applepodcasts':
      return applePodcastsPlan(embed);
    case 'tumblr':
      return tumblrPlan(embed);
    case 'kick':
      return kickPlan(embed, {});
    case 'giphy':
      return giphyPlan(embed);
    case 'tenor':
      return tenorPlan(embed);
    case 'streamable':
      return streamablePlan(embed, {});
    case 'rumble':
      return rumblePlan(embed);
    // Placeholders until the plans of Tasks 7 and 8 replace them.
    case 'truthsocial':
    case 'imgur':
    case 'strava':
    case 'flickr':
      return {
        kind: 'error',
        message: `social-embeds: no plan for ${embed.platform} yet`,
      };
    default: {
      const unreachable: never = embed.platform;
      return unreachable;
    }
  }
}
