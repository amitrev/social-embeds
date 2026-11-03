import { instagramDriver } from './drivers';
import { useReportError } from './hooks';
import { attributes, hasFallback, withProps } from './markup';
import { ScriptEmbed } from './script-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type InstagramOptions = {
  /** Show the caption (`data-instgrm-captioned`). */
  captioned?: boolean;
};

export type InstagramEmbedProps = EmbedSource &
  Omit<SharedProps, keyof InstagramOptions> &
  InstagramOptions;

/** A photo post without caption at 375px, the smallest measured (docs/decisions.md D34). */
const MIN_HEIGHT = 680;

/**
 * embed.js copies the blockquote's inline style onto its iframe and gives the iframe no
 * width of its own, so without this the post stays 326px wide. The value is the one in
 * Instagram's own embed code (docs/decisions.md D33).
 */
const FLUID_WIDTH = 'width:calc(100% - 2px)';

export function InstagramEmbed(props: InstagramEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth = 540,
    captioned,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'instagram');
  useReportError(error, onError);
  if (!embed) return null;

  const options = withProps(embed.options, { captioned });
  // No class yet: the driver adds it when the post renders (docs/decisions.md D39).
  const markup = `<blockquote${attributes({
    'data-instgrm-permalink': embed.url,
    'data-instgrm-version': options.version,
    'data-instgrm-captioned': options.captioned === true ? true : undefined,
    style: FLUID_WIDTH,
  })}>${embed.fallbackHtml ?? ''}</blockquote>`;

  return (
    <ScriptEmbed
      key={markup}
      {...shared}
      onError={onError}
      maxWidth={maxWidth}
      driver={instagramDriver}
      markup={markup}
      hasFallback={hasFallback(embed.fallbackHtml)}
      minHeight={MIN_HEIGHT}
      label="Instagram"
    />
  );
}
