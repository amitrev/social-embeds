import { act, cleanup, render, within } from '@testing-library/react';
import { Activity, type ReactElement, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FacebookEmbed,
  InstagramEmbed,
  PinterestEmbed,
  ThreadsEmbed,
  XEmbed,
} from '../../src';
import { loadPlatformScript } from '../../src/loader/platform-scripts';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import postIframe from '../fixtures/facebook/post-iframe.html?raw';
import videoIframe from '../fixtures/facebook/video-iframe-reel.html?raw';
import videoSdk from '../fixtures/facebook/video-sdk-docs.html?raw';
import instagramCode from '../fixtures/instagram/post-captioned.html?raw';
import pinterestIframe from '../fixtures/pinterest/oembed-iframe.html?raw';
import threadsCode from '../fixtures/threads/embed-dialog.html?raw';
import xOptions from '../fixtures/x/oembed-options.html?raw';
import { installObserver, lastObserver } from './helpers';

vi.mock('../../src/loader/platform-scripts', () => ({
  FACEBOOK_SDK_VERSION: 'v26.0',
  loadPlatformScript: vi.fn(() => Promise.resolve()),
}));

const load = vi.mocked(loadPlatformScript);
const reel = 'https://www.facebook.com/reel/1523911562856332';
const page = window as unknown as Record<string, unknown>;

function parsed(html: string): ParsedEmbed {
  const embed = parseEmbed(html);
  if (!embed) throw new Error('fixture did not parse');
  return embed;
}

function platformBox(container: HTMLElement): Element | null | undefined {
  return container.firstElementChild?.firstElementChild?.firstElementChild;
}

function markupOf(container: HTMLElement): string {
  return platformBox(container)?.innerHTML ?? '';
}

async function enter() {
  lastObserver().enter();
  await flush();
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

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
    fire(target: unknown) {
      act(() => {
        for (const handler of handlers) handler({ target });
      });
    },
  };
  page.twttr = twttr;
  return twttr;
}

beforeEach(() => {
  installObserver();
  load.mockClear();
  load.mockImplementation(() => Promise.resolve());
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  for (const name of ['twttr', 'instgrm', 'FB'])
    Reflect.deleteProperty(window, name);
});

