import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import {
  type EmbedSource,
  type FrameProps,
  query,
  resolveEmbed,
} from './shared';

export type LinkedInOptions = {
  /** The Embed dialog's "less text" option. */
  collapsed?: boolean;
};

export type LinkedInEmbedProps = EmbedSource &
  Omit<FrameProps, keyof LinkedInOptions> &
  LinkedInOptions;

// LinkedIn's frame neither scales nor reports its height (docs/decisions.md D53).
const DEFAULT_HEIGHT = 670;
const DEFAULT_WIDTH = 504;

/** A fixed height: the `height` prop, else the embed code's, else 670px. */
export function LinkedInEmbed(props: LinkedInEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    height,
    collapsed,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'linkedin');
  useReportError(error, onError);
  if (!embed) return null;

  const params = new Map(Object.entries(embed.options));
  if (collapsed === true) params.set('collapsed', 1);
  if (collapsed === false) params.delete('collapsed');

  return (
    <IframeEmbed
      {...frame}
      maxWidth={maxWidth ?? embed.size?.width ?? DEFAULT_WIDTH}
      height={height ?? embed.size?.height ?? DEFAULT_HEIGHT}
      src={`https://www.linkedin.com/embed/feed/update/${embed.id}${query(params)}`}
      title="LinkedIn post"
      allow=""
      ratio={{ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }}
    />
  );
}
