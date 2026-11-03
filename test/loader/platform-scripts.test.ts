import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addHostScript, captureScripts, fire, resetPage } from './helpers';

type Page = Record<string, unknown>;
const page = window as unknown as Page;

async function freshLoader() {
  vi.resetModules();
  return (await import('../../src/loader/platform-scripts')).loadPlatformScript;
}

beforeEach(() => {
  resetPage();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('X', () => {
  it('loads widgets.js from platform.twitter.com and waits for twttr.ready', async () => {
    const load = await freshLoader();
    const added = captureScripts();
    const promise = load('x');
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
    const load = await freshLoader();
    addHostScript('https://platform.x.com/widgets.js');
    const added = captureScripts();
    page.twttr = { widgets: { load: () => undefined } };
    await expect(load('x')).resolves.toBeUndefined();
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
    const load = await freshLoader();
    const added = captureScripts();
    const instagram = load('instagram');
    const threads = load('threads');
    expect(added.map((element) => element.src)).toEqual([
      'https://www.instagram.com/embed.js',
      'https://www.threads.com/embed.js',
    ]);

    page.instgrm = embeds('instagram');
    fire(added[0], 'load');
    await expect(instagram).resolves.toBeUndefined();

    // Instagram's registration does not make Threads ready.
    fire(added[1], 'load');
    page.instgrm = embeds('instagram', 'threads');
    await expect(threads).resolves.toBeUndefined();
  });

  it('marks a loaded Facebook SDK as buffering while embed.js runs (D38)', async () => {
    const load = await freshLoader();
    const fb: Page = { XFBML: { parse: () => undefined } };
    page.FB = fb;
    const added = captureScripts();
    const promise = load('instagram');
    // embed.js skips itself while FB is a loaded SDK without __buffer.
    expect(fb.__buffer).toBe(true);

    page.instgrm = embeds('instagram');
    fire(added[0], 'load');
    await expect(promise).resolves.toBeUndefined();
    expect('__buffer' in fb).toBe(false);
  });

  it('leaves the buffer of an SDK that is still loading alone', async () => {
    const load = await freshLoader();
    const buffer = { calls: [] };
    const fb: Page = { __buffer: buffer };
    page.FB = fb;
    const added = captureScripts();
    const promise = load('threads');
    page.instgrm = embeds('threads');
    fire(added[0], 'load');
    await expect(promise).resolves.toBeUndefined();
    expect(fb.__buffer).toBe(buffer);
  });

  it('reuses the protocol-relative Instagram script of an embed code', async () => {
    const load = await freshLoader();
    addHostScript('//www.instagram.com/embed.js');
    const added = captureScripts();
    page.instgrm = embeds('instagram');
    await expect(load('instagram')).resolves.toBeUndefined();
    expect(added).toHaveLength(0);
  });
});

describe('Facebook', () => {
  const fb = { XFBML: { parse: () => undefined } };

  it('loads the SDK without XFBML scanning, in the requested locale', async () => {
    const load = await freshLoader();
    const added = captureScripts();
    const promise = load('facebook', { locale: 'bg_BG' });
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
    const load = await freshLoader();
    const calls: string[] = [];
    page.fbAsyncInit = () => calls.push('host');
    const added = captureScripts();
    const promise = load('facebook').then(() => calls.push('loader'));

    page.FB = fb;
    fire(added[0], 'load');
    (page.fbAsyncInit as () => void)();
    await promise;
    expect(calls).toEqual(['host', 'loader']);
  });

  it('serves the whole page with the first locale requested', async () => {
    const load = await freshLoader();
    const added = captureScripts();
    const first = load('facebook', { locale: 'en_US' });
    const second = load('facebook', { locale: 'bg_BG' });
    expect(second).toBe(first);
    expect(added).toHaveLength(1);
  });

  it('reuses an SDK the host already set up', async () => {
    const load = await freshLoader();
    addHostScript(
      'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.2',
    );
    page.FB = fb;
    const added = captureScripts();
    await expect(load('facebook')).resolves.toBeUndefined();
    expect(added).toHaveLength(0);
  });

  it('rejects an invalid locale without loading anything', async () => {
    const load = await freshLoader();
    const added = captureScripts();
    await expect(load('facebook', { locale: 'en_US/../x' })).rejects.toThrow(
      'social-embeds: invalid Facebook locale "en_US/../x"',
    );
    expect(added).toHaveLength(0);
  });
});