describe('XEmbed', () => {
  it('writes the blockquote, waits for the viewport, then loads and renders', async () => {
    const twttr = fakeTwttr();
    const onLoad = vi.fn();
    const { container } = render(
      <XEmbed
        url="https://twitter.com/jack/status/20"
        placeholder={<span>loading</span>}
        onLoad={onLoad}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe('100%');
    expect(wrapper.style.maxWidth).toBe('550px');
    expect(markupOf(container)).toBe(
      '<blockquote><a href="https://x.com/jack/status/20"></a></blockquote>',
    );
    expect(container.textContent).toBe('loading');
    expect(load).not.toHaveBeenCalled();

    await enter();
    expect(load).toHaveBeenCalledWith('x');
    // The class that widgets.js looks for is added only now (docs/decisions.md D39).
    expect(markupOf(container)).toMatch(/^<blockquote class="twitter-tweet">/);
    const target = platformBox(container);
    expect(twttr.widgets.load).toHaveBeenCalledWith(target);

    const widget = document.createElement('div');
    target?.append(widget);
    twttr.fire(widget);
    twttr.fire(widget);
    expect(container.textContent).toBe('');
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('keeps embed code options and fallback content, with props winning', () => {
    const { container } = render(
      <XEmbed embed={parsed(xOptions)} theme="light" dnt={false} />,
    );
    expect(markupOf(container)).toBe(
      '<blockquote data-theme="light" data-cards="hidden" data-align="center" data-lang="es" data-dnt="false" data-width="400">' +
        '<p lang="en" dir="ltr">just setting up my twttr</p>— jack (@jack) ' +
        '<a href="https://x.com/jack/status/20?ref_src=twsrc%5Etfw">21 de marzo de 2006</a></blockquote>',
    );
    // Fallback content stands in for the placeholder.
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('retries a render that never completes, then reports it', async () => {
    vi.useFakeTimers();
    const twttr = fakeTwttr();
    const onError = vi.fn();
    const { container } = render(
      <XEmbed
        url="https://x.com/jack/status/20"
        onError={onError}
        lazy={false}
      />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(twttr.widgets.load).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000 + 1000);
    });
    expect(twttr.widgets.load).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000 + 2000);
    });
    expect(twttr.widgets.load).toHaveBeenCalledTimes(3);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: the X embed did not render'),
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(
      within(container)
        .getByRole('link', { name: 'View this post on X' })
        .getAttribute('href'),
    ).toBe('https://x.com/jack/status/20');
  });

  it('reports a script that fails to load', async () => {
    load.mockImplementation(() => Promise.reject(new Error('no network')));
    const onError = vi.fn();
    render(<XEmbed url="https://x.com/jack/status/20" onError={onError} />);
    await enter();
    expect(onError).toHaveBeenCalledWith(new Error('no network'));
  });

  it('keeps the fallback content of embed code when the script fails', async () => {
    load.mockImplementation(() => Promise.reject(new Error('blocked')));
    const onError = vi.fn();
    const { container } = render(
      <XEmbed embed={parsed(xOptions)} onError={onError} />,
    );
    await enter();
    expect(onError).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('just setting up my twttr');
    expect(container.textContent).not.toContain('View this post');
  });

  it('stops watching on unmount', async () => {
    const twttr = fakeTwttr();
    const onLoad = vi.fn();
    const { unmount, container } = render(
      <XEmbed url="https://x.com/jack/status/20" onLoad={onLoad} />,
    );
    await enter();
    const target = platformBox(container);
    unmount();
    twttr.fire(target);
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('rejects an embed whose url does not match its id, and drops unsafe fallback content', () => {
    const onError = vi.fn();
    const embed: ParsedEmbed = {
      platform: 'x',
      kind: 'post',
      url: 'javascript:alert(1)',
      id: '20',
      variant: 'sdk',
      options: {},
    };
    const { container, rerender } = render(
      <XEmbed embed={embed} onError={onError} />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error("social-embeds: the X embed's url and id do not match"),
    );

    rerender(
      <XEmbed
        embed={{
          ...embed,
          url: 'https://x.com/jack/status/20',
          fallbackHtml: '<img src=x onerror="alert(1)">',
        }}
      />,
    );
    expect(markupOf(container)).toBe(
      '<blockquote><a href="https://x.com/jack/status/20"></a></blockquote>',
    );
  });
});

describe('InstagramEmbed', () => {
  it('writes a fluid blockquote and finishes when embed.js marks the iframe rendered', async () => {
    const process = vi.fn();
    page.instgrm = { Embeds: { process } };
    const onLoad = vi.fn();
    const { container } = render(
      <InstagramEmbed
        url="https://www.instagram.com/reels/DfkYarGBOtk/"
        onLoad={onLoad}
      />,
    );
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe(
      '540px',
    );
    expect(markupOf(container)).toBe(
      '<blockquote data-instgrm-permalink="https://www.instagram.com/reel/DfkYarGBOtk/" style="width:calc(100% - 2px)"></blockquote>',
    );

    await enter();
    expect(load).toHaveBeenCalledWith('instagram');
    expect(markupOf(container)).toMatch(
      /^<blockquote [^>]*class="instagram-media"/,
    );
    expect(process).toHaveBeenCalled();
    const iframe = document.createElement('iframe');
    iframe.className = 'instagram-media instagram-media-rendered';
    act(() => {
      platformBox(container)?.append(iframe);
    });
    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('fails at once inside a shadow root', async () => {
    const process = vi.fn();
    page.instgrm = { Embeds: { process } };
    const host = document.createElement('div');
    document.body.append(host);
    const root = document.createElement('div');
    host.attachShadow({ mode: 'open' }).append(root);
    const onError = vi.fn();
    render(
      <InstagramEmbed
        url="https://www.instagram.com/p/Df75lxnmIrF/"
        onError={onError}
      />,
      { container: root },
    );
    await enter();
    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        new Error(
          'social-embeds: the Instagram embed cannot render inside a shadow root',
        ),
      );
    });
    expect(onError).toHaveBeenCalledOnce();
    expect(process).not.toHaveBeenCalled();
    host.remove();
  });

  it('keeps version and caption from embed code unless props turn them off', () => {
    const embed = parsed(instagramCode);
    const { container, rerender } = render(<InstagramEmbed embed={embed} />);
    expect(markupOf(container)).toMatch(
      /^<blockquote data-instgrm-permalink="https:\/\/www\.instagram\.com\/p\/Df75lxnmIrF\/" data-instgrm-version="14" data-instgrm-captioned="" style="width:calc\(100% - 2px\)"><div> <a href=/,
    );
    rerender(<InstagramEmbed embed={embed} captioned={false} />);
    expect(markupOf(container)).not.toContain('data-instgrm-captioned');
  });
});

describe('ThreadsEmbed', () => {
  it('writes the blockquote with the id embed.js removes it by', async () => {
    page.instgrm = { Embeds: { process: vi.fn() } };
    const onLoad = vi.fn();
    const { container } = render(
      <ThreadsEmbed embed={parsed(threadsCode)} theme="dark" onLoad={onLoad} />,
    );
    const markup = markupOf(container);
    expect(markup).toMatch(
      /^<blockquote data-text-post-permalink="https:\/\/www\.threads\.com\/t\/Df5MmLBm0O7" data-text-post-version="0" id="ig-tp-Df5MmLBm0O7" data-theme="dark"> <a href=/,
    );
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe(
      '658px',
    );

    await enter();
    expect(load).toHaveBeenCalledWith('threads');
    expect(markupOf(container)).toMatch(
      /^<blockquote [^>]*class="text-post-media"/,
    );
    const target = platformBox(container);
    act(() => {
      target?.prepend(document.createElement('iframe'));
      target?.querySelector('blockquote')?.remove();
    });
    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });
});

describe('FacebookEmbed', () => {
  function fakeFB() {
    const parse = vi.fn((_: Element, callback?: () => void) => {
      callback?.();
    });
    page.FB = { XFBML: { parse } };
    return parse;
  }

  it('renders a post URL through the SDK, at most 750px wide', async () => {
    const parse = fakeFB();
    const onLoad = vi.fn();
    const { container } = render(
      <FacebookEmbed
        url="https://m.facebook.com/facebook/posts/1710463914458955"
        locale="bg_BG"
        onLoad={onLoad}
      />,
    );
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe(
      '750px',
    );
    expect(markupOf(container)).toBe(
      '<div class="fb-post" data-href="https://www.facebook.com/facebook/posts/1710463914458955"></div>',
    );

    await enter();
    expect(load).toHaveBeenCalledWith('facebook', { locale: 'bg_BG' });
    expect(parse).toHaveBeenCalledWith(
      platformBox(container),
      expect.any(Function),
    );
    expect(onLoad).toHaveBeenCalled();
  });

  describe('that React hides and shows again', () => {
    const post = 'https://www.facebook.com/facebook/posts/1710463914458955';
    const video = 'https://www.facebook.com/facebook/videos/10153231379946729/';
    const view = (
      mode: 'hidden' | 'visible',
      onLoad: () => void,
      url = post,
    ) => (
      <Activity mode={mode}>
        <FacebookEmbed url={url} onLoad={onLoad} />
      </Activity>
    );

    it('renders the post and reports onLoad only once', async () => {
      const parse = fakeFB();
      const onLoad = vi.fn();
      const { rerender } = render(view('visible', onLoad));
      await enter();
      expect(parse).toHaveBeenCalledOnce();
      expect(onLoad).toHaveBeenCalledOnce();

      rerender(view('hidden', onLoad));
      rerender(view('visible', onLoad));
      await flush();
      expect(parse).toHaveBeenCalledOnce();
      expect(onLoad).toHaveBeenCalledOnce();
    });

    it('renders a post hidden while the SDK loads once it is shown', async () => {
      const parse = fakeFB();
      let loaded = () => {};
      const sdk = new Promise<void>((resolve) => {
        loaded = resolve;
      });
      load.mockImplementation(() => sdk);
      const onLoad = vi.fn();
      const { rerender } = render(view('visible', onLoad));
      await enter();
      rerender(view('hidden', onLoad));
      await act(async () => {
        loaded();
        await sdk;
      });
      expect(parse).not.toHaveBeenCalled();

      rerender(view('visible', onLoad));
      await flush();
      expect(parse).toHaveBeenCalledOnce();
      expect(onLoad).toHaveBeenCalledOnce();
    });

    it('renders a new post in a new container', async () => {
      const parse = fakeFB();
      const onLoad = vi.fn();
      const { container, rerender } = render(view('visible', onLoad));
      await enter();
      rerender(view('visible', onLoad, video));
      await enter();
      expect(parse).toHaveBeenCalledTimes(2);
      expect(parse).toHaveBeenLastCalledWith(
        platformBox(container),
        expect.any(Function),
      );
      expect(markupOf(container)).toContain('fb-video');
      expect(onLoad).toHaveBeenCalledTimes(2);
    });
  });

  it('renders the post and reports onLoad once under StrictMode', async () => {
    const parse = fakeFB();
    const onLoad = vi.fn();
    render(
      <StrictMode>
        <FacebookEmbed
          url="https://www.facebook.com/facebook/posts/1710463914458955"
          onLoad={onLoad}
        />
      </StrictMode>,
    );
    await enter();
    expect(parse).toHaveBeenCalledOnce();
    expect(onLoad).toHaveBeenCalledOnce();
  });

  it('renders post iframe embed code through the SDK with its width and show_text', () => {
    const { container } = render(<FacebookEmbed embed={parsed(postIframe)} />);
    expect(markupOf(container)).toMatch(
      /^<div class="fb-post" data-href="https:\/\/www\.facebook\.com\/facebook\/posts\/pfbid\w+" data-width="500" data-show-text="true"><\/div>$/,
    );
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('gives the SDK a full-width box when the host lays the wrapper out as a flex row', () => {
    const { container } = render(
      <FacebookEmbed
        embed={parsed(postIframe)}
        className="flex items-center justify-center"
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.children).toHaveLength(1);
    const layer = wrapper.firstElementChild as HTMLElement;
    expect(layer.style.width).toBe('100%');
    expect(layer.querySelector('.fb-post')).not.toBeNull();
    expect(layer.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('renders the fb-video snippet through the SDK, with its locale and fallback', async () => {
    fakeFB();
    const { container } = render(<FacebookEmbed embed={parsed(videoSdk)} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.maxWidth).toBe('');
    expect(markupOf(container)).toMatch(
      /^<div class="fb-video" data-href="https:\/\/www\.facebook\.com\/facebook\/videos\/10153231379946729\/" data-width="500" data-show-text="false">\n {4}<div class="fb-xfbml-parse-ignore">/,
    );
    await enter();
    expect(load).toHaveBeenCalledWith('facebook', { locale: 'en_US' });
  });

  it('renders video iframe embed code that shows the post text through the SDK', () => {
    const { container } = render(
      <FacebookEmbed embed={parsed(videoIframe)} lazy={false} />,
    );
    expect(markupOf(container)).toBe(
      '<div class="fb-video" data-href="https://www.facebook.com/reel/1523911562856332" data-show-text="true"></div>',
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect((container.firstElementChild as HTMLElement).style.aspectRatio).toBe(
      '',
    );
  });

  it('renders that video as the plain iframe when showText is off', () => {
    const { container } = render(
      <FacebookEmbed
        embed={parsed(videoIframe)}
        showText={false}
        maxHeight={640}
        lazy={false}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('267 / 476');
    // 267:476 at most 640px tall.
    expect(wrapper.style.maxWidth).toBe('358px');
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(reel)}&show_text=false&width=267&height=476`,
    );
    expect(container.querySelector('.fb-video')).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it('keeps the player options on that plain iframe', () => {
    const { container } = render(
      <FacebookEmbed
        embed={parsed(videoIframe.replace('&t=0', '&show_captions=true'))}
        showText={false}
        autoplay
        lazy={false}
      />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(reel)}&show_text=false&autoplay=true&show_captions=true&width=267&height=476`,
    );
  });

  it('keeps maxHeight off the wrapper of an SDK embed', () => {
    const { container } = render(
      <FacebookEmbed
        url="https://www.facebook.com/facebook/videos/10153231379946729/"
        showText={false}
        maxHeight={640}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute('maxheight')).toBe(false);
    // A video URL says nothing about its size, so it stays with the SDK.
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('keeps video iframe embed code without the post text as an iframe', () => {
    const embed = parsed(
      videoIframe.replace('show_text=true', 'show_text=false'),
    );
    const { container } = render(
      <FacebookEmbed embed={embed} lazy={false} height={300} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe('300px');
    expect(container.querySelector('iframe')?.getAttribute('src')).toContain(
      'https://www.facebook.com/plugins/video.php?href=',
    );
    expect(load).not.toHaveBeenCalled();
  });

  it('never lets an href option replace the verified video URL', () => {
    const video = 'https://www.facebook.com/facebook/videos/10153231379946729/';
    const { container } = render(
      <FacebookEmbed
        embed={{
          platform: 'facebook',
          kind: 'video',
          url: video,
          id: '10153231379946729',
          variant: 'iframe',
          options: { href: 'https://www.facebook.com/other/videos/1/', t: 5 },
        }}
        lazy={false}
      />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video)}&t=5`,
    );
  });
});

describe('PinterestEmbed', () => {
  it('writes the pin link without data-pin-do, then loads and builds it', async () => {
    const build = vi.fn();
    page.PinUtils = { build };
    const { container } = render(
      <PinterestEmbed url="https://pin.it/x" onError={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
    cleanup();

    const view = render(
      <PinterestEmbed url="https://www.pinterest.com/pin/424605071145752542/" />,
    );
    const wrapper = view.container.firstElementChild as HTMLElement;
    expect(wrapper.style.maxWidth).toBe('236px');
    expect(markupOf(view.container)).toBe(
      '<a href="https://www.pinterest.com/pin/424605071145752542/"></a>',
    );
    await enter();
    expect(load).toHaveBeenCalledWith('pinterest');
    expect(build).toHaveBeenCalledWith(platformBox(view.container));
    expect(markupOf(view.container)).toBe(
      '<a href="https://www.pinterest.com/pin/424605071145752542/" data-pin-do="embedPin"></a>',
    );
  });

  it('renders oEmbed iframe code as the widget, with the width prop', () => {
    const { container } = render(
      <PinterestEmbed embed={parsed(pinterestIframe)} pinWidth="large" />,
    );
    expect(markupOf(container)).toBe(
      '<a href="https://www.pinterest.com/pin/424605071145752542/" data-pin-width="large"></a>',
    );
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe(
      '600px',
    );
  });
});

describe('a platform script that fails', () => {
  const cases: [
    string,
    string,
    (onError: (error: Error) => void) => ReactElement,
  ][] = [
    [
      'X',
      'https://x.com/jack/status/20',
      (onError) => (
        <XEmbed
          url="https://x.com/jack/status/20"
          placeholder={<span>loading</span>}
          onError={onError}
        />
      ),
    ],
    [
      'Instagram',
      'https://www.instagram.com/reel/DfkYarGBOtk/',
      (onError) => (
        <InstagramEmbed
          url="https://www.instagram.com/reels/DfkYarGBOtk/"
          onError={onError}
        />
      ),
    ],
    [
      'Threads',
      'https://www.threads.com/t/Df5MmLBm0O7',
      (onError) => (
        <ThreadsEmbed
          url="https://www.threads.com/@instagram/post/Df5MmLBm0O7"
          onError={onError}
        />
      ),
    ],
    [
      'Facebook',
      'https://www.facebook.com/facebook/posts/1710463914458955',
      (onError) => (
        <FacebookEmbed
          url="https://m.facebook.com/facebook/posts/1710463914458955"
          onError={onError}
        />
      ),
    ],
    [
      'Pinterest',
      'https://www.pinterest.com/pin/424605071145752542/',
      (onError) => (
        <PinterestEmbed
          url="https://www.pinterest.com/pin/424605071145752542/"
          onError={onError}
        />
      ),
    ],
  ];

  it.each(cases)(
    'replaces the %s placeholder with a link to the post',
    async (label, href, view) => {
      load.mockImplementation(() => Promise.reject(new Error('blocked')));
      const onError = vi.fn();
      const { container } = render(view(onError));
      expect(container.querySelector('[aria-hidden="true"], span')).not.toBe(
        null,
      );
      await enter();
      expect(onError).toHaveBeenCalledOnce();
      expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
      expect(container.textContent).not.toContain('loading');
      const link = within(container).getByRole('link', {
        name: `View this post on ${label}`,
      });
      expect(link.getAttribute('href')).toBe(href);
    },
  );
});

describe('invalid input', () => {
  const messages = (onError: ReturnType<typeof vi.fn>) =>
    onError.mock.calls.map(([error]) => (error as Error).message);

  it('is reported once under StrictMode, and a new error after a prop change', () => {
    const onError = vi.fn();
    const view = (url: string) => (
      <StrictMode>
        <XEmbed url={url} onError={onError} />
      </StrictMode>
    );
    const { rerender } = render(view('https://example.com/a'));
    rerender(view('https://example.com/a'));
    rerender(view('https://example.com/b'));
    expect(messages(onError)).toEqual([
      'social-embeds: not a X post URL: https://example.com/a',
      'social-embeds: not a X post URL: https://example.com/b',
    ]);
  });

  it('is not reported again when React hides and shows the embed', () => {
    const onError = vi.fn();
    const view = (mode: 'hidden' | 'visible') => (
      <Activity mode={mode}>
        <XEmbed url="https://example.com/a" onError={onError} />
      </Activity>
    );
    const { rerender } = render(view('visible'));
    rerender(view('hidden'));
    rerender(view('visible'));
    expect(onError).toHaveBeenCalledOnce();
  });
});
