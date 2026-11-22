import type { ParsedEmbed } from '../../parser';
import type { MessageHeight, Plan, PlanError } from '../plan';
import { listenForHeight } from '../message-height';

const VIDEO_EXTRA = 165; // what Truth Social's embed.js adds for a video post

function setHeight(data: unknown): number | undefined {
  const message = data as { type?: unknown; height?: unknown } | null;
  return message?.type === 'setHeight' && typeof message.height === 'number'
    ? message.height
    : undefined;
}

/** The frame posts `{ type: 'setHeight', id, height }` without being asked (docs/decisions.md D93). */
const TRUTH_SOCIAL_HEIGHT: MessageHeight = {
  origin: 'https://truthsocial.com',
  read: setHeight,
  listen: listenForHeight,
};

/** A video post reports its height before the video is sized (docs/decisions.md D100). */
const TRUTH_SOCIAL_VIDEO_HEIGHT: MessageHeight = {
  origin: 'https://truthsocial.com',
  read(data) {
    const height = setHeight(data);
    // The frame posts 0 before it is painted; with the extra it would pass as a height.
    return height === undefined || height <= 0
      ? undefined
      : height + VIDEO_EXTRA;
  },
  listen: listenForHeight,
};

const CANONICAL = /^https:\/\/truthsocial\.com\/(@[^/]+)\/posts\/\d+$/;

/** At most 600px wide by default, the width of Truth Social's embed code (docs/decisions.md D93). */
export function truthSocialPlan(embed: ParsedEmbed): Plan | PlanError {
  // verifyEmbed guarantees the canonical form (docs/decisions.md D57).
  const user = CANONICAL.exec(embed.url)?.[1];
  if (user === undefined)
    return {
      kind: 'error',
      message: `social-embeds: not a Truth Social post URL: ${embed.url}`,
    };
  return {
    kind: 'iframe',
    src: `https://truthsocial.com/${user}/${embed.id}/embed`,
    title: 'Truth Social post',
    allow: '',
    scrolling: 'no',
    ratio: { width: 1, height: 1 },
    messageHeight:
      embed.options.video === true
        ? TRUTH_SOCIAL_VIDEO_HEIGHT
        : TRUTH_SOCIAL_HEIGHT,
    // The frame reports its document height, which never drops below the frame's own (docs/decisions.md D102).
    startHeight: 150,
    maxWidth: embed.size?.width ?? 600,
  };
}
