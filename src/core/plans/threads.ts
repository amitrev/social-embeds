import type { ParsedEmbed } from '../../parser';
import { threadsDriver } from '../drivers';
import { attributes, hasFallback, withProps } from '../markup';
import type { Plan, PlanError } from '../plan';

export type ThreadsOptions = {
  /** `data-theme`; embed.js also reads `dark` and `auto` (docs/decisions.md D32). */
  theme?: 'light' | 'dark' | 'auto';
};

/** A text-only post (docs/decisions.md D34). */
const MIN_HEIGHT = 240;

export function threadsPlan(
  embed: ParsedEmbed,
  options: ThreadsOptions,
): Plan | PlanError {
  const merged = withProps(embed.options, { theme: options.theme });
  // embed.js removes the blockquote by this id once the post has mounted.
  // No class yet: the driver adds it when the post renders (docs/decisions.md D39).
  const markup = `<blockquote${attributes({
    'data-text-post-permalink': embed.url,
    'data-text-post-version': merged.version ?? 0,
    id: `ig-tp-${embed.id}`,
    'data-theme': merged.theme,
  })}>${embed.fallbackHtml ?? ''}</blockquote>`;
  return {
    kind: 'script',
    key: markup,
    markup,
    driver: threadsDriver,
    minHeight: MIN_HEIGHT,
    label: 'Threads',
    hasFallback: hasFallback(embed.fallbackHtml),
    maxWidth: 658,
  };
}
