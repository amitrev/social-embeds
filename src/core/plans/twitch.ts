import type { ParsedEmbed } from '../../parser';
import { optionsWithout, query } from '../params';
import type { Plan, PlanError } from '../plan';

export type TwitchOptions = {
  /** Twitch's default: `true` for channels and videos, `false` for clips. */
  autoplay?: boolean;
  muted?: boolean;
  /** A video's start time, as `1h2m3s`. */
  time?: string;
};

// The content parameters, and `parent`, which IframeEmbed adds (docs/decisions.md D65).
const RESERVED = ['channel', 'video', 'collection', 'clip', 'parent'];

/** The player and its content parameter for the embed's canonical URL (docs/decisions.md D64). */
function player(url: string, id: string): [string, [string, string]] {
  const { hostname, pathname } = new URL(url);
  if (hostname === 'clips.twitch.tv')
    return ['https://clips.twitch.tv/embed', ['clip', id]];
  const section = pathname.split('/')[1];
  return [
    'https://player.twitch.tv/',
    section === 'videos'
      ? ['video', `v${id}`]
      : section === 'collections'
        ? ['collection', id]
        : ['channel', id],
  ];
}

/** `parent` is the page's own host, added on the client (docs/decisions.md D62, D65). */
export function twitchPlan(
  embed: ParsedEmbed,
  options: TwitchOptions,
): Plan | PlanError {
  const { autoplay, muted, time } = options;
  // Twitch reads `true` and `false`, not 1 and 0.
  const params: [string, string][] = [];
  if (autoplay !== undefined) params.push(['autoplay', String(autoplay)]);
  if (muted !== undefined) params.push(['muted', String(muted)]);
  if (time !== undefined) params.push(['time', time]);
  const [base, content] = player(embed.url, embed.id);
  return {
    kind: 'iframe',
    src: `${base}${query([content], optionsWithout(embed.options, RESERVED), params)}`,
    title: 'Twitch player',
    allow: '',
    ratio: { width: 16, height: 9 },
    size: embed.size,
    clientSrc: withParent,
  };
}

// Twitch's player needs the embedding page's host in `parent`; never runs on the server (D28).
export function withParent(src: string): string {
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}parent=${encodeURIComponent(window.location.hostname)}`;
}
