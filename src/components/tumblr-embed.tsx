import { useReportError } from './hooks';
import { IframeEmbed, type MessageHeight } from './iframe-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type TumblrEmbedProps = EmbedSource & SharedProps;

/** The frame posts a JSON string once it has painted (docs/decisions.md D74). */
const TUMBLR_HEIGHT: MessageHeight = {
  origin: 'https://embed.tumblr.com',
  read(data) {
    if (typeof data !== 'string') return undefined;
    const message = JSON.parse(data) as { method?: unknown; args?: unknown };
    const [height] = Array.isArray(message.args)
      ? (message.args as unknown[])
      : [];
    return message.method === 'tumblr-post:sizeChange' &&
      typeof height === 'number'
      ? height
      : undefined;
  },
};
const START_HEIGHT = 400;

/** At most 540px wide by default, Tumblr's oEmbed width. Renders the frame `post.js` would create (docs/decisions.md D77). */
export function TumblrEmbed(props: TumblrEmbedProps) {
  const { url, embed: given, onError, maxWidth = 540, ...shared } = props;
  const { embed, error } = resolveEmbed(url, given, 'tumblr');
  useReportError(error, onError);
  if (!embed) return null;

  const blog =
    embed.url.slice('https://www.tumblr.com/'.length).split('/')[0] ?? '';
  return (
    <IframeEmbed
      {...shared}
      onError={onError}
      maxWidth={maxWidth}
      src={`https://embed.tumblr.com/embed/post/${blog}/${embed.id}/v2`}
      title="Tumblr post"
      allow=""
      scrolling="no"
      ratio={{ width: 1, height: 1 }}
      messageHeight={TUMBLR_HEIGHT}
      startHeight={START_HEIGHT}
    />
  );
}
