import { vi } from 'vitest';
import type * as platformScripts from '../../src/loader/platform-scripts';

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

export function addHostScript(src: string): HTMLScriptElement {
  const element = document.createElement('script');
  element.src = src;
  document.body.append(element);
  return element;
}

export function fire(
  element: HTMLScriptElement | undefined,
  type: 'load' | 'error',
) {
  if (!element) throw new Error('no script was added');
  element.dispatchEvent(new Event(type));
}

export function resetPage(): void {
  for (const name of ['twttr', 'instgrm', 'FB', 'fbAsyncInit', 'PinUtils'])
    Reflect.deleteProperty(window, name);
  document.head.replaceChildren();
  document.body.replaceChildren();
}

export type LoadPlatformScript = (
  platform: 'x' | 'instagram' | 'threads' | 'pinterest' | 'facebook',
  options?: { locale: string },
) => Promise<void>;

/** A `vi.mock` factory result: every platform's loader reports to `load`. */
export function mockPlatformScripts(
  load: LoadPlatformScript,
): typeof platformScripts {
  return {
    FACEBOOK_SDK_VERSION: 'v26.0',
    loadX: () => load('x'),
    loadInstagram: () => load('instagram'),
    loadThreads: () => load('threads'),
    loadPinterest: () => load('pinterest'),
    loadFacebook: (locale) => load('facebook', { locale }),
  };
}
