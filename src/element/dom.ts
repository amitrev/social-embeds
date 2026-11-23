import type { FrameLayout } from '../core/layout';

export type MountOptions = FrameLayout & {
  eager: boolean;
  placeholder: readonly Node[];
  onLoad: () => void;
  onError: (error: Error) => void;
};

export type Mounted = {
  wrapper: HTMLElement;
  cleanup: () => void;
  /** Restyles the wrapper in place; `eager` starts an embed that has not started. */
  update: (layout: FrameLayout, eager: boolean) => void;
};

const LENGTHS = /* @__PURE__ */ new Set([
  'width',
  'maxWidth',
  'height',
  'maxHeight',
  'minHeight',
  'borderRadius',
]);

/** Replaces the inline style with a style record. */
export function restyle(
  element: HTMLElement,
  style: Record<string, string | number | undefined>,
): void {
  element.removeAttribute('style');
  applyStyle(element, style);
}

/** Writes a style record; numbers get `px` for length properties. */
export function applyStyle(
  element: HTMLElement,
  style: Record<string, string | number | undefined>,
): void {
  for (const [name, value] of Object.entries(style)) {
    if (value === undefined) continue;
    const text =
      typeof value === 'number' && LENGTHS.has(name)
        ? `${String(value)}px`
        : String(value);
    element.style.setProperty(
      name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
      text,
    );
  }
}

/** The same element and inline styles as React's `<Skeleton>`. */
export function skeleton(minHeight?: number): HTMLElement {
  const element = document.createElement('div');
  element.setAttribute('aria-hidden', 'true');
  applyStyle(element, {
    width: '100%',
    height: '100%',
    minHeight,
    background: 'rgba(128, 128, 128, 0.12)',
  });
  return element;
}
