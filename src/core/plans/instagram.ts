import type { ParsedEmbed } from '../../parser';
import { instagramDriver } from '../drivers';
import { attributes, hasFallback, withProps } from '../markup';
import type { Plan, PlanError } from '../plan';

export type InstagramOptions = {
  /** Show the caption (`data-instgrm-captioned`). */
  captioned?: boolean;
};

/** A photo post without caption at 375px, the smallest measured (docs/decisions.md D34). */
const MIN_HEIGHT = 680;

// embed.js copies the blockquote's inline style onto its iframe, which has no width of
// its own: without this the post stays 326px wide (docs/decisions.md D33).
const FLUID_WIDTH = 'width:calc(100% - 2px)';

export function instagramPlan(
  embed: ParsedEmbed,
  options: InstagramOptions,
): Plan | PlanError {
  const merged = withProps(embed.options, { captioned: options.captioned });
  // No class yet: the driver adds it when the post renders (docs/decisions.md D39).
  const markup = `<blockquote${attributes({
    'data-instgrm-permalink': embed.url,
    'data-instgrm-version': merged.version,
    'data-instgrm-captioned': merged.captioned === true ? true : undefined,
    style: FLUID_WIDTH,
  })}>${embed.fallbackHtml ?? ''}</blockquote>`;
  return {
    kind: 'script',
    key: markup,
    markup,
    driver: instagramDriver,
    minHeight: MIN_HEIGHT,
    label: 'Instagram',
    hasFallback: hasFallback(embed.fallbackHtml),
    maxWidth: 540,
  };
}
