import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  facebookDriver,
  instagramDriver,
  threadsDriver,
  xDriver,
} from '../../src/components/drivers';

const page = window as unknown as Record<string, unknown>;
let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  for (const name of ['twttr', 'instgrm', 'FB'])
    Reflect.deleteProperty(window, name);
  document.body.replaceChildren();
});

describe('xDriver', () => {
  function fakeTwttr() {
    const handlers = new Set<(event: { target?: unknown }) => void>();
    const twttr = {
      widgets: { load: vi.fn() },
      events: {
        bind: (_: string, handler: (event: { target?: unknown }) => void) =>
          handlers.add(handler),
        unbind: (_: string, handler: (event: { target?: unknown }) => void) =>
          handlers.delete(handler),
      },
      fire: (target: unknown) => {
        for (const handler of handlers) handler({ target });
      },
      handlers,
    };
    page.twttr = twttr;
    return twttr;
  }

  it('loads the widgets in the container and finishes on its "rendered" event', () => {
    const twttr = fakeTwttr();
    const done = vi.fn();
    const stop = xDriver.render(container, done);
    expect(twttr.widgets.load).toHaveBeenCalledWith(container);

    twttr.fire(document.body);
    expect(done).not.toHaveBeenCalled();
    const widget = document.createElement('div');
    container.append(widget);
    twttr.fire(widget);
    expect(done).toHaveBeenCalled();

    stop();
    expect(twttr.handlers.size).toBe(0);
  });

  it('adds the twitter-tweet class just before loading the widgets (D39)', () => {
    const twttr = fakeTwttr();
    const blockquote = document.createElement('blockquote');
    container.append(blockquote);
    twttr.widgets.load.mockImplementation(() => {
      expect(blockquote.className).toBe('twitter-tweet');
    });
    xDriver.render(container, vi.fn());
    expect(twttr.widgets.load).toHaveBeenCalled();
  });

  it('also finishes when an iframe in the container gets a height', async () => {
    fakeTwttr();
    const done = vi.fn();
    xDriver.render(container, done);
    const iframe = document.createElement('iframe');
    iframe.style.height = '0px';
    container.append(iframe);
    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();
    iframe.style.height = '250px';
    await vi.waitFor(() => {
      expect(done).toHaveBeenCalled();
    });
  });
});

describe('instagramDriver and threadsDriver', () => {
  it('Instagram: processes embeds and finishes on instagram-media-rendered', async () => {
    const process = vi.fn();
    page.instgrm = { Embeds: { process } };
    const done = vi.fn();
    instagramDriver.render(container, done);
    expect(process).toHaveBeenCalled();

    const iframe = document.createElement('iframe');
    iframe.className = 'instagram-media';
    container.append(iframe);
    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();
    iframe.classList.add('instagram-media-rendered');
    await vi.waitFor(() => {
      expect(done).toHaveBeenCalled();
    });
  });

  it('Threads: finishes once its blockquote has been replaced by the iframe', async () => {
    page.instgrm = { Embeds: { process: vi.fn() } };
    const blockquote = document.createElement('blockquote');
    container.append(blockquote);
    const done = vi.fn();
    threadsDriver.render(container, done);

    container.prepend(document.createElement('iframe'));
    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();
    blockquote.remove();
    await vi.waitFor(() => {
      expect(done).toHaveBeenCalled();
    });
  });

  it('adds the class once, so a retry does not undo what embed.js registered (D39)', () => {
    const process = vi.fn();
    page.instgrm = { Embeds: { process } };
    const blockquote = document.createElement('blockquote');
    container.append(blockquote);
    process.mockImplementationOnce(() => {
      expect(blockquote.className).toBe('text-post-media');
      // What embed.js does when it takes the blockquote on.
      blockquote.className = 'text-post-media-registered';
    });
    threadsDriver.render(container, vi.fn());
    threadsDriver.render(container, vi.fn());
    expect(process).toHaveBeenCalledTimes(2);
    expect(blockquote.className).toBe('text-post-media-registered');
  });

  it('throws when instgrm.Embeds.process is missing', () => {
    expect(() => threadsDriver.render(container, vi.fn())).toThrow(
      'social-embeds: instgrm.Embeds.process is missing',
    );
  });
});

describe('facebookDriver', () => {
  it('parses inside the container and finishes on the parse callback', () => {
    const parse = vi.fn((_: Element, callback?: () => void) => callback?.());
    page.FB = { XFBML: { parse } };
    const done = vi.fn();
    facebookDriver('en_US').render(container, done);
    expect(parse).toHaveBeenCalledWith(container, done);
    expect(done).toHaveBeenCalled();
  });

  it('initialises an SDK the host loaded without a version, then parses again', () => {
    let initialised = false;
    const parse = vi.fn(() => {
      if (!initialised) throw new Error('init not called with valid version');
    });
    const init = vi.fn(() => (initialised = true));
    page.FB = { init, XFBML: { parse } };
    facebookDriver('en_US').render(container, vi.fn());
    expect(init).toHaveBeenCalledWith({ xfbml: false, version: 'v26.0' });
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it('rethrows other errors and reuses one driver per locale', () => {
    page.FB = {
      XFBML: {
        parse: () => {
          throw new Error('boom');
        },
      },
    };
    expect(() => facebookDriver('en_US').render(container, vi.fn())).toThrow(
      'boom',
    );
    expect(facebookDriver('bg_BG')).toBe(facebookDriver('bg_BG'));
  });
});
