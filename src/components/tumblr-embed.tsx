import { tumblrPlan } from '../core/plans/tumblr';
import { tumblr } from '../parser/platforms/tumblr';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type TumblrEmbedProps = EmbedSource & SharedProps;

/** At most 540px wide by default, Tumblr's oEmbed width. Renders the frame `post.js` would create (docs/decisions.md D77). */
export function TumblrEmbed(props: TumblrEmbedProps) {
  const { url, embed: given, onError, maxWidth, ...shared } = props;
  const { embed, error } = resolveEmbed(url, given, tumblr);
  const plan = embed ? tumblrPlan(embed) : undefined;
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
