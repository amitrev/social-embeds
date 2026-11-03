import { vi } from 'vitest';

/**
 * Captures the script tags the loader adds instead of attaching them, so each test
 * decides when a script loads or fails.
 */
export function captureScripts(): HTMLScriptElement[] {
  const added: HTMLScriptElement[] = [];
  const head = document.head;
  const append = head.appendChild.bind(head);
  vi.spyOn(head, 'appendChild').mockImplementation(
    <T extends Node>(node: T) => {
      if (node instanceof HTMLScriptElement) {
        added.push(node);
        return node;
      }
      return append(node);
    },
  );
  return added;
}

/** Adds a script tag the way a host page would, before any embed mounts. */
export function addHostScript(src: string): void {
  const element = document.createElement('script');
  element.src = src;
  document.body.append(element);
}

export function fire(
  element: HTMLScriptElement | undefined,
  type: 'load' | 'error',
) {
  if (!element) throw new Error('no script was added');
  element.dispatchEvent(new Event(type));
}

/** Deletes the platform globals and scripts a test may have left behind. */
export function resetPage(): void {
  for (const name of ['twttr', 'instgrm', 'FB', 'fbAsyncInit'])
    Reflect.deleteProperty(window, name);
  document.head.replaceChildren();
  document.body.replaceChildren();
}
