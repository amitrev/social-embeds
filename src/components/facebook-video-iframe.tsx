import type { ParsedEmbed } from '../parser';
import { facebookVideoPlan } from '../core/plans/facebook';
import { IframeEmbed, planProps } from './iframe-embed';
import type { FrameProps } from './shared';

export function FacebookVideoIframe({
  embed,
  ...frame
}: FrameProps & { embed: ParsedEmbed }) {
  return <IframeEmbed {...frame} {...planProps(facebookVideoPlan(embed))} />;
}
