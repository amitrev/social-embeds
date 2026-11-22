import type { IframePlan } from './plan';

export type FrameLayout = {
  width?: number | string;
  maxWidth?: number;
  height?: number;
  maxHeight?: number;
};

export function aspectOf(plan: Pick<IframePlan, 'ratio' | 'size'>): {
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
