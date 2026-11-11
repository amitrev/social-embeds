import type { ParsedEmbed } from '../parser';
import { facebookDriver } from './drivers';
import { FacebookVideoIframe } from './facebook-video-iframe';
import { useReportError } from './hooks';
import {
  dataAttributes,
  escapeAttribute,
  hasFallback,
  withProps,
} from './markup';
import { ScriptEmbed } from './script-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

/**
 * The plugin attributes Facebook documents, plus the SDK locale. `data-width` and
 * `data-lazy` have no props, because `width` and `lazy` are the wrapper's
 * (docs/decisions.md D33).
 */
export type FacebookOptions = {
  /** SDK locale, such as `bg_BG`. One SDK serves the page: the first locale wins. */
  locale?: string;
  showText?: boolean;
  /** Video only. */
  allowfullscreen?: boolean;
  /** Video only. */
  autoplay?: boolean;
  /** Video only. */
  showCaptions?: boolean;
};

/** `height` and `maxHeight` apply only to a video that renders as an iframe. */
export type FacebookEmbedProps = EmbedSource &
  Omit<FrameProps, keyof FacebookOptions> &
  FacebookOptions;

const ATTRIBUTES = {
  width: 'data-width',
  showText: 'data-show-text',
  lazy: 'data-lazy',
  allowfullscreen: 'data-allowfullscreen',
  autoplay: 'data-autoplay',
  showCaptions: 'data-show-captions',
};

/** The video options under the names `plugins/video.php` reads them by. */
const PLAYER_PARAMETERS = {
  showText: 'show_text',
  allowfullscreen: 'allowfullscreen',
  autoplay: 'autoplay',
  showCaptions: 'show_captions',
};

/** Embedded Posts: "Max. 750 pixel"; videos have no upper limit (docs/decisions.md D33). */
const POST_MAX_WIDTH = 750;

/** docs/decisions.md D34. */
const MIN_HEIGHT = { post: 300, video: 200 };

/**
 * Facebook rendering rules (brief §5.4): posts always through the SDK; video embed code as
 * the iframe that came in; video URLs through the SDK. The parser has set `variant`.
 * Video embed code that shows the post text also goes through the SDK (D44), unless
 * `showText` turns the text off: then it is the plain iframe (D45).
 */
export function FacebookEmbed(props: FacebookEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    locale,
    showText,
    allowfullscreen,
    autoplay,
    showCaptions,
    height,
    maxHeight,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'facebook');
  useReportError(error, onError);
  if (!embed) return null;

  const frame = { height, maxHeight };
  if (embed.variant === 'iframe') {
    return <FacebookVideoIframe {...shared} {...frame} embed={embed} />;
  }

  const options = withProps(embed.options, {
    showText,
    allowfullscreen,
    autoplay,
    showCaptions,
  });

  // Without the post text, a video whose player size is known is just that player: the
  // plain iframe in a box of its aspect ratio, with no script (docs/decisions.md D45).
  const { size } = embed;
  if (
    embed.kind === 'video' &&
    options.showText === false &&
    size?.width !== undefined &&
    size.height !== undefined
  ) {
    const parameters: ParsedEmbed['options'] = {};
    for (const [option, name] of Object.entries(PLAYER_PARAMETERS)) {
      const value = options[option];
      if (value !== undefined) parameters[name] = value;
    }
    parameters.width = size.width;
    parameters.height = size.height;
    return (
      <FacebookVideoIframe
        {...shared}
        {...frame}
        embed={{ ...embed, options: parameters }}
      />
    );
  }

  const sdkLocale =
    locale ?? (typeof options.locale === 'string' ? options.locale : 'en_US');
  const plugin = embed.kind === 'video' ? 'fb-video' : 'fb-post';
  const markup = `<div class="${plugin}" data-href="${escapeAttribute(embed.url)}"${dataAttributes(ATTRIBUTES, options)}>${embed.fallbackHtml ?? ''}</div>`;

  return (
    <ScriptEmbed
      key={`${sdkLocale} ${markup}`}
      maxWidth={embed.kind === 'post' ? POST_MAX_WIDTH : undefined}
      {...shared}
      onError={onError}
      driver={facebookDriver(sdkLocale)}
      markup={markup}
      hasFallback={hasFallback(embed.fallbackHtml)}
      minHeight={MIN_HEIGHT[embed.kind]}
      label="Facebook"
    />
  );
}
