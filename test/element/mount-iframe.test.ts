import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IframePlan } from '../../src/core/plan';
import { planEmbed } from '../../src/core/plan-embed';
import { FRAME_TIMEOUT_MS, MAX_REPORTED_HEIGHT } from '../../src/core/timing';
import { mountIframe } from '../../src/element/mount-iframe';
import { parseEmbed } from '../../src/parser';
import {
  installObserver,
  installResizeObserver,
  lastObserver,
  lastResizeObserver,
} from '../components/helpers';
import flickrDialog from '../fixtures/flickr/embed-dialog.html?raw';
import imgurAlbum from '../fixtures/imgur/embed-dialog-album.html?raw';
import stravaRoute from '../fixtures/strava/route-derived.html?raw';
import truthText from '../fixtures/truthsocial/oembed-text.html?raw';
import truthVideo from '../fixtures/truthsocial/embed-dialog-video.html?raw';

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
  vi.restoreAllMocks();
});

function planOf(html: string): IframePlan {
  const embed = parseEmbed(html);
  const plan = embed ? planEmbed(embed) : null;
  if (plan?.kind !== 'iframe') throw new Error('fixture did not plan a frame');
  return plan;
}

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

  describe('sizeInSrc', () => {
    const flickr: IframePlan = {
      ...base,
      src: 'https://embedr.flickr.com/photos/1?header=true',
      title: 'Flickr photo',
      ratio: { width: 4, height: 3 },
      sizeInSrc: true,
    };

    beforeEach(() => {
      installResizeObserver();
    });

    it('creates the iframe once the box has a width, sized from it and the ratio', () => {
      const { iframe } = mount(flickr, true);
      expect(iframe()).toBeNull();
      lastResizeObserver().resize(600);
      expect(iframe()?.getAttribute('src')).toBe(
        'https://embedr.flickr.com/photos/1?width=600&height=450&header=true',
      );
    });

    it('uses the input size for the ratio', () => {
      const { iframe } = mount(
        { ...flickr, size: { width: 4096, height: 2301 } },
        true,
      );
      lastResizeObserver().resize(375);
      expect(iframe()?.getAttribute('src')).toBe(
        'https://embedr.flickr.com/photos/1?width=375&height=211&header=true',
      );
    });

    it('observes the box only once it is near, unless eager', () => {
      const { iframe } = mount(flickr);
      lastObserver().enter();
      lastResizeObserver().resize(500);
      expect(iframe()?.getAttribute('src')).toContain('width=500&height=375');
    });

    it('rebuilds the src in the same iframe when the rounded width changes, and only then', () => {
      const { iframe } = mount(flickr, true);
      const observer = lastResizeObserver();
      observer.resize(600);
      const first = iframe() as HTMLIFrameElement;
      const setSrc = vi.spyOn(first, 'src', 'set');
      observer.resize(600.4);
      expect(setSrc).not.toHaveBeenCalled();
      observer.resize(375);
      expect(iframe()).toBe(first);
      expect(setSrc).toHaveBeenCalledTimes(1);
      expect(first.getAttribute('src')).toBe(
        'https://embedr.flickr.com/photos/1?width=375&height=281&header=true',
      );
    });

    it('ignores a box without a width', () => {
      const { iframe } = mount(flickr, true);
      lastResizeObserver().resize(0);
      expect(iframe()).toBeNull();
    });

    it('keeps the placeholder until the frame loads, and not after a rebuild', () => {
      const marker = document.createElement('span');
      const { iframe } = mount(flickr, true, [marker]);
      const observer = lastResizeObserver();
      observer.resize(600);
      expect(host.contains(marker)).toBe(true);
      iframe()?.dispatchEvent(new Event('load'));
      expect(host.contains(marker)).toBe(false);
      observer.resize(400);
      iframe()?.dispatchEvent(new Event('load'));
      expect(onLoad).toHaveBeenCalledTimes(1);
    });

    it('cleanup stops observing', () => {
      const { cleanup } = mount(flickr, true);
      const observer = lastResizeObserver();
      expect(observer.targets).toHaveLength(1);
      cleanup();
      expect(observer.targets).toHaveLength(0);
    });

    it('measures the box once without ResizeObserver', () => {
      vi.stubGlobal('ResizeObserver', undefined);
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        width: 500.2,
      } as DOMRect);
      const { iframe } = mount(flickr, true);
      expect(iframe()?.getAttribute('src')).toBe(
        'https://embedr.flickr.com/photos/1?width=500&height=375&header=true',
      );
    });

    it('errors as a frame that did not load when the box never has a width', () => {
      vi.useFakeTimers();
      mount(flickr, true);
      lastObserver().enter();
      vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
      expect(onError).toHaveBeenCalledWith(
        new Error('social-embeds: Flickr photo did not load'),
      );
    });
  });

  describe('Flickr embed code', () => {
    it('shows the linked image filling the box until the frame loads', () => {
      installResizeObserver();
      const { iframe } = mount(planOf(flickrDialog), true);
      const image = host.querySelector('a > img');
      expect(image?.getAttribute('src')).toBe(
        'https://live.staticflickr.com/65535/55618331478_aa284e58b6_4k.jpg',
      );
      expect((image as HTMLElement).style.width).toBe('100%');
      expect((image as HTMLElement).style.height).toBe('100%');
      expect(host.querySelector('blockquote')).toBeNull();
      lastResizeObserver().resize(800);
      expect(iframe()?.getAttribute('src')).toBe(
        'https://embedr.flickr.com/photos/55618331478?width=800&height=449',
      );
      iframe()?.dispatchEvent(new Event('load'));
      expect(host.querySelector('img')).toBeNull();
    });
  });

  describe.each([
    {
      name: 'Truth Social',
      html: truthText,
      origin: 'https://truthsocial.com',
      data: { type: 'setHeight', id: undefined, height: 221 },
      expected: '221px',
    },
    {
      name: 'a Truth Social video',
      html: truthVideo,
      origin: 'https://truthsocial.com',
      data: { type: 'setHeight', id: undefined, height: 530 },
      expected: '695px',
    },
    {
      name: 'Imgur',
      html: imgurAlbum,
      origin: 'https://imgur.com',
      data: '{"message":"resize_imgur","href":"https://imgur.com/a/04b1CmA/embed?pub=true","height":415,"width":360,"context":true}',
      expected: '415px',
    },
    {
      name: 'Strava',
      html: stravaRoute,
      origin: 'https://strava-embeds.com',
      data: ['social-embeds', 'BROADCAST_IFRAME_HEIGHT', 571],
      expected: '571px',
    },
  ])('$name height messages', ({ html, origin, data, expected }) => {
    it('take the height from the frame at its origin', () => {
      const { wrapper, iframe } = mount(planOf(html), true);
      post(data, iframe()?.contentWindow, origin);
      expect(wrapper.style.height).toBe(expected);
      expect(onLoad).toHaveBeenCalledTimes(1);
    });

    it('ignore another origin and another window', () => {
      const { wrapper, iframe } = mount(planOf(html), true);
      const start = wrapper.style.height;
      post(data, iframe()?.contentWindow, 'https://evil.test');
      post(data, window, origin);
      expect(wrapper.style.height).toBe(start);
      expect(onLoad).not.toHaveBeenCalled();
    });
  });
});
