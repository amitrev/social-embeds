import { facebookPlan, type FacebookOptions } from '../core/plans/facebook';
import { facebookMatcher as facebook } from '../parser/matchers/facebook';
import { frameOf } from './iframe-embed';
import { scriptOf } from './script-embed';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';

export type { FacebookOptions };

/** `height` and `maxHeight` apply only to a video that renders as an iframe. */
export type FacebookEmbedProps = EmbedSource &
  Omit<FrameProps, keyof FacebookOptions> &
  FacebookOptions;

const FACEBOOK_OPTIONS = [
  'locale',
  'showText',
  'allowfullscreen',
  'autoplay',
  'showCaptions',
] as const;

export function FacebookEmbed(props: FacebookEmbedProps) {
  const [plan, frame] = usePlan(
    props,
    facebook,
    FACEBOOK_OPTIONS,
    facebookPlan,
  );
  if (plan?.kind === 'iframe') return frameOf(plan, frame);
  return plan?.kind === 'script' ? scriptOf(plan, frame) : null;
}
