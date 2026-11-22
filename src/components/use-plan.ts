import type { Plan, PlanError } from '../core/plan';
import { resolveEmbed } from '../core/resolve';
import type { PlatformMatcher } from '../parser/platform';
import type { ParsedEmbed } from '../parser/types';
import { useReportError } from './hooks';
import type { EmbedSource } from './shared';

/** `names` must list every key of `O`, so no option prop reaches the wrapper `<div>`. */
type Every<O, K extends readonly PropertyKey[]> =
  Exclude<keyof O, K[number]> extends never ? K : never;

/**
 * One body for every platform component: resolves the input, plans it with the option props
 * named in `names`, reports invalid input, and returns the plan with the remaining props.
 */
export function usePlan<
  P extends EmbedSource & { onError?: (error: Error) => void },
  O,
  const K extends readonly (keyof O & keyof P)[],
>(
  props: P,
  parser: PlatformMatcher,
  names: Every<O, K>,
  plan: (embed: ParsedEmbed, options: O) => Plan | PlanError,
): [Plan | undefined, Omit<P, 'url' | 'embed' | K[number]>] {
  const { url, embed: given, ...others } = props as P & Record<string, unknown>;
  const options: Record<string, unknown> = {};
  for (const name of names as readonly string[])
    if (name in others) {
      options[name] = others[name];
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete others[name];
    }
  const { embed, error } = resolveEmbed(url, given, parser);
  const planned = embed ? plan(embed, options as O) : undefined;
  useReportError(
    error ?? (planned?.kind === 'error' ? planned.message : undefined),
    props.onError,
  );
  return [
    planned?.kind === 'error' ? undefined : planned,
    others as Omit<P, 'url' | 'embed' | K[number]>,
  ];
}
