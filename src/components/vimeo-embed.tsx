import { vimeoPlan, type VimeoOptions } from '../core/plans/vimeo';
import { vimeoMatcher as vimeo } from '../parser/matchers/vimeo';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { VimeoOptions };

export type VimeoEmbedProps = EmbedSource &
  Omit<FrameProps, keyof VimeoOptions> &
  VimeoOptions;

const VIMEO_OPTIONS = [
  'autopause',
  'autoplay',
  'background',
  'byline',
  'color',
  'controls',
  'dnt',
  'keyboard',
  'loop',
  'muted',
  'pip',
  'playsinline',
  'portrait',
  'quality',
  'speed',
  'title',
  'transparent',
  't',
] as const;

export function VimeoEmbed(props: VimeoEmbedProps) {
  const [plan, frame] = usePlan(props, vimeo, VIMEO_OPTIONS, vimeoPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
