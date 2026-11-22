import { aspectOf } from './layout';
import type { IframePlan } from './plan';
import { WIDTH_SETTLE_MS } from './timing';

// Only Flickr's plan imports this, so the other iframe embeds never bundle it (docs/decisions.md D114).

/** `src` in a box `width` pixels wide. */
export function srcWithSize(
  plan: Pick<IframePlan, 'src' | 'ratio' | 'size'>,
  width: number,
): string {
  const aspect = aspectOf(plan);
  const height = Math.round((width * aspect.height) / aspect.width);
  const query = plan.src.indexOf('?');
  const path = query === -1 ? plan.src : plan.src.slice(0, query);
  const rest = query === -1 ? '' : `&${plan.src.slice(query + 1)}`;
  return `${path}?width=${String(width)}&height=${String(height)}${rest}`;
}

/**
 * Calls `onWidth` with the element's rounded width once it has one, then with each new width
 * that has held for WIDTH_SETTLE_MS, so a resize rebuilds the frame once.
 */
export function watchWidth(
  element: Element,
  onWidth: (width: number) => void,
): () => void {
  let last: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const take = (width: number) => {
    const rounded = Math.round(width);
    if (rounded <= 0) return;
    clearTimeout(timer);
    if (rounded === last) return;
    if (last === undefined) {
      last = rounded;
      onWidth(rounded);
      return;
    }
    timer = setTimeout(() => {
      last = rounded;
      onWidth(rounded);
    }, WIDTH_SETTLE_MS);
  };
  if (typeof ResizeObserver === 'undefined') {
    take(element.getBoundingClientRect().width);
    return () => {};
  }
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) take(entry.contentRect.width);
  });
  observer.observe(element);
  return () => {
    observer.disconnect();
    clearTimeout(timer);
  };
}
