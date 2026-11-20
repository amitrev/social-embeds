import type { ParsedEmbed } from '../../parser';
import { xDriver } from '../drivers';
import {
  dataAttributes,
  escapeAttribute,
  hasFallback,
  withProps,
} from '../markup';
import type { Plan, PlanError } from '../plan';

/**
 * `data-width` has no prop, because `width` is the wrapper's: the post fills the wrapper up
 * to `maxWidth` (docs/decisions.md D33).
 */
export type XOptions = {
  theme?: 'light' | 'dark';
  conversation?: 'none';
  cards?: 'hidden';
  align?: 'left' | 'center' | 'right';
  lang?: string;
  dnt?: boolean;
};

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

export function xPlan(embed: ParsedEmbed, options: XOptions): Plan | PlanError {
  const merged = withProps(embed.options, { ...options });
  // Without fallback content, widgets.js finds the post through this link.
  const content =
    embed.fallbackHtml ?? `<a href="${escapeAttribute(embed.url)}"></a>`;
  // No class yet: the driver adds it when the post renders (docs/decisions.md D39).
  const markup = `<blockquote${dataAttributes(ATTRIBUTES, merged)}>${content}</blockquote>`;
  return {
    kind: 'script',
    key: markup,
    markup,
    driver: xDriver,
    minHeight: MIN_HEIGHT,
    label: 'X',
    hasFallback: hasFallback(embed.fallbackHtml),
    maxWidth: 550,
  };
}
