import type { ParsedEmbed } from '../../parser';
import { facebookDriver } from '../drivers';
import {
  dataAttributes,
  escapeAttribute,
  hasFallback,
  withProps,
} from '../markup';
import { query } from '../params';
import type { IframePlan, Plan, PlanError } from '../plan';

/**
 * `data-width` and `data-lazy` have no props, because `width` and `lazy` are the wrapper's
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

const ATTRIBUTES = {
  width: 'data-width',
  showText: 'data-show-text',
  lazy: 'data-lazy',
  allowfullscreen: 'data-allowfullscreen',
  autoplay: 'data-autoplay',
  showCaptions: 'data-show-captions',
};

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

// The value in Facebook's own embed code.
const ALLOW =
  'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';

/** Its content fills the iframe at any width, whatever `width` says (docs/decisions.md D29). */
export function facebookVideoPlan(embed: ParsedEmbed): IframePlan {
  // The verified URL is the only href; an `href` option must not replace it.
  const params = Object.entries(embed.options).filter(
    ([key]) => key !== 'href',
  );
  return {
    kind: 'iframe',
    src: `https://www.facebook.com/plugins/video.php${query([['href', embed.url]], params)}`,
    title: 'Facebook video player',
    allow: ALLOW,
    scrolling: 'no',
    ratio: { width: 16, height: 9 },
    size: embed.size,
  };
}

// Which input renders through the SDK and which as an iframe: docs/decisions.md D22, D44, D45.
export function facebookPlan(
  embed: ParsedEmbed,
  options: FacebookOptions,
): Plan | PlanError {
  if (embed.variant === 'iframe') return facebookVideoPlan(embed);

  const merged = withProps(embed.options, {
    showText: options.showText,
    allowfullscreen: options.allowfullscreen,
    autoplay: options.autoplay,
    showCaptions: options.showCaptions,
  });

  // Without its post text, a video of known size is the plain iframe (docs/decisions.md D45).
  const { size } = embed;
  if (
    embed.kind === 'video' &&
    merged.showText === false &&
    size?.width !== undefined &&
    size.height !== undefined
  ) {
    const parameters: ParsedEmbed['options'] = {};
    for (const [option, name] of Object.entries(PLAYER_PARAMETERS)) {
      const value = merged[option];
      if (value !== undefined) parameters[name] = value;
    }
    parameters.width = size.width;
    parameters.height = size.height;
    return facebookVideoPlan({ ...embed, options: parameters });
  }

  const sdkLocale =
    options.locale ??
    (typeof merged.locale === 'string' ? merged.locale : 'en_US');
  const plugin = embed.kind === 'video' ? 'fb-video' : 'fb-post';
  const markup = `<div class="${plugin}" data-href="${escapeAttribute(embed.url)}"${dataAttributes(ATTRIBUTES, merged)}>${embed.fallbackHtml ?? ''}</div>`;
  return {
    kind: 'script',
    key: `${sdkLocale} ${markup}`,
    markup,
    driver: facebookDriver(sdkLocale),
    minHeight: MIN_HEIGHT[embed.kind],
    label: 'Facebook',
    hasFallback: hasFallback(embed.fallbackHtml),
    maxWidth: embed.kind === 'post' ? POST_MAX_WIDTH : undefined,
  };
}
