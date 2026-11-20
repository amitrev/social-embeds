import type { IframePlan } from './plan';

export type FrameLayout = {
  width?: number | string;
  maxWidth?: number;
  height?: number;
  maxHeight?: number;
};

/** The iframe wrapper's style, without the host's `style`. Numbers are pixels. */
export function frameStyle(
  plan: IframePlan,
  layout: FrameLayout,
  reportedHeight?: number,
): Record<string, string | number> {
  const { width = '100%', height, maxHeight } = layout;
  const maxWidth = layout.maxWidth ?? plan.maxWidth;
  const aspectWidth = plan.size?.width ?? plan.ratio.width;
  const aspectHeight = plan.size?.height ?? plan.ratio.height;
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
  } as Record<string, string | number>;
}
