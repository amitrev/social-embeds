import type { MessageHeight } from './plan';
import { MAX_REPORTED_HEIGHT } from './timing';

// Only the plans of frames that post their height import this (docs/decisions.md D115).

/** `MessageHeight.listen`: the heights the frame itself posts, from the platform's origin only. */
export function listenForHeight(
  this: MessageHeight,
  frame: () => HTMLIFrameElement | null | undefined,
  onHeight: (height: number) => void,
): () => void {
  const { origin, read } = this;
  const listen = (event: MessageEvent) => {
    // Security: only the frame itself, from the platform's own origin.
    if (event.origin !== origin) return;
    const element = frame();
    if (!element || event.source !== element.contentWindow) return;
    let value: number | undefined;
    try {
      value = read(event.data);
    } catch {
      return;
    }
    if (
      typeof value !== 'number' ||
      !(value > 0 && value <= MAX_REPORTED_HEIGHT)
    )
      return;
    onHeight(Math.ceil(value));
  };
  window.addEventListener('message', listen);
  return () => {
    window.removeEventListener('message', listen);
  };
}
