import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addHostScript, captureScripts, fire, resetPage } from './helpers';

type Page = Record<string, unknown>;
const page = window as unknown as Page;

async function freshLoader() {
  vi.resetModules();
  return import('../../src/loader/platform-scripts');
}

beforeEach(() => {
  resetPage();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('X', () => {
  it('loads widgets.js from platform.twitter.com and waits for twttr.ready', async () => {
    const { loadX } = await freshLoader();
    const added = captureScripts();
    const promise = loadX();
    expect(added.map((element) => element.src)).toEqual([
      'https://platform.twitter.com/widgets.js',
    ]);

    let ready: (() => void) | undefined;
    page.twttr = {
      widgets: { load: () => undefined },
      ready: (callback: () => void) => (ready = callback),
    };
    fire(added[0], 'load');
    await vi.waitFor(() => {
      expect(ready).toBeDefined();
    });
    ready?.();
    await expect(promise).resolves.toBeUndefined();
  });

  it('reuses widgets.js that the host loaded from platform.x.com', async () => {
    const { loadX } = await freshLoader();
    addHostScript('https://platform.x.com/widgets.js');
    const added = captureScripts();
    page.twttr = { widgets: { load: () => undefined } };
    await expect(loadX()).resolves.toBeUndefined();
    expect(added).toHaveLength(0);
  });
});

describe('Instagram and Threads', () => {
  const embeds = (...names: string[]) => ({
    Embeds: {
      process: () => undefined,
      registeredEmbedSDKs: Object.fromEntries(
        names.map((name) => [name, true]),
      ),
    },
  });

  it('loads each script and waits for its own registration on instgrm.Embeds', async () => {
    const { loadInstagram, loadThreads } = await freshLoader();
    const added = captureScripts();
    const instagram = loadInstagram();
    const threads = loadThreads();
    expect(added.map((element) => element.src)).toEqual([
      'https://www.instagram.com/embed.js',
      'https://www.threads.com/embed.js',
    ]);

    page.instgrm = embeds('instagram');
    fire(added[0], 'load');
    await expect(instagram).resolves.toBeUndefined();

    fire(added[1], 'load');
    page.instgrm = embeds('instagram', 'threads');
    await expect(threads).resolves.toBeUndefined();
  });

  it('marks a loaded Facebook SDK as buffering while embed.js runs (D38)', async () => {
    const { loadInstagram } = await freshLoader();
    const fb: Page = { XFBML: { parse: () => undefined } };
    page.FB = fb;
    const added = captureScripts();
    const promise = loadInstagram();
    expect(fb.__buffer).toBe(true);

    page.instgrm = embeds('instagram');
    fire(added[0], 'load');
    await expect(promise).resolves.toBeUndefined();
    expect('__buffer' in fb).toBe(false);
  });

  it('leaves the buffer of an SDK that is still loading alone', async () => {
    const { loadThreads } = await freshLoader();
    const buffer = { calls: [] };
    const fb: Page = { __buffer: buffer };
    page.FB = fb;
    const added = captureScripts();
    const promise = loadThreads();
    page.instgrm = embeds('threads');
    fire(added[0], 'load');
    await expect(promise).resolves.toBeUndefined();
    expect(fb.__buffer).toBe(buffer);
  });

  it('adds embed.js again when a Facebook SDK finished loading before it ran', async () => {
    const { loadInstagram } = await freshLoader();
    const added = captureScripts();
    const promise = loadInstagram();
    expect(added).toHaveLength(1);
    const first = added[0];
    if (!first) throw new Error('no script was added');
    const removed = vi.spyOn(first, 'remove');

    // The SDK, added at the same moment, finishes first: embed.js runs and does nothing.
    const fb: Page = { XFBML: { parse: () => undefined } };
    page.FB = fb;
    fire(first, 'load');

    await vi.waitFor(() => {
      expect(added).toHaveLength(2);
    });
    expect(added[1]?.src).toBe('https://www.instagram.com/embed.js');
    expect(removed).toHaveBeenCalled();
    expect(fb.__buffer).toBe(true);

    page.instgrm = embeds('instagram');
    fire(added[1], 'load');
    await expect(promise).resolves.toBeUndefined();
    expect('__buffer' in fb).toBe(false);
  });

  it('does not add a script again that has only not registered yet', async () => {
    const { loadThreads } = await freshLoader();
    const added = captureScripts();
    const promise = loadThreads();
    // Loaded, no registration yet, and no Facebook SDK that could have stopped it.
    fire(added[0], 'load');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(added).toHaveLength(1);

    page.instgrm = embeds('threads');
    await expect(promise).resolves.toBeUndefined();
  });

  it('adds a script that keeps doing nothing three times at most', async () => {
    const { loadInstagram } = await freshLoader();
    const added = captureScripts();
    const promise = loadInstagram();
    promise.catch(() => undefined);
    page.FB = { XFBML: { parse: () => undefined } };

    for (const attempt of [0, 1, 2]) {
      await vi.waitFor(() => {
        expect(added).toHaveLength(attempt + 1);
      });
      fire(added[attempt], 'load');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(added).toHaveLength(3);
  });

  it('reuses the protocol-relative Instagram script of an embed code', async () => {
    const { loadInstagram } = await freshLoader();
    addHostScript('//www.instagram.com/embed.js');
    const added = captureScripts();
    page.instgrm = embeds('instagram');
    await expect(loadInstagram()).resolves.toBeUndefined();
    expect(added).toHaveLength(0);
  });

  it("adds embed.js itself when the host's own tag ran beside a loaded Facebook SDK", async () => {
    vi.useFakeTimers();
    const { loadInstagram } = await freshLoader();
    addHostScript('https://www.instagram.com/embed.js');
    const fb: Page = { XFBML: { parse: () => undefined } };
    page.FB = fb;
    const added = captureScripts();
    const promise = loadInstagram();

    await vi.advanceTimersByTimeAsync(3_000);
    expect(added.map((element) => element.src)).toEqual([
      'https://www.instagram.com/embed.js',
    ]);
    expect(fb.__buffer).toBe(true);

    page.instgrm = embeds('instagram');
    fire(added[0], 'load');
    await expect(promise).resolves.toBeUndefined();
    expect('__buffer' in fb).toBe(false);
  });
});

describe('Facebook', () => {
  const fb = { XFBML: { parse: () => undefined } };

  it('loads the SDK without XFBML scanning, in the requested locale', async () => {
    const { loadFacebook } = await freshLoader();
    const added = captureScripts();
    const promise = loadFacebook('bg_BG');
    expect(added[0]?.src).toBe(
      'https://connect.facebook.net/bg_BG/sdk.js#xfbml=0&version=v26.0',
    );
    expect(added[0]?.crossOrigin).toBe('anonymous');

    // FB exists before init has finished; fbAsyncInit marks readiness.
    page.FB = fb;
    fire(added[0], 'load');
    let settled = false;
    void promise.then(() => (settled = true));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(settled).toBe(false);

    (page.fbAsyncInit as () => void)();
    await expect(promise).resolves.toBeUndefined();
  });

  it("keeps the host's fbAsyncInit and calls it first", async () => {
    const { loadFacebook } = await freshLoader();
    const calls: string[] = [];
    page.fbAsyncInit = () => calls.push('host');
    const added = captureScripts();
    const promise = loadFacebook('en_US').then(() => calls.push('loader'));

    page.FB = fb;
    fire(added[0], 'load');
    (page.fbAsyncInit as () => void)();
    await promise;
    expect(calls).toEqual(['host', 'loader']);
  });

  it('serves the whole page with the first locale requested', async () => {
    const { loadFacebook } = await freshLoader();
    const added = captureScripts();
    const first = loadFacebook('en_US');
    const second = loadFacebook('bg_BG');
    expect(second).toBe(first);
    expect(added).toHaveLength(1);
  });

  it('reuses an SDK the host already set up', async () => {
    const { loadFacebook } = await freshLoader();
    addHostScript(
      'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.2',
    );
    page.FB = fb;
    const added = captureScripts();
    await expect(loadFacebook('en_US')).resolves.toBeUndefined();
    expect(added).toHaveLength(0);
  });

  it('adds its own SDK and waits for fbAsyncInit when the host tag never runs', async () => {
    vi.useFakeTimers();
    const { loadFacebook } = await freshLoader();
    addHostScript('https://connect.facebook.net/en_US/sdk.js');
    const added = captureScripts();
    const promise = loadFacebook('en_US');

    await vi.advanceTimersByTimeAsync(3_000);
    expect(added.map((element) => element.src)).toEqual([
      'https://connect.facebook.net/en_US/sdk.js#xfbml=0&version=v26.0',
    ]);

    page.FB = fb;
    fire(added[0], 'load');
    (page.fbAsyncInit as () => void)();
    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects an invalid locale without loading anything', async () => {
    const { loadFacebook } = await freshLoader();
    const added = captureScripts();
    await expect(loadFacebook('en_US/../x')).rejects.toThrow(
      'social-embeds: invalid Facebook locale "en_US/../x"',
    );
    expect(added).toHaveLength(0);
  });
});

describe('Pinterest', () => {
  it('loads pinit_main.js directly and waits for PinUtils.build', async () => {
    const { loadPinterest } = await freshLoader();
    const added = captureScripts();
    const promise = loadPinterest();
    expect(added.map((element) => element.src)).toEqual([
      'https://assets.pinterest.com/js/pinit_main.js',
    ]);
    page.PinUtils = { build: () => undefined };
    fire(added[0], 'load');
    await expect(promise).resolves.toBeUndefined();
  });

  it("waits for the host's own pinit.js instead of adding a second script", async () => {
    const { loadPinterest } = await freshLoader();
    addHostScript('//assets.pinterest.com/js/pinit.js');
    const added = captureScripts();
    const promise = loadPinterest();
    page.PinUtils = { build: () => undefined };
    await expect(promise).resolves.toBeUndefined();
    expect(added).toHaveLength(0);
  });
});
