import { redditPlan, type RedditOptions } from '../core/plans/reddit';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type { RedditOptions };

export type RedditEmbedProps = EmbedSource &
  Omit<SharedProps, keyof RedditOptions> &
  RedditOptions;

/** At most 640px wide by default, the width widgets.js gives the frame (docs/decisions.md D52). */
export function RedditEmbed(props: RedditEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    theme,
    showMedia,
    showTitle,
    showUsername,
    locale,
    depth,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'reddit');
  const plan = embed
    ? redditPlan(embed, {
        theme,
        showMedia,
        showTitle,
        showUsername,
        locale,
        depth,
      })
    : undefined;
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
    />
  );
}
