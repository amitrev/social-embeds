import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialEmbed } from '../../src';
import dailymotionOembed from '../fixtures/dailymotion/oembed.html?raw';
import dailymotion from '../fixtures/dailymotion/player-id-docs.html?raw';
import fbVideo from '../fixtures/facebook/video-sdk-docs.html?raw';
import instagram from '../fixtures/instagram/post-captioned.html?raw';
import linkedin from '../fixtures/linkedin/post-full.html?raw';
import pinterest from '../fixtures/pinterest/widget-docs.html?raw';
import reddit from '../fixtures/reddit/post-share.html?raw';
import snapchat from '../fixtures/snapchat/profile-share.html?raw';
import spotify from '../fixtures/spotify/oembed-track.html?raw';
import telegram from '../fixtures/telegram/widget-configurator.html?raw';
import threads from '../fixtures/threads/oembed.html?raw';
import tiktok from '../fixtures/tiktok/oembed-player.html?raw';
import twitch from '../fixtures/twitch/docs-channel.html?raw';
import vimeo from '../fixtures/vimeo/responsive-docs.html?raw';
import x from '../fixtures/x/oembed-basic.html?raw';
import youtube from '../fixtures/youtube/share.html?raw';
import { installObserver } from './helpers';

vi.mock('../../src/loader/platform-scripts', () => ({
  FACEBOOK_SDK_VERSION: 'v26.0',
  loadPlatformScript: vi.fn(() => new Promise(() => {})),
}));

