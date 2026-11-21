import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IframePlan } from '../../src/core/plan';
import { FRAME_TIMEOUT_MS, MAX_REPORTED_HEIGHT } from '../../src/core/timing';
import { mountIframe } from '../../src/element/mount-iframe';
import { installObserver, lastObserver } from '../components/helpers';

const ORIGIN = 'https://t.me';
const base: IframePlan = {
  kind: 'iframe',
  src: 'https://example.com/embed?x=1',
  title: 'Example post',
  allow: 'fullscreen',
  ratio: { width: 16, height: 9 },
};
const sized: IframePlan = {
  ...base,
  title: 'Telegram post',
  messageHeight: {
    origin: ORIGIN,
    read(data) {
      if (typeof data !== 'string') return undefined;
      const parsed = JSON.parse(data) as { event?: string; height?: number };
      return parsed.event === 'resize' ? parsed.height : undefined;
    },
  },
  startHeight: 300,
};

let host: HTMLElement;
let onLoad: ReturnType<typeof vi.fn>;
let onError: ReturnType<typeof vi.fn>;

function mount(plan: IframePlan, eager = false, placeholder: Node[] = []) {
  const cleanup = mountIframe(host, plan, {
    eager,
    placeholder,
    onLoad: onLoad as () => void,
    onError: onError as (error: Error) => void,
  });
  return {
    cleanup,
    wrapper: host.firstElementChild as HTMLElement,
    iframe: () => host.querySelector('iframe'),
  };
}

function post(data: unknown, source: unknown, origin = ORIGIN) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data,
      origin,
      source: source as MessageEventSource,
    }),
  );
}

const resize = (height: number) => JSON.stringify({ event: 'resize', height });

beforeEach(() => {
  installObserver();
  host = document.createElement('div');
  document.body.append(host);
  onLoad = vi.fn();
  onError = vi.fn();
});

