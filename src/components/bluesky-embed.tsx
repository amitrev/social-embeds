import { blueskyPlan, type BlueskyOptions } from '../core/plans/bluesky';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type { BlueskyOptions };

export type BlueskyEmbedProps = EmbedSource &
  Omit<SharedProps, keyof BlueskyOptions> &
  BlueskyOptions;

/**
 * At most 600px wide by default, Bluesky's oEmbed width. Renders the frame `embed.js` would
 * create, without the script (docs/decisions.md D77). Only embed code and URLs with a DID
 * render: a handle URL needs a lookup, and `onError` says so.
 */
export function BlueskyEmbed(props: BlueskyEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    colorMode,
    placeholder,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'bluesky');
  const plan = embed ? blueskyPlan(embed, { colorMode }) : undefined;
  useReportError(
    error ?? (plan?.kind === 'error' ? plan.message : undefined),
    onError,
  );
  if (plan?.kind !== 'iframe') return null;

  const { fallbackHtml } = plan;
  return (
    <IframeEmbed
      {...shared}
      {...planProps(plan)}
      onError={onError}
      maxWidth={maxWidth ?? plan.maxWidth}
      placeholder={
        placeholder ??
        (fallbackHtml === undefined ? undefined : (
          // Verified by resolveEmbed: only what the parser's whitelist rebuilds.
          <blockquote dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
        ))
      }
    />
  );
}
