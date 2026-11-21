import type { IframePlan } from './plan';

export type FrameLayout = {
  width?: number | string;
  maxWidth?: number;
  height?: number;
  maxHeight?: number;
};

function aspectOf(plan: Pick<IframePlan, 'ratio' | 'size'>): {
  width: number;
  height: number;
} {
  return {
    width: plan.size?.width ?? plan.ratio.width,
    height: plan.size?.height ?? plan.ratio.height,
  };
}

/** The iframe wrapper's style, without the host's `style`. Numbers are pixels. */
export function frameStyle(
  plan: IframePlan,
  layout: FrameLayout,
  reportedHeight?: number,
): Record<string, string | number> {
  const { width = '100%', maxHeight } = layout;
  const height = layout.height ?? plan.height;
  const maxWidth = layout.maxWidth ?? plan.maxWidth;
  const { width: aspectWidth, height: aspectHeight } = aspectOf(plan);
  // With an aspect ratio, a height limit is a width limit: the widest box that fits it.
  const widest =
    maxHeight === undefined || height !== undefined
      ? undefined
      : Math.floor((maxHeight * aspectWidth) / aspectHeight);
  return {
    position: 'relative',
    width,
    maxWidth:
      widest === undefined || (maxWidth !== undefined && maxWidth < widest)
        ? maxWidth
        : widest,
    ...(plan.messageHeight
      ? { height: reportedHeight ?? plan.startHeight }
      : height === undefined
        ? { aspectRatio: `${String(aspectWidth)} / ${String(aspectHeight)}` }
        : { height, maxHeight }),
    ...(plan.borderRadius === undefined
      ? {}
      : { borderRadius: plan.borderRadius, overflow: 'hidden' }),
  } as Record<string, string | number>;
}

/** `src` for a plan with `sizeInSrc`, in a box `width` pixels wide. */
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

/** Calls `onWidth` with the element's rounded width once it has one, and again whenever it changes. */
export function watchWidth(
  element: Element,
  onWidth: (width: number) => void,
): () => void {
  let last: number | undefined;
  const take = (width: number) => {
    const rounded = Math.round(width);
    if (rounded <= 0 || rounded === last) return;
    last = rounded;
    onWidth(rounded);
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
  };
}
