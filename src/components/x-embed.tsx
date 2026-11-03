import { xDriver } from './drivers';
import { useReportError } from './hooks';
import {
  dataAttributes,
  escapeAttribute,
  hasFallback,
  withProps,
} from './markup';
import { ScriptEmbed } from './script-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

/**
 * The embedded post attributes X documents. `data-width` has no prop, because `width` is
 * the wrapper's; the post fills the wrapper up to `maxWidth` (docs/decisions.md D33).
 */
export type XOptions = {
  theme?: 'light' | 'dark';
  conversation?: 'none';
  cards?: 'hidden';
  align?: 'left' | 'center' | 'right';
  lang?: string;
  dnt?: boolean;
};

export type XEmbedProps = EmbedSource &
  Omit<SharedProps, keyof XOptions> &
  XOptions;

const ATTRIBUTES = {
  theme: 'data-theme',
  conversation: 'data-conversation',
  cards: 'data-cards',
  align: 'data-align',
  lang: 'data-lang',
  dnt: 'data-dnt',
  width: 'data-width',
};

/** A plain text post, the smallest X renders (docs/decisions.md D34). */
const MIN_HEIGHT = 250;

export function XEmbed(props: XEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth = 550,
    theme,
    conversation,
    cards,
    align,
    lang,
    dnt,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'x');
  useReportError(error, onError);
  if (!embed) return null;

  const options = withProps(embed.options, {
    theme,
    conversation,
    cards,
    align,
    lang,
    dnt,
  });
  // Without fallback content, widgets.js finds the post through this link.
  const content =
    embed.fallbackHtml ?? `<a href="${escapeAttribute(embed.url)}"></a>`;
  // No class yet: the driver adds it when the post renders (docs/decisions.md D39).
  const markup = `<blockquote${dataAttributes(ATTRIBUTES, options)}>${content}</blockquote>`;

  return (
    <ScriptEmbed
      key={markup}
      {...shared}
      onError={onError}
      maxWidth={maxWidth}
      driver={xDriver}
      markup={markup}
      hasFallback={hasFallback(embed.fallbackHtml)}
      minHeight={MIN_HEIGHT}
      label="X"
    />
  );
}
