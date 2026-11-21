import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IframePlan } from '../../src/core/plan';
import { frameStyle, srcWithSize, watchWidth } from '../../src/core/layout';

const plan = (extra: Partial<IframePlan> = {}): IframePlan => ({
  kind: 'iframe',
  src: 'https://example.com/embed',
  title: 'Example',
  allow: '',
  ratio: { width: 16, height: 9 },
  ...extra,
});

const message = {
  origin: 'https://example.com',
  read: () => undefined,
};

describe('frameStyle', () => {
  it('uses the plan height as a fixed height, which the layout replaces', () => {
    expect(frameStyle(plan({ height: 670 }), {})).toEqual({
      position: 'relative',
      width: '100%',
      maxWidth: undefined,
      height: 670,
      maxHeight: undefined,
    });
    expect(frameStyle(plan({ height: 670 }), { height: 400 })).toMatchObject({
      height: 400,
    });
  });

  it('rounds the corners and clips only when the plan has a radius', () => {
    expect(frameStyle(plan({ borderRadius: 12 }), {})).toMatchObject({
      borderRadius: 12,
      overflow: 'hidden',
    });
    const plain = frameStyle(plan(), {});
    expect(plain).not.toHaveProperty('borderRadius');
    expect(plain).not.toHaveProperty('overflow');
  });

  it('puts the radius last, where the components’ style once put it', () => {
    expect(
      Object.keys(frameStyle(plan({ borderRadius: 12, height: 152 }), {})),
    ).toEqual([
      'position',
      'width',
      'maxWidth',
      'height',
      'maxHeight',
      'borderRadius',
      'overflow',
    ]);
  });

  it('uses the ratio and full width by default', () => {
    expect(frameStyle(plan(), {})).toEqual({
      position: 'relative',
      width: '100%',
      maxWidth: undefined,
      aspectRatio: '16 / 9',
    });
  });

  it('lets the input size override the ratio', () => {
    expect(frameStyle(plan({ size: { width: 560, height: 315 } }), {})).toEqual(
      {
        position: 'relative',
        width: '100%',
        maxWidth: undefined,
        aspectRatio: '560 / 315',
      },
    );
  });

  it('uses a fixed height instead of the ratio', () => {
    const style = frameStyle(plan(), { height: 400, maxHeight: 600 });
    expect(style).toMatchObject({ height: 400, maxHeight: 600 });
    expect(style).not.toHaveProperty('aspectRatio');
  });

  it('turns maxHeight into a width limit', () => {
    expect(frameStyle(plan(), { maxHeight: 360 })).toMatchObject({
      maxWidth: 640,
    });
    expect(frameStyle(plan(), { maxHeight: 360, maxWidth: 500 })).toMatchObject(
      { maxWidth: 500 },
    );
  });

  it('sizes from messages', () => {
    const messaged = plan({ messageHeight: message, startHeight: 300 });
    expect(frameStyle(messaged, {})).toMatchObject({ height: 300 });
    expect(frameStyle(messaged, {}, 812)).toMatchObject({ height: 812 });
  });

  it('takes maxWidth from the plan unless the layout sets one', () => {
    expect(frameStyle(plan({ maxWidth: 325 }), {})).toMatchObject({
      maxWidth: 325,
    });
    expect(
      frameStyle(plan({ maxWidth: 325 }), { maxWidth: 400 }),
    ).toMatchObject({ maxWidth: 400 });
  });
});

describe('srcWithSize', () => {
  it('puts the width and the height from the ratio first in the query', () => {
    const flickr = plan({
      src: 'https://embedr.flickr.com/photos/1?header=true',
      ratio: { width: 4, height: 3 },
    });
    expect(srcWithSize(flickr, 600)).toBe(
      'https://embedr.flickr.com/photos/1?width=600&height=450&header=true',
    );
  });

  it('starts the query when the src has none', () => {
    expect(srcWithSize(plan({ ratio: { width: 4, height: 3 } }), 400)).toBe(
      'https://example.com/embed?width=400&height=300',
    );
  });

  it('takes the ratio from the input size and rounds the height', () => {
    expect(
      srcWithSize(plan({ size: { width: 4096, height: 2301 } }), 375),
    ).toBe('https://example.com/embed?width=375&height=211');
  });
});

describe('watchWidth', () => {
  class StubResizeObserver {
    static last: StubResizeObserver | undefined;
    observing = false;

    constructor(
      private readonly callback: (
        entries: { contentRect: { width: number } }[],
      ) => void,
    ) {
      StubResizeObserver.last = this;
    }

    observe() {
      this.observing = true;
    }

    disconnect() {
      this.observing = false;
    }

    resize(width: number) {
      this.callback([{ contentRect: { width } }]);
    }
  }

  const element = {} as Element;

  function watch() {
    const onWidth = vi.fn();
    const stop = watchWidth(element, onWidth);
    const observer = StubResizeObserver.last;
    if (!observer) throw new Error('no ResizeObserver was created');
    return { onWidth, stop, observer };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('ResizeObserver', StubResizeObserver);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reports the first rounded width at once, ignoring a zero width', () => {
    const { onWidth, observer } = watch();
    expect(observer.observing).toBe(true);
    observer.resize(0);
    expect(onWidth).not.toHaveBeenCalled();
    observer.resize(599.6);
    expect(onWidth).toHaveBeenCalledWith(600);
  });

  it('reports a later width once it has been stable for 200 ms', () => {
    const { onWidth, observer } = watch();
    observer.resize(600);
    observer.resize(375);
    vi.advanceTimersByTime(199);
    expect(onWidth).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(onWidth).toHaveBeenLastCalledWith(375);
    expect(onWidth).toHaveBeenCalledTimes(2);
  });

  it('reports only the last of several widths within 200 ms', () => {
    const { onWidth, observer } = watch();
    observer.resize(600);
    for (const width of [500, 450, 400]) {
      observer.resize(width);
      vi.advanceTimersByTime(150);
    }
    vi.advanceTimersByTime(50);
    expect(onWidth.mock.calls).toEqual([[600], [400]]);
  });

  it('reports nothing when the rounded width stays or comes back', () => {
    const { onWidth, observer } = watch();
    observer.resize(600);
    observer.resize(600.4);
    observer.resize(500);
    observer.resize(0);
    observer.resize(600);
    vi.advanceTimersByTime(1000);
    expect(onWidth).toHaveBeenCalledTimes(1);
  });

  it('stops observing and drops a pending width on cleanup', () => {
    const { onWidth, observer, stop } = watch();
    observer.resize(600);
    observer.resize(400);
    stop();
    vi.advanceTimersByTime(1000);
    expect(observer.observing).toBe(false);
    expect(onWidth).toHaveBeenCalledTimes(1);
  });

  it('measures once without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const onWidth = vi.fn();
    watchWidth(
      { getBoundingClientRect: () => ({ width: 500.2 }) } as Element,
      onWidth,
    );
    expect(onWidth).toHaveBeenCalledWith(500);
  });
});
