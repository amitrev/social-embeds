import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IframeEmbed,
  type MessageHeight,
} from '../../src/components/iframe-embed';
import {
  FakeResizeObserver,
  installObserver,
  installResizeObserver,
  lastObserver,
  lastResizeObserver,
} from './helpers';
import { srcWithSize, watchWidth } from '../../src/core/size-in-src';
import { listenForHeight } from '../../src/core/message-height';
import { withParent } from '../../src/core/plans/twitch';
const sizing = (src: string, size?: { width?: number; height?: number }) => ({
  watch: watchWidth,
  src: (width: number) =>
    srcWithSize({ src, ratio: { width: 4, height: 3 }, size }, width),
});

const ORIGIN = 'https://t.me';
const telegramHeight: MessageHeight = {
  origin: ORIGIN,
  read(data) {
    if (typeof data !== 'string') return undefined;
    const parsed = JSON.parse(data) as { event?: string; height?: number };
    return parsed.event === 'resize' ? parsed.height : undefined;
  },
  listen: listenForHeight,
};

function sizedFrame(props: Partial<Parameters<typeof IframeEmbed>[0]> = {}) {
  return (
    <IframeEmbed
      src="https://t.me/telegram/83?embed=1"
      title="Telegram post"
      allow=""
      ratio={{ width: 1, height: 1 }}
      messageHeight={telegramHeight}
      startHeight={300}
      lazy={false}
      {...props}
    />
  );
}

function renderSized(props: Partial<Parameters<typeof IframeEmbed>[0]> = {}) {
  const view = render(sizedFrame(props));
  const wrapper = view.container.firstElementChild as HTMLElement;
  const iframe = view.container.querySelector('iframe') as HTMLIFrameElement;
  return { ...view, wrapper, iframe };
}

function post(
  data: unknown,
  source: MessageEventSource | null,
  origin = ORIGIN,
) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
  });
}

