import { imgurPlan, type ImgurOptions } from '../core/plans/imgur';
import { imgur } from '../parser/platforms/imgur';
import { useReportError } from './hooks';
import { fallbackPlaceholder, IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type { ImgurOptions };

export type ImgurEmbedProps = EmbedSource &
  Omit<SharedProps, keyof ImgurOptions> &
  ImgurOptions;

/** At most 540px wide by default, the widest `embed.js` makes the frame (docs/decisions.md D94). */
export function ImgurEmbed(props: ImgurEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    context,
    placeholder,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, imgur);
  const plan = embed ? imgurPlan(embed, { context }) : undefined;
  useReportError(
    error ?? (plan?.kind === 'error' ? plan.message : undefined),
    onError,
  );
  if (plan?.kind !== 'iframe') return null;

  return (
    <IframeEmbed
      {...shared}
      {...planProps(plan)}
      onError={onError}
      maxWidth={maxWidth ?? plan.maxWidth}
      placeholder={placeholder ?? fallbackPlaceholder(plan)}
    />
  );
}
