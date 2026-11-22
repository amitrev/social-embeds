import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Driver, FinalError } from '../../src/core/drivers';
import type { ScriptPlan } from '../../src/core/plan';
import {
  RENDER_ATTEMPTS,
  RENDER_TIMEOUT_MS,
  RETRY_DELAY_MS,
} from '../../src/core/timing';
import { mountScript } from '../../src/element/mount-script';
import { installObserver, lastObserver } from '../components/helpers';

let host: HTMLElement;
let onLoad: ReturnType<typeof vi.fn>;
let onError: ReturnType<typeof vi.fn>;

function plan(driver: Driver, extra: Partial<ScriptPlan> = {}): ScriptPlan {
  return {
    kind: 'script',
    key: 'k',
    markup: '<blockquote id="m">post</blockquote>',
    driver,
    minHeight: 240,
    label: 'X',
    hasFallback: false,
    ...extra,
  };
}

function mount(p: ScriptPlan, placeholder: Node[] = []) {
  const { wrapper, cleanup, update } = mountScript(host, p, {
    eager: false,
    placeholder,
    onLoad: onLoad as () => void,
    onError: onError as (error: Error) => void,
  });
  expect(host.lastElementChild).toBe(wrapper);
  return { cleanup, update, wrapper };
}

const skeletonOf = () => host.querySelector('[aria-hidden="true"]');
const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  installObserver();
  vi.useFakeTimers();
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