const resize = (height: number) => JSON.stringify({ event: 'resize', height });

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('IframeEmbed sized by messages', () => {
  it('starts at the start height, with no aspect ratio', () => {
    const { wrapper, iframe } = renderSized({ maxWidth: 500 });
    expect(wrapper.style.aspectRatio).toBe('');
    expect(wrapper.style.height).toBe('300px');
    expect(wrapper.style.maxWidth).toBe('500px');
    expect(iframe.style.height).toBe('100%');
  });

  it('takes the height the frame reports, and keeps the placeholder until then', () => {
    const onLoad = vi.fn();
    const { wrapper, iframe, getByTestId } = renderSized({
      onLoad,
      placeholder: <p data-testid="placeholder" />,
    });

    fireEvent.load(iframe);
    expect(getByTestId('placeholder')).toBeTruthy();
    expect(onLoad).not.toHaveBeenCalled();

    post(resize(540), iframe.contentWindow);
    expect(wrapper.style.height).toBe('540px');
    expect(() => getByTestId('placeholder')).toThrow();
    expect(onLoad).toHaveBeenCalledTimes(1);

    post(resize(443), iframe.contentWindow);
    expect(wrapper.style.height).toBe('443px');
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['another origin', resize(540), 'https://evil.example', true],
    ['another window', resize(540), ORIGIN, false],
    ['a message the platform does not send', '{"event":"ready"}', ORIGIN, true],
    ['data that is not JSON', 'resize 540', ORIGIN, true],
    ['a zero height', resize(0), ORIGIN, true],
    ['an absurd height', resize(1e9), ORIGIN, true],
  ])('ignores %s', (_, data, origin, fromFrame) => {
    const { wrapper, iframe } = renderSized();
    post(data, fromFrame ? iframe.contentWindow : window, origin);
    expect(wrapper.style.height).toBe('300px');
  });

  it('stops listening on unmount', () => {
    const removed = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderSized();
    unmount();
    expect(removed).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('reports an error and shows the frame when no height arrives', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const { iframe, getByTestId } = renderSized({
      onError,
      placeholder: <p data-testid="placeholder" />,
    });
    fireEvent.load(iframe);
    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: Telegram post did not report its height'),
    );
    expect(() => getByTestId('placeholder')).toThrow();
  });

  // A frame posts its height only once painted, and an off-screen frame is not (docs/decisions.md D70).
  it('with lazy off, starts the height timeout only when the frame comes near', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    renderSized({ onError });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onError).not.toHaveBeenCalled();

    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: Telegram post did not report its height'),
    );
  });

  it('does not time out once a height has arrived', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const { iframe } = renderSized({ onError });
    post(resize(540), iframe.contentWindow);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('IframeEmbed sized by its aspect ratio', () => {
  function renderFrame(props: Partial<Parameters<typeof IframeEmbed>[0]> = {}) {
    const view = render(
      <IframeEmbed
        src="https://www.tiktok.com/player/v1/7704834703446117662"
        title="TikTok video"
        allow=""
        ratio={{ width: 9, height: 16 }}
        {...props}
      />,
    );
    const iframe = () =>
      view.container.querySelector('iframe') as HTMLIFrameElement;
    return { ...view, iframe };
  }

  it('reports an error and shows the frame when the iframe never loads', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const { getByTestId } = renderFrame({
      onError,
      placeholder: <p data-testid="placeholder" />,
    });
    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: TikTok video did not load'),
    );
    expect(() => getByTestId('placeholder')).toThrow();
  });

  it('does not time out once the iframe has loaded', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const onLoad = vi.fn();
    const { iframe } = renderFrame({ onError, onLoad });
    lastObserver().enter();
    fireEvent.load(iframe());
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onError).not.toHaveBeenCalled();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('still reports a load that arrives after the timeout', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const onLoad = vi.fn();
    const { iframe } = renderFrame({ onError, onLoad });
    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    fireEvent.load(iframe());
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('with lazy off, starts the load timeout only when the frame comes near', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    renderFrame({ onError, lazy: false });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onError).not.toHaveBeenCalled();

    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe('IframeEmbed with the page host in its src', () => {
  // Twitch plays only when `parent` names the embedding page (docs/decisions.md D62).
  it('adds the host as the named parameter when it creates the iframe', () => {
    const { container } = render(
      <IframeEmbed
        src="https://player.twitch.tv/?channel=twitch"
        title="Twitch"
        allow=""
        ratio={{ width: 16, height: 9 }}
        clientSrc={withParent}
        lazy={false}
      />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      `https://player.twitch.tv/?channel=twitch&parent=${window.location.hostname}`,
    );
  });

  it('starts the query when the src has none', () => {
    const { container } = render(
      <IframeEmbed
        src="https://clips.twitch.tv/embed"
        title="Twitch"
        allow=""
        ratio={{ width: 16, height: 9 }}
        clientSrc={withParent}
        lazy={false}
      />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      `https://clips.twitch.tv/embed?parent=${window.location.hostname}`,
    );
  });

  it('has no iframe in the server HTML, so the host is never needed there', async () => {
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      <IframeEmbed
        src="https://player.twitch.tv/?channel=twitch"
        title="Twitch"
        allow=""
        ratio={{ width: 16, height: 9 }}
        clientSrc={withParent}
      />,
    );
    expect(html).not.toContain('<iframe');
  });
});

describe('IframeEmbed with its size in the src', () => {
  const SRC = 'https://embedr.flickr.com/photos/1?header=true';

  function renderSizedSrc(
    props: Partial<Parameters<typeof IframeEmbed>[0]> = {},
  ) {
    const view = render(
      <IframeEmbed
        src={SRC}
        title="Flickr photo"
        allow=""
        ratio={{ width: 4, height: 3 }}
        sizeInSrc={sizing(props.src ?? SRC, props.size)}
        lazy={false}
        {...props}
      />,
    );
    const iframe = () => view.container.querySelector('iframe');
    return { ...view, iframe };
  }

  beforeEach(() => {
    installResizeObserver();
  });

  it('creates the iframe once the box has a width, sized from it and the ratio', () => {
    const { iframe } = renderSizedSrc();
    expect(iframe()).toBeNull();
    lastResizeObserver().resize(600);
    expect(iframe()?.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photos/1?width=600&height=450&header=true',
    );
  });

  it('uses the input size for the ratio', () => {
    const { iframe } = renderSizedSrc({ size: { width: 4096, height: 2301 } });
    lastResizeObserver().resize(375);
    expect(iframe()?.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photos/1?width=375&height=211&header=true',
    );
  });

  it('observes the box only once it is near', () => {
    const { iframe } = renderSizedSrc({ lazy: true });
    expect(FakeResizeObserver.instances).toHaveLength(0);
    lastObserver().enter();
    lastResizeObserver().resize(500);
    expect(iframe()?.getAttribute('src')).toContain('width=500&height=375');
  });

  it('rebuilds a new iframe once the width has settled, removing the old one', () => {
    vi.useFakeTimers();
    const { container, iframe } = renderSizedSrc();
    const observer = lastResizeObserver();
    observer.resize(600);
    const first = iframe();
    observer.resize(375);
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(iframe()).toBe(first);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(iframe()).not.toBe(first);
    expect(first?.isConnected).toBe(false);
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
    expect(iframe()?.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photos/1?width=375&height=281&header=true',
    );
  });

  it('rebuilds once, at the last width, after several changes within 200 ms', () => {
    vi.useFakeTimers();
    const { iframe } = renderSizedSrc();
    const observer = lastResizeObserver();
    observer.resize(600);
    const first = iframe();
    for (const width of [500, 450, 400]) {
      observer.resize(width);
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(iframe()).toBe(first);
    }
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const second = iframe();
    expect(second).not.toBe(first);
    expect(second?.getAttribute('src')).toContain('width=400&height=300');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(iframe()).toBe(second);
  });

  it('does not rebuild when the rounded width stays or comes back', () => {
    vi.useFakeTimers();
    const { iframe } = renderSizedSrc();
    const observer = lastResizeObserver();
    observer.resize(600);
    const first = iframe();
    observer.resize(600.4);
    observer.resize(500);
    observer.resize(600);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(iframe()).toBe(first);
  });

  it('does not rebuild after an unmount while a rebuild is pending', () => {
    vi.useFakeTimers();
    const { unmount } = renderSizedSrc();
    const observer = lastResizeObserver();
    observer.resize(600);
    observer.resize(400);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores a box without a width', () => {
    const { iframe } = renderSizedSrc();
    lastResizeObserver().resize(0);
    expect(iframe()).toBeNull();
  });

  it('keeps the placeholder until the frame loads, and not after a rebuild', () => {
    vi.useFakeTimers();
    const onLoad = vi.fn();
    const { iframe, getByTestId } = renderSizedSrc({
      onLoad,
      placeholder: <p data-testid="placeholder" />,
    });
    const observer = lastResizeObserver();
    observer.resize(600);
    expect(getByTestId('placeholder')).toBeTruthy();
    const first = iframe() as HTMLIFrameElement;
    fireEvent.load(first);
    expect(() => getByTestId('placeholder')).toThrow();
    observer.resize(400);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const second = iframe() as HTMLIFrameElement;
    expect(second).not.toBe(first);
    expect(() => getByTestId('placeholder')).toThrow();
    fireEvent.load(second);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('stops observing on unmount', () => {
    const { unmount } = renderSizedSrc();
    const observer = lastResizeObserver();
    expect(observer.targets).toHaveLength(1);
    unmount();
    expect(observer.targets).toHaveLength(0);
  });

  it('measures the box once without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 500.2,
    } as DOMRect);
    const { iframe } = renderSizedSrc();
    expect(iframe()?.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photos/1?width=500&height=375&header=true',
    );
  });

  it('still creates the frame for a width that arrives after the timeout', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const onLoad = vi.fn();
    const { iframe } = renderSizedSrc({ onError, onLoad });
    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(onError).toHaveBeenCalledTimes(1);
    lastResizeObserver().resize(600);
    expect(iframe()?.getAttribute('src')).toContain('width=600&height=450');
    fireEvent.load(iframe() as HTMLIFrameElement);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('times out as a frame that did not load when the box never has a width', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    renderSizedSrc({ onError });
    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: Flickr photo did not load'),
    );
  });
});

