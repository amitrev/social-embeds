import { facebookPlan, type FacebookOptions } from '../core/plans/facebook';
import { facebook } from '../parser/platforms/facebook';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { ScriptEmbed } from './script-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { FacebookOptions };

/** `height` and `maxHeight` apply only to a video that renders as an iframe. */
export type FacebookEmbedProps = EmbedSource &
  Omit<FrameProps, keyof FacebookOptions> &
  FacebookOptions;

export function FacebookEmbed(props: FacebookEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    locale,
    showText,
    allowfullscreen,
    autoplay,
    showCaptions,
    height,
    maxHeight,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, facebook);
  const plan = embed
    ? facebookPlan(embed, {
        locale,
        showText,
        allowfullscreen,
        autoplay,
        showCaptions,
      })
    : undefined;
  useReportError(
    error ?? (plan?.kind === 'error' ? plan.message : undefined),
    onError,
  );
  if (plan?.kind === 'iframe') {
    return (
      <IframeEmbed
        {...shared}
        {...planProps(plan)}
        onError={onError}
        maxWidth={maxWidth ?? plan.maxWidth}
        height={height}
        maxHeight={maxHeight}
      />
    );
  }
  if (plan?.kind !== 'script') return null;

  return (
    <ScriptEmbed
      key={plan.key}
      {...shared}
      onError={onError}
      maxWidth={maxWidth ?? plan.maxWidth}
      driver={plan.driver}
      markup={plan.markup}
      hasFallback={plan.hasFallback}
      minHeight={plan.minHeight}
      label={plan.label}
    />
  );
}