describe('mountScript', () => {
  it('puts markup in the container and waits for near to load', () => {
    const load = vi.fn(() => Promise.resolve());
    const { wrapper } = mount(
      plan({ load, render: vi.fn(() => () => {}) }, { maxWidth: 550 }),
    );
    expect(host.querySelector('#m')?.textContent).toBe('post');
    expect(wrapper.style.width).toBe('100%');
    expect(wrapper.style.maxWidth).toBe('550px');
    expect(wrapper.children).toHaveLength(1);
    const box = wrapper.firstElementChild as HTMLElement;
    expect(box.style.width).toBe('100%');
    expect(box.children[0]?.querySelector('#m')).not.toBeNull();
    expect(box.children[1]).toBe(skeletonOf());
    expect((skeletonOf() as HTMLElement).style.minHeight).toBe('240px');
    expect(load).not.toHaveBeenCalled();
    lastObserver().enter();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('removes the skeleton and loads once when render signals', async () => {
    const render = vi.fn((_: HTMLElement, done: () => void) => {
      done();
      done();
      return () => {};
    });
    mount(plan({ load: () => Promise.resolve(), render }));
    lastObserver().enter();
    await flush();
    expect(skeletonOf()).toBeNull();
    expect(onLoad).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT_MS * 2);
    expect(onError).not.toHaveBeenCalled();
  });

  it('removes a host placeholder on render', async () => {
    const marker = document.createElement('span');
    mount(
      plan({
        load: () => Promise.resolve(),
        render: (_, done) => {
          done();
          return () => {};
        },
      }),
      [marker],
    );
    expect(host.contains(marker)).toBe(true);
    expect(skeletonOf()).toBeNull();
    lastObserver().enter();
    await flush();
    expect(host.contains(marker)).toBe(false);
  });

  it('retries a throwing render with doubling delays', async () => {
    let calls = 0;
    const render = vi.fn((_: HTMLElement, done: () => void) => {
      calls += 1;
      if (calls < 3) throw new Error('boom');
      done();
      return () => {};
    });
    mount(plan({ load: () => Promise.resolve(), render }));
    lastObserver().enter();
    await flush();
    expect(render).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS - 1);
    expect(render).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(render).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 2 - 1);
    expect(render).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(render).toHaveBeenCalledTimes(3);
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('fails at once when render throws a FinalError', async () => {
    const error = new FinalError('final');
    const render = vi.fn(() => {
      throw error;
    });
    mount(plan({ load: () => Promise.resolve(), render }));
    lastObserver().enter();
    await flush();
    expect(render).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
    expect(skeletonOf()).toBeNull();
    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT_MS * 5);
    expect(render).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('restyles the wrapper in place', () => {
    const render = vi.fn(() => () => {});
    const { wrapper, update } = mount(
      plan({ load: () => Promise.resolve(), render }, { maxWidth: 550 }),
    );
    const box = wrapper.firstElementChild;
    update({ width: 300, maxWidth: 400 }, false);
    expect(host.firstElementChild).toBe(wrapper);
    expect(wrapper.firstElementChild).toBe(box);
    expect(wrapper.style.width).toBe('300px');
    expect(wrapper.style.maxWidth).toBe('400px');
    update({}, false);
    expect(wrapper.style.width).toBe('100%');
    expect(wrapper.style.maxWidth).toBe('550px');
    update({ width: '50%' }, false);
    expect(wrapper.style.width).toBe('50%');
    expect(wrapper.style.maxWidth).toBe('550px');
  });

  it('starts at once when eager turns on before near, and only once', async () => {
    const load = vi.fn(() => Promise.resolve());
    const render = vi.fn(() => () => {});
    const { update } = mount(plan({ load, render }));
    update({}, false);
    expect(load).not.toHaveBeenCalled();
    update({}, true);
    expect(load).toHaveBeenCalledTimes(1);
    update({}, true);
    lastObserver().enter();
    await flush();
    expect(load).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('errors after every attempt times out', async () => {
    const stop = vi.fn();
    const render = vi.fn(() => stop);
    mount(plan({ load: () => Promise.resolve(), render }));
    lastObserver().enter();
    await flush();
    await vi.advanceTimersByTimeAsync(
      RENDER_TIMEOUT_MS * RENDER_ATTEMPTS + RETRY_DELAY_MS + RETRY_DELAY_MS * 2,
    );
    expect(render).toHaveBeenCalledTimes(RENDER_ATTEMPTS);
    expect(stop).toHaveBeenCalledTimes(RENDER_ATTEMPTS);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: the X embed did not render'),
    );
    expect(skeletonOf()).toBeNull();
  });

  it('replaces the placeholder with a link to the post after the final failure', async () => {
    const marker = document.createElement('span');
    const { wrapper } = mount(
      plan(
        { load: () => Promise.reject(new Error('blocked')), render: vi.fn() },
        {
          markup:
            '<blockquote><a href="https://x.com/jack/status/20"></a></blockquote>',
        },
      ),
      [marker],
    );
    lastObserver().enter();
    await flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(host.contains(marker)).toBe(false);
    const box = wrapper.firstElementChild;
    expect(box?.children).toHaveLength(2);
    const link = box?.lastElementChild;
    expect(link?.outerHTML).toBe(
      '<a href="https://x.com/jack/status/20">View this post on X</a>',
    );
  });

  it('keeps fallback content and adds no link after the final failure', async () => {
    const { wrapper } = mount(
      plan(
        { load: () => Promise.reject(new Error('blocked')), render: vi.fn() },
        {
          markup:
            '<blockquote><p>post</p><a href="https://x.com/jack/status/20">date</a></blockquote>',
          hasFallback: true,
        },
      ),
    );
    lastObserver().enter();
    await flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(wrapper.firstElementChild?.children).toHaveLength(1);
    expect(wrapper.textContent).toBe('postdate');
  });

  it('drops the link when a render signal arrives after the final failure', async () => {
    let late: (() => void) | undefined;
    const render = vi.fn((_: HTMLElement, done: () => void) => {
      late ??= done;
      return () => {};
    });
    mount(
      plan(
        { load: () => Promise.resolve(), render },
        { markup: '<a href="https://www.pinterest.com/pin/1/"></a>' },
      ),
    );
    lastObserver().enter();
    await flush();
    await vi.advanceTimersByTimeAsync(
      RENDER_TIMEOUT_MS * RENDER_ATTEMPTS + RETRY_DELAY_MS * 3,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(host.textContent).toBe('View this post on X');
    late?.();
    expect(host.textContent).toBe('');
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('counts a late signal from an earlier attempt', async () => {
    let first: (() => void) | undefined;
    const render = vi.fn((_: HTMLElement, done: () => void) => {
      first ??= done;
      return () => {};
    });
    mount(plan({ load: () => Promise.resolve(), render }));
    lastObserver().enter();
    await flush();
    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT_MS + RETRY_DELAY_MS);
    expect(render).toHaveBeenCalledTimes(2);
    first?.();
    expect(onLoad).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT_MS * 3);
    expect(render).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports a load rejection and never renders', async () => {
    const render = vi.fn(() => () => {});
    const failure = new Error('script blocked');
    mount(plan({ load: () => Promise.reject(failure), render }));
    lastObserver().enter();
    await flush();
    expect(onError).toHaveBeenCalledWith(failure);
    expect(render).not.toHaveBeenCalled();
  });

  it('wraps a non-Error rejection', async () => {
    mount(
      plan({
        load: vi.fn<() => Promise<void>>().mockRejectedValue('nope'),
        render: () => () => {},
      }),
    );
    lastObserver().enter();
    await flush();
    expect(onError).toHaveBeenCalledWith(new Error('nope'));
  });

  it('adds no skeleton with a fallback', () => {
    mount(
      plan(
        { load: () => Promise.resolve(), render: () => () => {} },
        { hasFallback: true },
      ),
    );
    expect(skeletonOf()).toBeNull();
  });

  it('does nothing after cleanup during a pending attempt', async () => {
    let done: (() => void) | undefined;
    const stop = vi.fn();
    const render = vi.fn((_: HTMLElement, d: () => void) => {
      done = d;
      return stop;
    });
    const { cleanup } = mount(plan({ load: () => Promise.resolve(), render }));
    lastObserver().enter();
    await flush();
    cleanup();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(host.children).toHaveLength(0);
    done?.();
    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT_MS * 5);
    expect(onLoad).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('does nothing when load resolves or rejects after cleanup', async () => {
    let resolve: (() => void) | undefined;
    let reject: ((error: Error) => void) | undefined;
    const render = vi.fn(() => () => {});
    const a = mount(
      plan({
        load: () =>
          new Promise<void>((r) => {
            resolve = r;
          }),
        render,
      }),
    );
    lastObserver().enter();
    a.cleanup();
    resolve?.();
    const b = mount(
      plan({
        load: () =>
          new Promise<void>((_, r) => {
            reject = r;
          }),
        render,
      }),
    );
    lastObserver().enter();
    b.cleanup();
    reject?.(new Error('late'));
    await flush();
    expect(render).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('does nothing when a retry timer is pending at cleanup', async () => {
    const render = vi.fn(() => {
      throw new Error('boom');
    });
    const { cleanup } = mount(plan({ load: () => Promise.resolve(), render }));
    lastObserver().enter();
    await flush();
    cleanup();
    await vi.advanceTimersByTimeAsync(RENDER_TIMEOUT_MS * 5);
    expect(render).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('never loads when cleaned up before near', () => {
    const load = vi.fn(() => Promise.resolve());
    const { cleanup } = mount(plan({ load, render: () => () => {} }));
    cleanup();
    expect(load).not.toHaveBeenCalled();
  });

  it('calls onLoad for two hosts sharing one load promise', async () => {
    const shared = Promise.resolve();
    const other = document.createElement('div');
    document.body.append(other);
    const driver: Driver = {
      load: () => shared,
      render: (_, done) => {
        done();
        return () => {};
      },
    };
    const onLoadB = vi.fn();
    mount(plan(driver));
    lastObserver().enter();
    mountScript(other, plan(driver), {
      eager: false,
      placeholder: [],
      onLoad: onLoadB,
      onError: onError as (error: Error) => void,
    });
    lastObserver().enter();
    await flush();
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoadB).toHaveBeenCalledTimes(1);
    other.remove();
  });
});
