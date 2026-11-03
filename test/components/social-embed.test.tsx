import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialEmbed } from '../../src';
import fbVideo from '../fixtures/facebook/video-sdk-docs.html?raw';
import instagram from '../fixtures/instagram/post-captioned.html?raw';
import threads from '../fixtures/threads/oembed.html?raw';
import tiktok from '../fixtures/tiktok/oembed-player.html?raw';
import x from '../fixtures/x/oembed-basic.html?raw';
import youtube from '../fixtures/youtube/share.html?raw';
import { installObserver } from './helpers';

vi.mock('../../src/loader/platform-scripts', () => ({
  FACEBOOK_SDK_VERSION: 'v26.0',
  loadPlatformScript: vi.fn(() => new Promise(() => {})),
}));

/** The platform markup a script-based embed wrote, or the iframe of an iframe embed. */
function rendered(container: HTMLElement): string {
  const iframe = container.querySelector('iframe');
  if (iframe) return `iframe ${iframe.getAttribute('src') ?? ''}`;
  const root =
    container.firstElementChild?.firstElementChild?.firstElementChild;
  return `${root?.tagName.toLowerCase() ?? 'nothing'}.${root?.className ?? ''}`;
}

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SocialEmbed with embed code', () => {
  it.each([
    ['X', x, 'blockquote.twitter-tweet'],
    ['Instagram', instagram, 'blockquote.instagram-media'],
    ['Threads', threads, 'blockquote.text-post-media'],
    ['Facebook', fbVideo, 'div.fb-video'],
    [
      'TikTok',
      tiktok,
      'iframe https://www.tiktok.com/player/v1/6718335390845095173?embed_from=oembed&music_info=1&description=1&autoplay=1&muted=1',
    ],
    [
      'YouTube',
      youtube,
      'iframe https://www.youtube.com/embed/jNQXAC9IVRw?si=zgsn8wwuM9wOXrRk',
    ],
  ])('routes %s embed code to its component', (_, html, expected) => {
    const { container } = render(<SocialEmbed html={html} lazy={false} />);
    expect(rendered(container)).toBe(expected);
  });

  it('hands unrecognised embed code to fallback, unchanged', () => {
    const html =
      '<p>Sanitised by the CMS</p><iframe src="https://maps.test"></iframe>';
    const fallback = vi.fn((code: string) => (
      <div data-testid="host">{code}</div>
    ));
    const onError = vi.fn();
    const { getByTestId } = render(
      <SocialEmbed html={html} fallback={fallback} onError={onError} />,
    );
    expect(fallback).toHaveBeenCalledWith(html);
    expect(getByTestId('host').textContent).toBe(html);
    expect(onError).not.toHaveBeenCalled();
  });

  it('renders nothing and reports unrecognised embed code without a fallback', () => {
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed html="<p>hello</p>" onError={onError} />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: unrecognised embed code'),
    );
  });
});

describe('SocialEmbed with a URL', () => {
  it.each([
    ['https://x.com/jack/status/20', 'blockquote.twitter-tweet'],
    ['https://www.instagram.com/p/DfPQchkG1tg/', 'blockquote.instagram-media'],
    ['https://www.threads.com/t/DfQSavwEs5C', 'blockquote.text-post-media'],
    [
      'https://www.facebook.com/facebook/videos/10153231379946729/',
      'div.fb-video',
    ],
    [
      'https://www.tiktok.com/@scout2015/video/6718335390845095173',
      'iframe https://www.tiktok.com/player/v1/6718335390845095173',
    ],
    [
      'https://youtu.be/jNQXAC9IVRw?t=90',
      'iframe https://www.youtube.com/embed/jNQXAC9IVRw?start=90',
    ],
  ])('routes %s', (url, expected) => {
    const { container } = render(<SocialEmbed url={url} lazy={false} />);
    expect(rendered(container)).toBe(expected);
  });

  it('reports an unsupported URL and never calls fallback for it', () => {
    const fallback = vi.fn(() => <div>fallback</div>);
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed
        url="https://fb.watch/abc123/"
        fallback={fallback}
        onError={onError}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(fallback).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: not a supported post URL: https://fb.watch/abc123/',
      ),
    );
  });
});

describe('SocialEmbed props', () => {
  it('forwards wrapper props, and height to iframe embeds', () => {
    const { container } = render(
      <SocialEmbed
        url="https://youtu.be/jNQXAC9IVRw"
        className="embed"
        maxWidth={640}
        height={360}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe('embed');
    expect(wrapper.style.maxWidth).toBe('640px');
    expect(wrapper.style.height).toBe('360px');
  });

  it('accepts html or url, never both or neither', () => {
    // Checked by `pnpm typecheck`: each element below must be a type error.
    const invalid = [
      // @ts-expect-error -- html and url are mutually exclusive
      <SocialEmbed key="both" html={x} url="https://x.com/jack/status/20" />,
      // @ts-expect-error -- one of html or url is required
      <SocialEmbed key="neither" />,
    ];
    expect(invalid).toHaveLength(2);
  });
});
