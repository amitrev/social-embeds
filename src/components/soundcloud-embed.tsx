import { soundcloud } from '../parser/platforms/soundcloud';
import {
  soundcloudPlan,
  type SoundCloudOptions,
} from '../core/plans/soundcloud';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { SoundCloudOptions };

export type SoundCloudEmbedProps = EmbedSource &
  Omit<FrameProps, keyof SoundCloudOptions> &
  SoundCloudOptions;

const SOUNDCLOUD_OPTIONS = [
  'visual',
  'color',
  'autoPlay',
  'hideRelated',
  'showComments',
  'showUser',
  'showReposts',
  'showTeaser',
  'showArtwork',
] as const;

/** A fixed height: the `height` prop, else the embed code's, else 400px for the visual player. */
export function SoundCloudEmbed(props: SoundCloudEmbedProps) {
  const [plan, frame] = usePlan(
    props,
    soundcloud,
    SOUNDCLOUD_OPTIONS,
    soundcloudPlan,
  );
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
