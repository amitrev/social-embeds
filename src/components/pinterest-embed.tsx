import { pinterestDriver } from './drivers';
import { useReportError } from './hooks';
import { dataAttributes, escapeAttribute, withProps } from './markup';
import { ScriptEmbed } from './script-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

/** `pinWidth` is `data-pin-width`; `width` stays the wrapper's. */
export type PinterestOptions = {
  pinWidth?: 'small' | 'medium' | 'large';
};

export type PinterestEmbedProps = EmbedSource &
  Omit<SharedProps, keyof PinterestOptions> &
  PinterestOptions;

const ATTRIBUTES = {
  width: 'data-pin-width',
  lang: 'data-pin-lang',
  terse: 'data-pin-terse',
};

// The pin's fixed width per data-pin-width (docs/decisions.md D51).
const PIN_WIDTHS: Record<string, number> = {
  small: 236,
  medium: 345,
  large: 600,
};
const DEFAULT_PIN_WIDTH = 236;
const MIN_HEIGHT = 270; // a landscape pin at the default width

export function PinterestEmbed(props: PinterestEmbedProps) {
  const { url, embed: given, onError, maxWidth, pinWidth, ...shared } = props;
  const { embed, error } = resolveEmbed(url, given, 'pinterest');
  useReportError(error, onError);
  if (!embed) return null;

  const options = withProps(embed.options, { width: pinWidth });
  const pinWidthPx = PIN_WIDTHS[String(options.width)] ?? DEFAULT_PIN_WIDTH;
  // No data-pin-do yet: the driver adds it when the pin renders (docs/decisions.md D39).
  const markup = `<a href="${escapeAttribute(embed.url)}"${dataAttributes(ATTRIBUTES, options)}></a>`;

  return (
    <ScriptEmbed
      key={markup}
      {...shared}
      onError={onError}
      maxWidth={maxWidth ?? pinWidthPx}
      driver={pinterestDriver}
      markup={markup}
      hasFallback={false}
      minHeight={MIN_HEIGHT}
      label="Pinterest"
    />
  );
}
