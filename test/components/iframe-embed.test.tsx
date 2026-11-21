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

const ORIGIN = 'https://t.me';
const telegramHeight: MessageHeight = {
  origin: ORIGIN,
  read(data) {
    if (typeof data !== 'string') return undefined;
    const parsed = JSON.parse(data) as { event?: string; height?: number };
    return parsed.event === 'resize' ? parsed.height : undefined;
  },
};

function renderSized(props: Partial<Parameters<typeof IframeEmbed>[0]> = {}) {
  const view = render(
    <IframeEmbed
      src="https://t.me/telegram/83?embed=1"
      title="Telegram post"
      allow=""
      ratio={{ width: 1, height: 1 }}
      messageHeight={telegramHeight}
      startHeight={300}
      lazy={false}
      {...props}
    />,
  );
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
        hostParam="parent"
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
        hostParam="parent"
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
        hostParam="parent"
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
        sizeInSrc
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

  it('rebuilds the src in the same iframe when the rounded width changes, and only then', () => {
    const { iframe } = renderSizedSrc();
    const observer = lastResizeObserver();
    observer.resize(600);
    const first = iframe();
    const setAttribute = vi.spyOn(first as HTMLIFrameElement, 'setAttribute');
    observer.resize(600.4);
    expect(setAttribute).not.toHaveBeenCalled();
    observer.resize(375);
    expect(iframe()).toBe(first);
    expect(setAttribute).toHaveBeenCalledTimes(1);
    expect(first?.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photos/1?width=375&height=281&header=true',
    );
  });

  it('ignores a box without a width', () => {
    const { iframe } = renderSizedSrc();
    lastResizeObserver().resize(0);
    expect(iframe()).toBeNull();
  });

  it('keeps the placeholder until the frame loads, and not after a rebuild', () => {
    const onLoad = vi.fn();
    const { iframe, getByTestId } = renderSizedSrc({
      onLoad,
      placeholder: <p data-testid="placeholder" />,
    });
    const observer = lastResizeObserver();
    observer.resize(600);
    expect(getByTestId('placeholder')).toBeTruthy();
    fireEvent.load(iframe() as HTMLIFrameElement);
    expect(() => getByTestId('placeholder')).toThrow();
    observer.resize(400);
    fireEvent.load(iframe() as HTMLIFrameElement);
    expect(() => getByTestId('placeholder')).toThrow();
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