function rendered(container: HTMLElement): string {
  const iframe = container.querySelector('iframe');
  if (iframe) return `iframe ${iframe.getAttribute('src') ?? ''}`;
  const root =
    container.firstElementChild?.firstElementChild?.firstElementChild;
  if (!root) return 'nothing';
  // X, Instagram and Threads blockquotes get their class only when the post renders
  // (docs/decisions.md D39), so the host of the post's link tells them apart.
  const link =
    root.getAttribute('data-href') ??
    root.getAttribute('data-instgrm-permalink') ??
    root.getAttribute('data-text-post-permalink') ??
    // Pinterest: the pin link itself.
    root.getAttribute('href') ??
    root.querySelector('a[href*="/status/"]')?.getAttribute('href') ??
    '';
  const name = root.className ? `.${root.className}` : '';
  return `${root.tagName.toLowerCase()}${name} ${new URL(link).hostname}`;
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
    ['X', x, 'blockquote x.com'],
    ['Instagram', instagram, 'blockquote www.instagram.com'],
    ['Threads', threads, 'blockquote www.threads.com'],
    ['Facebook', fbVideo, 'div.fb-video www.facebook.com'],
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
    ['Telegram', telegram, 'iframe https://t.me/telegram/83?embed=1'],
    [
      'Snapchat',
      snapchat,
      'iframe https://www.snapchat.com/@teamsnapchat/embed',
    ],
    [
      'LinkedIn',
      linkedin,
      'iframe https://www.linkedin.com/embed/feed/update/urn:li:share:7527261037016817664',
    ],
    [
      'Reddit',
      reddit,
      'iframe https://embed.reddit.com/r/bulgaria/comments/1xz8iq4/?embed=true',
    ],
    ['Pinterest', pinterest, 'a www.pinterest.com'],
    [
      'Spotify',
      spotify,
      'iframe https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC',
    ],
    [
      'Vimeo',
      vimeo,
      'iframe https://player.vimeo.com/video/76979871?badge=0&autopause=0',
    ],
    [
      'Twitch',
      twitch,
      `iframe https://player.twitch.tv/?channel=dallas&muted=true&parent=${window.location.hostname}`,
    ],
    [
      'Dailymotion',
      dailymotion,
      'iframe https://geo.dailymotion.com/player/x8lr5.html?video=x84sh87&mute=true',
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
    ['https://x.com/jack/status/20', 'blockquote x.com'],
    [
      'https://www.instagram.com/p/DfPQchkG1tg/',
      'blockquote www.instagram.com',
    ],
    ['https://www.threads.com/t/DfQSavwEs5C', 'blockquote www.threads.com'],
    [
      'https://www.facebook.com/facebook/videos/10153231379946729/',
      'div.fb-video www.facebook.com',
    ],
    [
      'https://www.tiktok.com/@scout2015/video/6718335390845095173',
      'iframe https://www.tiktok.com/player/v1/6718335390845095173',
    ],
    [
      'https://youtu.be/jNQXAC9IVRw?t=90',
      'iframe https://www.youtube.com/embed/jNQXAC9IVRw?start=90',
    ],
    ['https://t.me/s/telegram/83', 'iframe https://t.me/telegram/83?embed=1'],
    [
      'https://www.snapchat.com/lens/61141491143',
      'iframe https://www.snapchat.com/lens/61141491143/embed',
    ],
    [
      'https://www.linkedin.com/feed/update/urn:li:activity:7527261038006697984/',
      'iframe https://www.linkedin.com/embed/feed/update/urn:li:activity:7527261038006697984',
    ],
    [
      'https://old.reddit.com/r/bulgaria/comments/1xz8iq4/comment/19st69pk12h39/',
      'iframe https://embed.reddit.com/r/bulgaria/comments/1xz8iq4/comment/19st69pk12h39/?embed=true',
    ],
    ['https://bg.pinterest.com/pin/99360735500167749/', 'a www.pinterest.com'],
    [
      'https://open.spotify.com/intl-de/playlist/37i9dQZF1DXcBWIGoYBM5M',
      'iframe https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
    ],
    [
      'https://vimeo.com/76979871/abcdef1234',
      'iframe https://player.vimeo.com/video/76979871?h=abcdef1234',
    ],
    [
      'https://clips.twitch.tv/AwkwardHelplessSalamanderSwiftRage',
      `iframe https://clips.twitch.tv/embed?clip=AwkwardHelplessSalamanderSwiftRage&parent=${window.location.hostname}`,
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

describe('SocialEmbed with Dailymotion', () => {
  // The dispatcher takes no Player ID: only embed code that carries one renders (D63).
  it('reports a URL, which carries no Player ID', () => {
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed
        url="https://www.dailymotion.com/video/x84sh87"
        onError={onError}
        lazy={false}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: a Dailymotion embed needs a Player ID: pass playerId to DailymotionEmbed',
      ),
    );
  });

  // Dailymotion answers code without a Player ID with 403, so it never reaches fallback.
  it('reports embed code without a Player ID, even with a fallback', () => {
    const onError = vi.fn();
    const fallback = vi.fn();
    const { container } = render(
      <SocialEmbed
        html={dailymotionOembed}
        fallback={fallback}
        onError={onError}
        lazy={false}
      />,
    );
    expect(fallback).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: a Dailymotion embed needs a Player ID: pass playerId to DailymotionEmbed',
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

  it('forwards maxHeight to iframe embeds only', () => {
    const video = render(
      <SocialEmbed
        url="https://youtube.com/shorts/jNQXAC9IVRw"
        maxHeight={640}
      />,
    );
    expect(
      (video.container.firstElementChild as HTMLElement).style.maxWidth,
    ).toBe('360px');

    // A script-based embed sizes itself: the prop must not reach its wrapper div.
    const post = render(
      <SocialEmbed url="https://x.com/jack/status/20" maxHeight={640} />,
    );
    const wrapper = post.container.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute('maxheight')).toBe(false);
    expect(wrapper.style.maxWidth).toBe('550px');
  });

  it('forwards height to LinkedIn and Snapchat, not to Telegram or Reddit', () => {
    const fixed = render(
      <SocialEmbed
        url="https://www.linkedin.com/feed/update/urn:li:share:7527261037016817664/"
        height={900}
      />,
    );
    expect(
      (fixed.container.firstElementChild as HTMLElement).style.height,
    ).toBe('900px');

    // Telegram sizes itself from its frame's messages, starting at 300px.
    const sized = render(
      <SocialEmbed url="https://t.me/telegram/83" height={900} />,
    );
    expect(
      (sized.container.firstElementChild as HTMLElement).style.height,
    ).toBe('300px');
  });

  it('forwards height to the wave 3 iframes', () => {
    for (const url of [
      'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
      'https://vimeo.com/76979871',
      'https://www.twitch.tv/dallas',
    ]) {
      const { container } = render(<SocialEmbed url={url} height={400} />);
      expect((container.firstElementChild as HTMLElement).style.height).toBe(
        '400px',
      );
      cleanup();
    }
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
