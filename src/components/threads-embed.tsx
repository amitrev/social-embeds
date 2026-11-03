import { threadsDriver } from './drivers';
import { useReportError } from './hooks';
import { attributes, hasFallback, withProps } from './markup';
import { ScriptEmbed } from './script-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type ThreadsOptions = {
  /** `data-theme`; embed.js also reads `dark` and `auto` (docs/decisions.md D32). */
  theme?: 'light' | 'dark' | 'auto';
};

export type ThreadsEmbedProps = EmbedSource &
  Omit<SharedProps, keyof ThreadsOptions> &
  ThreadsOptions;

/** A text-only post (docs/decisions.md D34). */
const MIN_HEIGHT = 240;

export function ThreadsEmbed(props: ThreadsEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth = 658,
    theme,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'threads');
  useReportError(error, onError);
  if (!embed) return null;

  const options = withProps(embed.options, { theme });
  // embed.js removes the blockquote by this id once the post has mounted.
  const markup = `<blockquote class="text-post-media"${attributes({
    'data-text-post-permalink': embed.url,
    'data-text-post-version': options.version ?? 0,
    id: `ig-tp-${embed.id}`,
    'data-theme': options.theme,
  })}>${embed.fallbackHtml ?? ''}</blockquote>`;

  return (
    <ScriptEmbed
      key={markup}
      {...shared}
      onError={onError}
      maxWidth={maxWidth}
      driver={threadsDriver}
      markup={markup}
      hasFallback={hasFallback(embed.fallbackHtml)}
      minHeight={MIN_HEIGHT}
      label="Threads"
    />
  );
}
