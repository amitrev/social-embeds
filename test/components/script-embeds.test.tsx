import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FacebookEmbed, InstagramEmbed, ThreadsEmbed, XEmbed } from '../../src';
import { loadPlatformScript } from '../../src/loader/platform-scripts';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import postIframe from '../fixtures/facebook/post-iframe.html?raw';
import videoIframe from '../fixtures/facebook/video-iframe-reel.html?raw';
import videoSdk from '../fixtures/facebook/video-sdk-docs.html?raw';
import instagramCode from '../fixtures/instagram/post-captioned.html?raw';
import threadsCode from '../fixtures/threads/oembed.html?raw';
import xOptions from '../fixtures/x/oembed-options.html?raw';
import { installObserver, lastObserver } from './helpers';

vi.mock('../../src/loader/platform-scripts', () => ({
  FACEBOOK_SDK_VERSION: 'v26.0',
  loadPlatformScript: vi.fn(() => Promise.resolve()),
}));

const load = vi.mocked(loadPlatformScript);
const reel = 'https://www.facebook.com/reel/1709746083847442';
const page = window as unknown as Record<string, unknown>;

function parsed(html: string): ParsedEmbed {
  const embed = parseEmbed(html);
  if (!embed) throw new Error('fixture did not parse');
  return embed;
}

function markupOf(container: HTMLElement): string {
  return container.firstElementChild?.firstElementChild?.innerHTML ?? '';
}

async function enter() {
  lastObserver().enter();
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
    const target = wrapper.firstElementChild;
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
    render(
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
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: the X embed did not render'),
    );
  });

  it('reports a script that fails to load', async () => {
    load.mockImplementation(() => Promise.reject(new Error('no network')));
    const onError = vi.fn();
    render(<XEmbed url="https://x.com/jack/status/20" onError={onError} />);
    await enter();
    expect(onError).toHaveBeenCalledWith(new Error('no network'));
  });

  it('stops watching on unmount', async () => {
    const twttr = fakeTwttr();
    const onLoad = vi.fn();
    const { unmount, container } = render(
      <XEmbed url="https://x.com/jack/status/20" onLoad={onLoad} />,
    );
    await enter();
    const target = container.firstElementChild?.firstElementChild;
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
        url="https://www.instagram.com/reels/DfQCqMnhpsG/"
        onLoad={onLoad}
      />,
    );
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe(
      '540px',
    );
    expect(markupOf(container)).toBe(
      '<blockquote data-instgrm-permalink="https://www.instagram.com/reel/DfQCqMnhpsG/" style="width:calc(100% - 2px)"></blockquote>',
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
      container.firstElementChild?.firstElementChild?.append(iframe);
    });
    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('keeps version and caption from embed code unless props turn them off', () => {
    const embed = parsed(instagramCode);
    const { container, rerender } = render(<InstagramEmbed embed={embed} />);
    expect(markupOf(container)).toMatch(
      /^<blockquote data-instgrm-permalink="https:\/\/www\.instagram\.com\/p\/Dc85J9XNoGN\/" data-instgrm-version="14" data-instgrm-captioned="" style="width:calc\(100% - 2px\)"><div> <a href=/,
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
      /^<blockquote data-text-post-permalink="https:\/\/www\.threads\.com\/t\/DfQSavwEs5C" data-text-post-version="0" id="ig-tp-DfQSavwEs5C" data-theme="dark"> <a href=/,
    );
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe(
      '658px',
    );

    await enter();
    expect(load).toHaveBeenCalledWith('threads');
    expect(markupOf(container)).toMatch(
      /^<blockquote [^>]*class="text-post-media"/,
    );
    const target = container.firstElementChild?.firstElementChild;
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
        url="https://m.facebook.com/vasil.popov.98/posts/10234117416785614"
        locale="bg_BG"
        onLoad={onLoad}
      />,
    );
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe(
      '750px',
    );
    expect(markupOf(container)).toBe(
      '<div class="fb-post" data-href="https://www.facebook.com/vasil.popov.98/posts/10234117416785614"></div>',
    );

    await enter();
    expect(load).toHaveBeenCalledWith('facebook', { locale: 'bg_BG' });
    expect(parse).toHaveBeenCalledWith(
      container.firstElementChild?.firstElementChild,
      expect.any(Function),
    );
    expect(onLoad).toHaveBeenCalled();
  });

  it('renders post iframe embed code through the SDK with its width and show_text', () => {
    const { container } = render(<FacebookEmbed embed={parsed(postIframe)} />);
    expect(markupOf(container)).toMatch(
      /^<div class="fb-post" data-href="https:\/\/www\.facebook\.com\/vasil\.popov\.98\/posts\/pfbid\w+" data-width="500" data-show-text="true"><\/div>$/,
    );
    expect(container.querySelector('iframe')).toBeNull();
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
      '<div class="fb-video" data-href="https://www.facebook.com/reel/1709746083847442" data-show-text="true"></div>',
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
