import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlatformScript } from '../../src/loader/load-script';
import { addHostScript, captureScripts, fire, resetPage } from './helpers';

// A fresh module per test: the loader's cache is page-wide state.
async function freshLoader() {
  vi.resetModules();
  return (await import('../../src/loader/load-script')).loadScript;
}

let present = false;
const script: PlatformScript = {
  key: 'test',
  url: 'https://cdn.test/sdk.js',
  isOwn: (src) => src.startsWith('https://cdn.test/sdk.js'),
  isPresent: () => present,
};

/** Settles a promise's state without awaiting it, so pending promises can be asserted. */
function track(promise: Promise<void>) {
  const state = { settled: false, error: undefined as unknown };
  promise.then(
    () => (state.settled = true),
    (error: unknown) => {
      state.settled = true;
      state.error = error;
    },
  );
  return state;
}

beforeEach(() => {
  vi.useFakeTimers();
  present = false;
  resetPage();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('loadScript', () => {
  it('adds the script once and shares one promise between concurrent callers', async () => {
    const loadScript = await freshLoader();
    const added = captureScripts();

    const first = loadScript(script);
    const second = loadScript(script);
    expect(second).toBe(first);
    expect(added).toHaveLength(1);
    expect(added[0]?.src).toBe('https://cdn.test/sdk.js');
    expect(added[0]?.async).toBe(true);

    present = true;
    fire(added[0], 'load');
    await expect(first).resolves.toBeUndefined();
  });

  it('resolves at once, without a new tag, for a later caller', async () => {
    const loadScript = await freshLoader();
    const added = captureScripts();
    const first = loadScript(script);
    present = true;
    fire(added[0], 'load');
    await first;

    await expect(loadScript(script)).resolves.toBeUndefined();
    expect(added).toHaveLength(1);
  });

  it('adds nothing when the global is already present', async () => {
    const loadScript = await freshLoader();
    const added = captureScripts();
    present = true;
    await expect(loadScript(script)).resolves.toBeUndefined();
    expect(added).toHaveLength(0);
  });

  it('waits for a tag the host added instead of adding another', async () => {
    const loadScript = await freshLoader();
    addHostScript('https://cdn.test/sdk.js?v=2');
    const added = captureScripts();

    const state = track(loadScript(script));
    await vi.advanceTimersByTimeAsync(500);
    expect(state.settled).toBe(false);
    present = true;
    await vi.advanceTimersByTimeAsync(50);
    expect(state).toEqual({ settled: true, error: undefined });
    expect(added).toHaveLength(0);
  });

  it('adds nothing when the host tag defines the global within the grace period', async () => {
    const loadScript = await freshLoader();
    addHostScript('https://cdn.test/sdk.js');
    const added = captureScripts();

    const state = track(loadScript(script));
    await vi.advanceTimersByTimeAsync(2_900);
    present = true;
    await vi.advanceTimersByTimeAsync(50);
    expect(state).toEqual({ settled: true, error: undefined });
    await vi.advanceTimersByTimeAsync(15_000);
    expect(added).toHaveLength(0);
  });

  it('adds its own tag when the host tag never runs', async () => {
    const loadScript = await freshLoader();
    // Like a tag written through innerHTML: in the page, never fetched.
    addHostScript('https://cdn.test/sdk.js');
    const added = captureScripts();

    const state = track(loadScript(script));
    await vi.advanceTimersByTimeAsync(2_999);
    expect(added).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(added.map((element) => element.src)).toEqual([
      'https://cdn.test/sdk.js',
    ]);

    present = true;
    fire(added[0], 'load');
    await vi.advanceTimersByTimeAsync(0);
    expect(state).toEqual({ settled: true, error: undefined });
  });

  it('adds its own tag at once when the host tag fails to load', async () => {
    const loadScript = await freshLoader();
    const host = addHostScript('https://cdn.test/sdk.js');
    const added = captureScripts();

    const state = track(loadScript(script));
    await vi.advanceTimersByTimeAsync(500);
    expect(added).toHaveLength(0);
    fire(host, 'error');
    await vi.advanceTimersByTimeAsync(0);
    expect(added).toHaveLength(1);

    present = true;
    fire(added[0], 'load');
    await vi.advanceTimersByTimeAsync(0);
    expect(state).toEqual({ settled: true, error: undefined });
  });

  it('gives the host tag until the page has loaded, then the grace period', async () => {
    const loadScript = await freshLoader();
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('interactive');
    addHostScript('https://cdn.test/sdk.js');
    const added = captureScripts();

    const state = track(loadScript(script));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(added).toHaveLength(0);
    window.dispatchEvent(new Event('load'));
    await vi.advanceTimersByTimeAsync(2_999);
    expect(added).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(added).toHaveLength(1);

    present = true;
    fire(added[0], 'load');
    await vi.advanceTimersByTimeAsync(0);
    expect(state).toEqual({ settled: true, error: undefined });
  });

  it('adds its own tag when the page has not loaded within 15 s', async () => {
    const loadScript = await freshLoader();
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    addHostScript('https://cdn.test/sdk.js');
    const added = captureScripts();

    void loadScript(script).catch(() => undefined);
    await vi.advanceTimersByTimeAsync(14_999);
    expect(added).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(added).toHaveLength(1);
  });

  it('sets up the ready callback only when it adds its own tag', async () => {
    const loadScript = await freshLoader();
    addHostScript('https://cdn.test/sdk.js');
    const added = captureScripts();
    let calls = 0;
    let ready = () => {};
    const state = track(
      loadScript({
        ...script,
        readyCallback: () => {
          calls++;
          return new Promise((resolve) => {
            ready = resolve;
          });
        },
      }),
    );

    await vi.advanceTimersByTimeAsync(2_999);
    expect(calls).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toBe(1);
    expect(added).toHaveLength(1);

    present = true;
    fire(added[0], 'load');
    await vi.advanceTimersByTimeAsync(1000);
    expect(state.settled).toBe(false);
    ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(state).toEqual({ settled: true, error: undefined });
  });

  it('retries a failed load twice, after 1 s and then 2 s', async () => {
    const loadScript = await freshLoader();
    const added = captureScripts();
    const state = track(loadScript(script));

    fire(added[0], 'error');
    await vi.advanceTimersByTimeAsync(999);
    expect(added).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(added).toHaveLength(2);

    fire(added[1], 'error');
    await vi.advanceTimersByTimeAsync(2000);
    expect(added).toHaveLength(3);

    present = true;
    fire(added[2], 'load');
    await vi.advanceTimersByTimeAsync(0);
    expect(state).toEqual({ settled: true, error: undefined });
  });

  it('gives up after three failures and lets a later caller try again', async () => {
    const loadScript = await freshLoader();
    const added = captureScripts();
    const state = track(loadScript(script));

    fire(added[0], 'error');
    await vi.advanceTimersByTimeAsync(1000);
    fire(added[1], 'error');
    await vi.advanceTimersByTimeAsync(2000);
    fire(added[2], 'error');
    await vi.advanceTimersByTimeAsync(0);
    expect(state.error).toEqual(
      new Error('social-embeds: could not load https://cdn.test/sdk.js'),
    );

    void loadScript(script).catch(() => undefined);
    expect(added).toHaveLength(4);
  });

  it('times out when the script never loads, without adding a second tag', async () => {
    const loadScript = await freshLoader();
    const added = captureScripts();
    const state = track(loadScript(script));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(state.error).toEqual(
      new Error('social-embeds: https://cdn.test/sdk.js did not load'),
    );
    // The tag may still arrive and run, so it is not retried.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(added).toHaveLength(1);
  });

  it('times out when the global never appears', async () => {
    const loadScript = await freshLoader();
    const added = captureScripts();
    const state = track(loadScript(script));
    fire(added[0], 'load');
    await vi.advanceTimersByTimeAsync(15_000);
    expect(state.error).toEqual(
      new Error('social-embeds: https://cdn.test/sdk.js did not initialise'),
    );
  });

  it('waits for the ready callback set up before the script is added', async () => {
    const loadScript = await freshLoader();
    const added = captureScripts();
    let ready = () => {};
    const state = track(
      loadScript({
        ...script,
        readyCallback: () =>
          new Promise((resolve) => {
            ready = resolve;
          }),
      }),
    );

    present = true;
    fire(added[0], 'load');
    await vi.advanceTimersByTimeAsync(1000);
    expect(state.settled).toBe(false);
    ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(state).toEqual({ settled: true, error: undefined });
  });

  it('waits for the platform ready signal once the global is present', async () => {
    const loadScript = await freshLoader();
    present = true;
    let ready = () => {};
    const state = track(
      loadScript({
        ...script,
        whenPresent: () =>
          new Promise((resolve) => {
            ready = resolve;
          }),
      }),
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(state.settled).toBe(false);
    ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(state.settled).toBe(true);
  });

  it("gives its tag the nonce of the page's own scripts", async () => {
    const loadScript = await freshLoader();
    const own = document.createElement('script');
    // Browsers empty the attribute once the page has loaded; the property keeps the nonce.
    own.setAttribute('nonce', '');
    own.nonce = 'r4nd0m';
    document.head.append(own);
    const added = captureScripts();

    void loadScript(script);
    expect(added[0]?.getAttribute('nonce')).toBe('r4nd0m');
  });

  it('adds no nonce when the page has none', async () => {
    const loadScript = await freshLoader();
    const added = captureScripts();

    void loadScript(script);
    expect(added).toHaveLength(1);
    expect(added[0]?.hasAttribute('nonce')).toBe(false);
  });
});