describe('IframeEmbed with a new src', () => {
  const FIRST = 'https://www.tiktok.com/player/v1/7704834703446117662';
  const SECOND = 'https://www.tiktok.com/player/v1/7704834703446117663';

  function frame(props: Partial<Parameters<typeof IframeEmbed>[0]> = {}) {
    return (
      <IframeEmbed
        src={FIRST}
        title="TikTok video"
        allow=""
        ratio={{ width: 9, height: 16 }}
        lazy={false}
        placeholder={<p data-testid="placeholder" />}
        {...props}
      />
    );
  }

  function renderFrame(props: Partial<Parameters<typeof IframeEmbed>[0]> = {}) {
    const view = render(frame(props));
    const iframe = () =>
      view.container.querySelector('iframe') as HTMLIFrameElement;
    const wrapper = () => view.container.firstElementChild as HTMLElement;
    return { ...view, iframe, wrapper };
  }

  it('starts over with a new iframe, the placeholder and a new onLoad', () => {
    const onLoad = vi.fn();
    const { iframe, rerender, getByTestId } = renderFrame({ onLoad });
    const first = iframe();
    fireEvent.load(first);
    expect(onLoad).toHaveBeenCalledTimes(1);

    rerender(frame({ onLoad, src: SECOND }));
    const second = iframe();
    expect(second).not.toBe(first);
    expect(first.isConnected).toBe(false);
    expect(second.getAttribute('src')).toBe(SECOND);
    expect(getByTestId('placeholder')).toBeTruthy();

    fireEvent.load(second);
    expect(onLoad).toHaveBeenCalledTimes(2);
    expect(() => getByTestId('placeholder')).toThrow();
  });

  it('restarts the timeout for the new src after the old frame loaded', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const { iframe, rerender } = renderFrame({ onError });
    lastObserver().enter();
    fireEvent.load(iframe());

    rerender(frame({ onError, src: SECOND }));
    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(14_999);
    });
    expect(onError).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: TikTok video did not load'),
    );
  });

  it('drops the old frame’s pending timeout', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const { rerender } = renderFrame({ onError });
    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    rerender(frame({ onError, src: SECOND }));
    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(14_999);
    });
    expect(onError).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('goes back to the start height for a frame sized by messages', () => {
    const onLoad = vi.fn();
    const { container, wrapper, iframe, rerender } = renderSized({ onLoad });
    post(resize(900), iframe.contentWindow);
    expect(wrapper.style.height).toBe('900px');

    rerender(sizedFrame({ onLoad, src: 'https://t.me/telegram/84?embed=1' }));
    const box = container.firstElementChild as HTMLElement;
    const second = container.querySelector('iframe') as HTMLIFrameElement;
    expect(second).not.toBe(iframe);
    expect(box.style.height).toBe('300px');

    post(resize(540), second.contentWindow);
    expect(box.style.height).toBe('540px');
    expect(onLoad).toHaveBeenCalledTimes(2);
  });

  it('starts over for a new src with its size in the src', () => {
    installResizeObserver(600);
    const onLoad = vi.fn();
    const sized = (src: string) => (
      <IframeEmbed
        src={src}
        title="Flickr photo"
        allow=""
        ratio={{ width: 4, height: 3 }}
        sizeInSrc={sizing(src)}
        lazy={false}
        onLoad={onLoad}
        placeholder={<p data-testid="placeholder" />}
      />
    );
    const { container, rerender, getByTestId } = render(
      sized('https://embedr.flickr.com/photos/1'),
    );
    const first = container.querySelector('iframe') as HTMLIFrameElement;
    fireEvent.load(first);

    rerender(sized('https://embedr.flickr.com/photos/2'));
    const second = container.querySelector('iframe') as HTMLIFrameElement;
    expect(second).not.toBe(first);
    expect(second.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photos/2?width=600&height=450',
    );
    expect(getByTestId('placeholder')).toBeTruthy();
    fireEvent.load(second);
    expect(onLoad).toHaveBeenCalledTimes(2);
  });

  it('keeps the loaded frame when only the layout props change', () => {
    const onLoad = vi.fn();
    const { iframe, wrapper, rerender, getByTestId } = renderFrame({ onLoad });
    const first = iframe();
    const box = wrapper();
    fireEvent.load(first);

    rerender(
      frame({
        onLoad,
        maxWidth: 300,
        className: 'wide',
        style: { margin: 4 },
      }),
    );
    expect(iframe()).toBe(first);
    expect(wrapper()).toBe(box);
    expect(box.style.maxWidth).toBe('300px');
    expect(box.className).toBe('wide');
    expect(() => getByTestId('placeholder')).toThrow();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});
