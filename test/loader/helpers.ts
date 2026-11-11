import { vi } from 'vitest';

/** The tags are captured, never attached: each test decides when a script loads or fails. */
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

export function resetPage(): void {
  for (const name of ['twttr', 'instgrm', 'FB', 'fbAsyncInit'])
    Reflect.deleteProperty(window, name);
  document.head.replaceChildren();
  document.body.replaceChildren();
}
