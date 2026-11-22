import { flickrPlan, type FlickrOptions } from '../core/plans/flickr';
import { flickrMatcher as flickr } from '../parser/matchers/flickr';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { fallbackPlaceholder, frameOf } from './iframe-embed';

export type { FlickrOptions };

export type FlickrEmbedProps = EmbedSource &
  Omit<FrameProps, keyof FlickrOptions> &
  FlickrOptions;

const FLICKR_OPTIONS = ['header', 'footer', 'context'] as const;

/** Embed code keeps its image's ratio and is at most as wide as the image; a URL renders at 4:3 (docs/decisions.md D98). */
export function FlickrEmbed(props: FlickrEmbedProps) {
  const [plan, frame] = usePlan(props, flickr, FLICKR_OPTIONS, flickrPlan);
  return plan?.kind === 'iframe'
    ? frameOf(plan, frame, fallbackPlaceholder)
    : null;
}
