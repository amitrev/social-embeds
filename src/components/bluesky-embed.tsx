import { useReportError } from './hooks';
import { IframeEmbed, type MessageHeight } from './iframe-embed';
import {
  type EmbedSource,
  query,
  resolveEmbed,
  type SharedProps,
} from './shared';

export type BlueskyOptions = {
  colorMode?: 'light' | 'dark' | 'system';
};

export type BlueskyEmbedProps = EmbedSource &
  Omit<SharedProps, keyof BlueskyOptions> &
  BlueskyOptions;

/** The frame posts `{ height }` once it has painted (docs/decisions.md D70). */
const BLUESKY_HEIGHT: MessageHeight = {
  origin: 'https://embed.bsky.app',
  read(data) {
    const height = (data as { height?: unknown } | null)?.height;
    return typeof height === 'number' ? height : undefined;
  },
};
const START_HEIGHT = 300;

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
    maxWidth = 600,
    colorMode,
    placeholder,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'bluesky');
  useReportError(error, onError);
  if (!embed) return null;

  const mode = colorMode ?? embed.options.colorMode;
  return (
    <IframeEmbed
      {...shared}
      onError={onError}
      maxWidth={maxWidth}
      placeholder={
        placeholder ??
        (embed.fallbackHtml === undefined ? undefined : (
          // Verified by resolveEmbed: only what the parser's whitelist rebuilds.
          <blockquote
            dangerouslySetInnerHTML={{ __html: embed.fallbackHtml }}
          />
        ))
      }
      src={`https://embed.bsky.app/embed/${embed.id}${query(
        typeof mode === 'string' ? [['colorMode', mode]] : undefined,
      )}`}
      title="Bluesky post"
      allow=""
      scrolling="no"
      ratio={{ width: 1, height: 1 }}
      messageHeight={BLUESKY_HEIGHT}
      startHeight={START_HEIGHT}
    />
  );
}
