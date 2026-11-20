import { matchUrl, type ParsedEmbed, type Platform } from '../parser';
import { needsLookup } from '../parser/lookup';
import { verifyEmbed } from '../parser/verify';

export const NAMES: Record<Platform, string> = {
  x: 'X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  threads: 'Threads',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  telegram: 'Telegram',
  snapchat: 'Snapchat',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  pinterest: 'Pinterest',
  spotify: 'Spotify',
  vimeo: 'Vimeo',
  twitch: 'Twitch',
  dailymotion: 'Dailymotion',
  bluesky: 'Bluesky',
  soundcloud: 'SoundCloud',
  applemusic: 'Apple Music',
  applepodcasts: 'Apple Podcasts',
  tumblr: 'Tumblr',
  kick: 'Kick',
  giphy: 'Giphy',
};

/** For a post URL that only a network lookup could resolve (docs/decisions.md D70). */
export function lookupMessage(platform: Platform): string {
  return `social-embeds: a ${NAMES[platform]} URL needs a lookup: use the embed code`;
}

export function resolveEmbed(
  url: string | undefined,
  given: ParsedEmbed | undefined,
  platform: Platform,
): { embed: ParsedEmbed; error?: never } | { embed?: never; error: string } {
  const embed = given ?? (url === undefined ? null : matchUrl(url));
  if (!embed && url !== undefined && needsLookup(url) === platform) {
    return {
      error: lookupMessage(platform),
    };
  }
  if (!embed) {
    return {
      error: `social-embeds: not a ${NAMES[platform]} post URL: ${String(url)}`,
    };
  }
  if (embed.platform !== platform) {
    return {
      error: `social-embeds: expected a ${NAMES[platform]} embed, got ${NAMES[embed.platform]}`,
    };
  }
  const verified = verifyEmbed(embed);
  if (!verified) {
    return {
      error: `social-embeds: the ${NAMES[platform]} embed's url and id do not match`,
    };
  }
  return { embed: verified };
}

/** The message `<SocialEmbed>` reports when its input matches no platform. */
export function sourceError(
  source: { html: string } | { url: string },
): string {
  if ('html' in source) return 'social-embeds: unrecognised embed code';
  const lookup = needsLookup(source.url);
  return lookup
    ? lookupMessage(lookup)
    : `social-embeds: not a supported post URL: ${source.url}`;
}
