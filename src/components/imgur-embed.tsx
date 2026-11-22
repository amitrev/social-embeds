import { imgurPlan, type ImgurOptions } from '../core/plans/imgur';
import { imgur } from '../parser/platforms/imgur';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { fallbackPlaceholder, frameOf } from './iframe-embed';

export type { ImgurOptions };

export type ImgurEmbedProps = EmbedSource &
  Omit<SharedProps, keyof ImgurOptions> &
  ImgurOptions;

const IMGUR_OPTIONS = ['context'] as const;

/** At most 540px wide by default, the widest `embed.js` makes the frame (docs/decisions.md D94). */
export function ImgurEmbed(props: ImgurEmbedProps) {
  const [plan, frame] = usePlan(props, imgur, IMGUR_OPTIONS, imgurPlan);
  return plan?.kind === 'iframe'
    ? frameOf(plan, frame, fallbackPlaceholder)
    : null;
}
