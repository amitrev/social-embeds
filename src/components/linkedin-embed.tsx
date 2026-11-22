import { linkedinPlan, type LinkedInOptions } from '../core/plans/linkedin';
import { linkedin } from '../parser/platforms/linkedin';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { LinkedInOptions };

export type LinkedInEmbedProps = EmbedSource &
  Omit<FrameProps, keyof LinkedInOptions> &
  LinkedInOptions;

const LINKEDIN_OPTIONS = ['collapsed'] as const;

/** A fixed height: the `height` prop, else the embed code's, else 670px. */
export function LinkedInEmbed(props: LinkedInEmbedProps) {
  const [plan, frame] = usePlan(
    props,
    linkedin,
    LINKEDIN_OPTIONS,
    linkedinPlan,
  );
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
