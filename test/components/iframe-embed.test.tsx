import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IframeEmbed,
  type MessageHeight,
} from '../../src/components/iframe-embed';
import { installObserver } from './helpers';

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
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: Telegram post did not report its height'),
    );
    expect(() => getByTestId('placeholder')).toThrow();
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