afterEach(() => {
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('mountIframe', () => {
  it('creates the iframe only once near', () => {
    const { iframe } = mount({
      ...base,
      referrerPolicy: 'strict-origin-when-cross-origin',
      scrolling: 'no',
      sandbox: 'allow-scripts',
    });
    expect(iframe()).toBeNull();
    lastObserver().enter();
    const frame = iframe() as HTMLIFrameElement;
    expect(frame.getAttribute('src')).toBe(base.src);
    expect(frame.title).toBe('Example post');
    expect(frame.getAttribute('allow')).toBe('fullscreen');
    expect(frame.hasAttribute('allowfullscreen')).toBe(true);
    expect(frame.getAttribute('referrerpolicy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(frame.getAttribute('scrolling')).toBe('no');
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
    expect(frame.style.border).toMatch(/^0/);
    expect(frame.style.display).toBe('block');
  });

  it('sizes the wrapper like React', () => {
    const { wrapper } = mount({ ...base, borderRadius: 12 });
    expect(wrapper.style.position).toBe('relative');
    expect(wrapper.style.width).toBe('100%');
    expect(wrapper.style.aspectRatio.replace(/\s/g, '')).toBe('16/9');
    expect(wrapper.style.borderRadius).toBe('12px');
    expect(wrapper.style.overflow).toBe('hidden');
  });

  it('creates the iframe at once when eager', () => {
    const { iframe } = mount(base, true);
    expect(iframe()).not.toBeNull();
  });

  it('removes the placeholder and loads once', () => {
    const marker = document.createElement('span');
    const { iframe } = mount(base, true, [marker]);
    expect(host.contains(marker)).toBe(true);
    iframe()?.dispatchEvent(new Event('load'));
    iframe()?.dispatchEvent(new Event('load'));
    expect(host.contains(marker)).toBe(false);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('shows a skeleton, or the fallback in a blockquote', () => {
    mount(base, true);
    expect(host.querySelector('[aria-hidden="true"]')).not.toBeNull();
    host.replaceChildren();
    mount({ ...base, fallbackHtml: '<p>hi</p>' }, true);
    expect(host.querySelector('blockquote p')?.textContent).toBe('hi');
  });

  it('appends the host param', () => {
    const a = mount(
      { ...base, src: 'https://a.test/e', hostParam: 'parent' },
      true,
    );
    expect(a.iframe()?.getAttribute('src')).toBe(
      'https://a.test/e?parent=localhost',
    );
    host.replaceChildren();
    const b = mount({ ...base, hostParam: 'parent' }, true);
    expect(b.iframe()?.getAttribute('src')).toBe(
      `${base.src}&parent=localhost`,
    );
  });

  describe('without messageHeight', () => {
    it('errors when the iframe does not load in time', () => {
      vi.useFakeTimers();
      const marker = document.createElement('span');
      mount(base, false, [marker]);
      lastObserver().enter();
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
      expect(onError).toHaveBeenCalledWith(
        new Error('social-embeds: Example post did not load'),
      );
      expect(host.contains(marker)).toBe(false);
    });

    it('starts the timer only after near, even when eager', () => {
      vi.useFakeTimers();
      mount(base, true);
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS * 2);
      expect(onError).not.toHaveBeenCalled();
      lastObserver().enter();
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('stays quiet after the iframe loaded', () => {
      vi.useFakeTimers();
      const { iframe } = mount(base, true);
      lastObserver().enter();
      iframe()?.dispatchEvent(new Event('load'));
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
      expect(onError).not.toHaveBeenCalled();
      expect(onLoad).toHaveBeenCalledTimes(1);
    });

    it('still reports a load that arrives after the timeout', () => {
      vi.useFakeTimers();
      const { iframe } = mount(base, true);
      lastObserver().enter();
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
      iframe()?.dispatchEvent(new Event('load'));
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onLoad).toHaveBeenCalledTimes(1);
    });

    it('cleanup clears the timer', () => {
      vi.useFakeTimers();
      const { cleanup } = mount(base, true);
      lastObserver().enter();
      cleanup();
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('messageHeight', () => {
    it('starts at the start height and ignores load events', () => {
      const { wrapper, iframe } = mount(sized, true);
      expect(wrapper.style.height).toBe('300px');
      iframe()?.dispatchEvent(new Event('load'));
      expect(onLoad).not.toHaveBeenCalled();
    });

    it('takes a valid height from the frame', () => {
      const marker = document.createElement('span');
      const { wrapper, iframe } = mount(sized, true, [marker]);
      post(resize(512.2), iframe()?.contentWindow);
      expect(wrapper.style.height).toBe('513px');
      expect(onLoad).toHaveBeenCalledTimes(1);
      expect(host.contains(marker)).toBe(false);
    });

    it('ignores other origins, other windows, bad heights and throwing reads', () => {
      const { wrapper, iframe } = mount(sized, true);
      const source = iframe()?.contentWindow;
      post(resize(400), source, 'https://evil.test');
      post(resize(400), window);
      post(resize(0), source);
      post(resize(MAX_REPORTED_HEIGHT + 1), source);
      post('not json', source);
      expect(wrapper.style.height).toBe('300px');
      expect(onLoad).not.toHaveBeenCalled();
    });

    it('errors when no height arrives in time', () => {
      vi.useFakeTimers();
      const marker = document.createElement('span');
      mount(sized, false, [marker]);
      lastObserver().enter();
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
      expect(onError).toHaveBeenCalledWith(
        new Error('social-embeds: Telegram post did not report its height'),
      );
      expect(host.contains(marker)).toBe(false);
    });

    it('starts the timer only after near, even when eager', () => {
      vi.useFakeTimers();
      mount(sized, true);
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS * 2);
      expect(onError).not.toHaveBeenCalled();
      lastObserver().enter();
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('stays quiet after a height arrived', () => {
      vi.useFakeTimers();
      const { iframe } = mount(sized, true);
      lastObserver().enter();
      post(resize(400), iframe()?.contentWindow);
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
      expect(onError).not.toHaveBeenCalled();
    });

    it('cleanup stops listening and clears the timer', () => {
      vi.useFakeTimers();
      const { cleanup, wrapper, iframe } = mount(sized, true);
      lastObserver().enter();
      const source = iframe()?.contentWindow;
      cleanup();
      post(resize(400), source);
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
      expect(wrapper.style.height).toBe('300px');
      expect(onError).not.toHaveBeenCalled();
      expect(host.children).toHaveLength(0);
    });
  });
});
