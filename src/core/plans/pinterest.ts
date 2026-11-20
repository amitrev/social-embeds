import type { ParsedEmbed } from '../../parser';
import { pinterestDriver } from '../drivers';
import { dataAttributes, escapeAttribute, withProps } from '../markup';
import type { Plan, PlanError } from '../plan';

/** `pinWidth` is `data-pin-width`; `width` stays the wrapper's. */
export type PinterestOptions = {
  pinWidth?: 'small' | 'medium' | 'large';
};

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

export function pinterestPlan(
  embed: ParsedEmbed,
  options: PinterestOptions,
): Plan | PlanError {
  const merged = withProps(embed.options, { width: options.pinWidth });
  // No data-pin-do yet: the driver adds it when the pin renders (docs/decisions.md D39).
  const markup = `<a href="${escapeAttribute(embed.url)}"${dataAttributes(ATTRIBUTES, merged)}></a>`;
  return {
    kind: 'script',
    key: markup,
    markup,
    driver: pinterestDriver,
    minHeight: MIN_HEIGHT,
    label: 'Pinterest',
    hasFallback: false,
    maxWidth: PIN_WIDTHS[String(merged.width)] ?? DEFAULT_PIN_WIDTH,
  };
}
