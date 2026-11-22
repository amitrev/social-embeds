import { act, cleanup, render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as components from '../../src';
import { FacebookVideoIframe } from '../../src/components/facebook-video-iframe';
import { FRAME_TIMEOUT_MS } from '../../src/core/timing';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import bluesky from '../fixtures/bluesky/oembed.html?raw';
import dailymotion from '../fixtures/dailymotion/player-id-docs.html?raw';
import facebookReel from '../fixtures/facebook/video-iframe-reel.html?raw';
import maps from '../fixtures/generic/google-maps-embed.html?raw';
import {
  FakeIntersectionObserver,
  installObserver,
  installResizeObserver,
  lastObserver,
} from './helpers';

type Source = { url: string } | { html: string };

// Derived: the Embed dialog's code without the post text, which renders as the plain iframe.
const facebookVideo = facebookReel
  .replace('show_text=true', 'show_text=false')
  .replace('height="591"', 'height="476"');

const { SocialEmbed } = components;

const FRAMES: [string, Source, string][] = [
  [
    'TikTokEmbed',
    { url: 'https://www.tiktok.com/@tiktok/video/7704834703446117662' },
    'TikTok video player did not load',
  ],
  [
    'YouTubeEmbed',
    { url: 'https://youtu.be/jNQXAC9IVRw' },
    'YouTube video player did not load',
  ],
  [
    'VimeoEmbed',
    { url: 'https://vimeo.com/76979871' },
    'Vimeo video player did not load',
  ],
  [
    'SpotifyEmbed',
    { url: 'https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS' },
    'Spotify Embed did not load',
  ],
  [
    'TwitchEmbed',
    { url: 'https://www.twitch.tv/twitch' },
    'Twitch player did not load',
  ],
  [
    'DailymotionEmbed',
    { html: dailymotion },
    'Dailymotion video player did not load',
  ],
  [
    'LinkedInEmbed',
    {
      url: 'https://www.linkedin.com/feed/update/urn:li:share:7528828146767409153/',
    },
    'LinkedIn post did not load',
  ],
  [
    'SnapchatEmbed',
    { url: 'https://www.snapchat.com/add/teamsnapchat' },
    'Snapchat did not load',
  ],
  [
    'FacebookEmbed',
    { html: facebookVideo },
    'Facebook video player did not load',
  ],
  [
    'RedditEmbed',
    { url: 'https://www.reddit.com/r/reddit/comments/11zso11/' },
    'Reddit post did not report its height',
  ],
  [
    'TelegramEmbed',
    { url: 'https://t.me/telegram/83' },
    'Telegram post did not report its height',
  ],
  [
    'SoundCloudEmbed',
    { url: 'https://soundcloud.com/forss/flickermood' },
    'SoundCloud player did not load',
  ],
  [
    'AppleMusicEmbed',
    {
      url: 'https://music.apple.com/us/album/birds-of-oaks-bottom-piano-solos/1357820591',
    },
    'Apple Music player did not load',
  ],
  [
    'ApplePodcastsEmbed',
    {
      url: 'https://podcasts.apple.com/us/podcast/monument-valley-meet-the-developer/id947965068',
    },
    'Apple Podcasts player did not load',
  ],
  ['BlueskyEmbed', { html: bluesky }, 'Bluesky post did not report its height'],
  [
    'TumblrEmbed',
    { url: 'https://staff.tumblr.com/post/828009069026721792' },
    'Tumblr post did not report its height',
  ],
  ['KickEmbed', { url: 'https://kick.com/kick' }, 'Kick player did not load'],
  [
    'GiphyEmbed',
    {
      url: 'https://giphy.com/gifs/originals-animation-kitten-logo-l41YlHs99JsSptZf2',
    },
    'Giphy GIF did not load',
  ],
  [
    'TenorEmbed',
    { url: 'https://tenor.com/view/hello-wave-gif-12345' },
    'Tenor GIF did not load',
  ],
  [
    'StreamableEmbed',
    { url: 'https://streamable.com/abc123' },
    'Streamable video did not load',
  ],
  [
    'RumbleEmbed',
    { url: 'https://rumble.com/embed/v12onr1/' },
    'Rumble video did not load',
  ],
  [
    'TruthSocialEmbed',
    { url: 'https://truthsocial.com/@truthsocial/posts/108318911610590772' },
    'Truth Social post did not report its height',
  ],
  [
    'ImgurEmbed',
    { url: 'https://imgur.com/gallery/its-imgurs-16th-birthday-week-04b1CmA' },
    'Imgur post did not report its height',
  ],
  [
    'StravaEmbed',
    { url: 'https://www.strava.com/activities/123456' },
    'Strava activity did not report its height',
  ],
  [
    'FlickrEmbed',
    { url: 'https://flic.kr/p/2sJNueC' },
    'Flickr photo did not load',
  ],
  ['GenericIframeEmbed', { html: maps }, 'Embedded content did not load'],
];

const SCRIPT_ONLY = [
  'InstagramEmbed',
  'PinterestEmbed',
  'SocialEmbed',
  'ThreadsEmbed',
  'XEmbed',
];

function parsed(html: string): ParsedEmbed {
  const embed = parseEmbed(html);
  if (!embed) throw new Error('fixture did not parse');
  return embed;
}

function componentProps(name: string, source: Source) {
  if ('url' in source) return source;
  return name === 'GenericIframeEmbed'
    ? source
    : { embed: parsed(source.html) };
}

function timeOut() {
  for (const observer of FakeIntersectionObserver.instances) observer.enter();
  act(() => {
    vi.advanceTimersByTime(FRAME_TIMEOUT_MS);
  });
}

beforeEach(() => {
  installObserver();
  installResizeObserver(600);
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('iframe embeds that never load', () => {
  it('cover every exported embed component without a platform script', () => {
    const names = Object.keys(components).filter(
      (name) => /^[A-Z]\w*Embed$/.test(name) && !SCRIPT_ONLY.includes(name),
    );
    expect(FRAMES.map(([name]) => name).sort()).toEqual(names.sort());
  });

  it.each(FRAMES)(
    '%s reports the timeout to onError',
    (name, source, message) => {
      const Component = components[
        name as keyof typeof components
      ] as ComponentType<Record<string, unknown>>;
      const onError = vi.fn();
      const { container } = render(
        <Component {...componentProps(name, source)} onError={onError} />,
      );
      expect(container.innerHTML).not.toBe('');
      timeOut();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        new Error(`social-embeds: ${message}`),
      );
    },
  );

  it.each(FRAMES)(
    '%s reports the timeout through SocialEmbed',
    (_, source, message) => {
      const onError = vi.fn();
      render(<SocialEmbed {...source} onError={onError} />);
      timeOut();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        new Error(`social-embeds: ${message}`),
      );
    },
  );

  it('FacebookVideoIframe reports the timeout to onError', () => {
    const onError = vi.fn();
    render(
      <FacebookVideoIframe embed={parsed(facebookVideo)} onError={onError} />,
    );
    timeOut();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: Facebook video player did not load'),
    );
  });
});

describe('a new post in a mounted iframe embed', () => {
  const telegram = (url: string) => (
    <SocialEmbed url={url} placeholder={<p data-testid="placeholder" />} />
  );

  it('starts over at the start height with a new frame', () => {
    const view = render(telegram('https://t.me/telegram/83'));
    lastObserver().enter();
    const wrapper = () => view.container.firstElementChild as HTMLElement;
    const first = view.container.querySelector('iframe') as HTMLIFrameElement;
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: '{"event":"resize","height":900}',
          origin: 'https://t.me',
          source: first.contentWindow,
        }),
      );
    });
    expect(wrapper().style.height).toBe('900px');

    view.rerender(telegram('https://t.me/telegram/84'));
    lastObserver().enter();
    const second = view.container.querySelector('iframe');
    expect(second).not.toBe(first);
    expect(second?.getAttribute('src')).toBe(
      'https://t.me/telegram/84?embed=1',
    );
    expect(wrapper().style.height).toBe('300px');
    expect(view.getByTestId('placeholder')).toBeTruthy();
  });
});
