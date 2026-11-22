import { youtubePlan, type YouTubeOptions } from '../core/plans/youtube';
import { youtubeMatcher as youtube } from '../parser/matchers/youtube';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { YouTubeOptions };

export type YouTubeEmbedProps = EmbedSource &
  Omit<FrameProps, keyof YouTubeOptions> &
  YouTubeOptions;

const YOUTUBE_OPTIONS = [
  'autoplay',
  'ccLangPref',
  'ccLoadPolicy',
  'color',
  'controls',
  'disablekb',
  'enablejsapi',
  'end',
  'fs',
  'hl',
  'ivLoadPolicy',
  'list',
  'listType',
  'loop',
  'origin',
  'playlist',
  'playsinline',
  'rel',
  'start',
  'widgetReferrer',
  'nocookie',
] as const;

export function YouTubeEmbed(props: YouTubeEmbedProps) {
  const [plan, frame] = usePlan(props, youtube, YOUTUBE_OPTIONS, youtubePlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
