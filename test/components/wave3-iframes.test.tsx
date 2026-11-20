import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DailymotionEmbed,
  SpotifyEmbed,
  TwitchEmbed,
  VimeoEmbed,
} from '../../src';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import dailymotionOembed from '../fixtures/dailymotion/oembed.html?raw';
import dailymotionPlayer from '../fixtures/dailymotion/player-id-docs.html?raw';
import spotifyShowVideo from '../fixtures/spotify/oembed-show-video.html?raw';
import spotifyTrack from '../fixtures/spotify/oembed-track.html?raw';
import twitchChannel from '../fixtures/twitch/docs-channel.html?raw';
import twitchVideo from '../fixtures/twitch/docs-video.html?raw';
import vimeoResponsive from '../fixtures/vimeo/responsive-docs.html?raw';
import { installObserver } from './helpers';

function parsed(html: string): ParsedEmbed {
  const embed = parseEmbed(html);
  if (!embed) throw new Error('fixture did not parse');
  return embed;
}

function parts(container: HTMLElement) {
  return {
    wrapper: container.firstElementChild as HTMLElement,
    iframe: container.querySelector('iframe') as HTMLIFrameElement,
  };
}

const host = () => window.location.hostname;

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SpotifyEmbed', () => {
  it('renders a track URL as the compact player, 152px high', () => {
    const { container } = render(
      <SpotifyEmbed
        url="https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS?si=abc"
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://open.spotify.com/embed/track/0LrHzQHk5gYGbMsoVbKDuS',
    );
    expect(iframe.getAttribute('title')).toBe('Spotify Embed');
    expect(iframe.getAttribute('allow')).toBe(
      'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
    );
    expect(wrapper.style.height).toBe('152px');
    expect(wrapper.style.aspectRatio).toBe('');
    expect(wrapper.style.borderRadius).toBe('12px');
  });

  it('gives a playlist, album or artist URL the full player, 352px high', () => {
    for (const path of [
      'playlist/37i9dQZF1DX4sWSpwq3LiO',
      'album/4aawyAB9vmqN3uQ7FjRGTy',
      'artist/0gxyHStUsqpMadRV0Di1Qt',
    ]) {
      const { container } = render(
        <SpotifyEmbed url={`https://open.spotify.com/${path}`} lazy={false} />,
      );
      expect(parts(container).wrapper.style.height).toBe('352px');
      cleanup();
    }
  });

  it('keeps the embed code height and a height prop over it', () => {
    const { container } = render(
      <SpotifyEmbed embed={parsed(spotifyTrack)} lazy={false} />,
    );
    expect(parts(container).wrapper.style.height).toBe('152px');
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://open.spotify.com/embed/track/0LrHzQHk5gYGbMsoVbKDuS',
    );
    cleanup();

    const second = render(
      <SpotifyEmbed embed={parsed(spotifyTrack)} height={352} lazy={false} />,
    );
    expect(parts(second.container).wrapper.style.height).toBe('352px');
  });

  it('renders a video show at its aspect ratio', () => {
    const { container } = render(
      <SpotifyEmbed embed={parsed(spotifyShowVideo)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://open.spotify.com/embed/show/4OsuS4G6ukepPsjme51uFt/video',
    );
    expect(wrapper.style.aspectRatio).toBe('624 / 351');
    expect(wrapper.style.height).toBe('');
  });

  it('passes the dark theme', () => {
    const { container } = render(
      <SpotifyEmbed
        url="https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS"
        theme={0}
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://open.spotify.com/embed/track/0LrHzQHk5gYGbMsoVbKDuS?theme=0',
    );
  });

  it('lets the style prop replace the rounded corners', () => {
    const { container } = render(
      <SpotifyEmbed
        url="https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS"
        style={{ borderRadius: 0 }}
        lazy={false}
      />,
    );
    expect(parts(container).wrapper.style.borderRadius).toBe('0px');
  });
});

describe('VimeoEmbed', () => {
  it('renders a video URL at 16:9', () => {
    const { container } = render(
      <VimeoEmbed url="https://vimeo.com/76979871" lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://player.vimeo.com/video/76979871',
    );
    expect(iframe.getAttribute('title')).toBe('Vimeo video player');
    expect(iframe.getAttribute('referrerpolicy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(wrapper.style.aspectRatio).toBe('16 / 9');
  });

  it('keeps an unlisted video hash and the start time', () => {
    const { container } = render(
      <VimeoEmbed
        url="https://vimeo.com/76979871/abcdef1234#t=1m2s"
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://player.vimeo.com/video/76979871?h=abcdef1234#t=1m2s',
    );
  });

  it('renders the responsive snippet with its options and ratio', () => {
    const { container } = render(
      <VimeoEmbed embed={parsed(vimeoResponsive)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://player.vimeo.com/video/76979871?badge=0&autopause=0',
    );
    expect(wrapper.style.aspectRatio).toBe('16 / 9');
  });

  it('lets props override the embed code options', () => {
    const { container } = render(
      <VimeoEmbed
        embed={parsed(vimeoResponsive)}
        autopause
        muted
        title={false}
        color="ff0000"
        t={30}
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://player.vimeo.com/video/76979871?badge=0&autopause=1&color=ff0000&muted=1&title=0#t=30',
    );
  });
});

describe('TwitchEmbed', () => {
  it('names the page host as parent for a channel URL', () => {
    const { container } = render(
      <TwitchEmbed url="https://www.twitch.tv/Twitch" lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      `https://player.twitch.tv/?channel=twitch&parent=${host()}`,
    );
    expect(iframe.getAttribute('title')).toBe('Twitch player');
    expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
    expect(wrapper.style.aspectRatio).toBe('16 / 9');
  });

  it('replaces the embed code parent with the page host', () => {
    const { container } = render(
      <TwitchEmbed embed={parsed(twitchChannel)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      `https://player.twitch.tv/?channel=twitch&muted=true&parent=${host()}`,
    );
    expect(wrapper.style.aspectRatio).toBe('1280 / 720');
  });

  it('renders a past broadcast with its start time and autoplay', () => {
    const { container } = render(
      <TwitchEmbed embed={parsed(twitchVideo)} time="1h2m3s" lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      `https://player.twitch.tv/?video=v1816688726&autoplay=false&time=1h2m3s&parent=${host()}`,
    );
  });

  it('renders a collection and a clip', () => {
    const { container } = render(
      <TwitchEmbed
        url="https://www.twitch.tv/collections/ryMlWIJaBxf2aQ"
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      `https://player.twitch.tv/?collection=ryMlWIJaBxf2aQ&parent=${host()}`,
    );
    cleanup();

    const clip = render(
      <TwitchEmbed
        url="https://www.twitch.tv/twitch/clip/LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu"
        autoplay
        muted={false}
        lazy={false}
      />,
    );
    expect(parts(clip.container).iframe.getAttribute('src')).toBe(
      `https://clips.twitch.tv/embed?clip=LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu&autoplay=true&muted=false&parent=${host()}`,
    );
  });
});

describe('DailymotionEmbed', () => {
  it('renders embed code that carries a Player ID', () => {
    const { container } = render(
      <DailymotionEmbed embed={parsed(dailymotionPlayer)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://geo.dailymotion.com/player/x8lr5.html?video=x84sh87&mute=true',
    );
    expect(iframe.getAttribute('title')).toBe('Dailymotion video player');
    expect(iframe.getAttribute('allow')).toBe(
      'autoplay; fullscreen; picture-in-picture; web-share',
    );
    expect(wrapper.style.aspectRatio).toBe('16 / 9');
  });

  it('reports a URL without a Player ID and renders nothing', () => {
    const onError = vi.fn();
    const { container } = render(
      <DailymotionEmbed
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

  it('renders a URL and code without a Player ID with the playerId prop', () => {
    const { container } = render(
      <DailymotionEmbed
        url="https://dai.ly/x84sh87"
        playerId="x8lr5"
        mute
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://geo.dailymotion.com/player/x8lr5.html?video=x84sh87&mute=true',
    );
    cleanup();

    const code = render(
      <DailymotionEmbed
        embed={parsed(dailymotionOembed)}
        playerId="x8lr5"
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(code.container);
    expect(iframe.getAttribute('src')).toBe(
      'https://geo.dailymotion.com/player/x8lr5.html?video=x84qh50',
    );
    expect(wrapper.style.aspectRatio).toBe('480 / 269');
  });

  it('prefers the playerId prop to the embed code Player ID', () => {
    const { container } = render(
      <DailymotionEmbed
        embed={parsed(dailymotionPlayer)}
        playerId="xabc1"
        startTime={42}
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://geo.dailymotion.com/player/xabc1.html?video=x84sh87&mute=true&startTime=42',
    );
  });

  it('reports a malformed playerId and renders nothing', () => {
    const onError = vi.fn();
    const { container } = render(
      <DailymotionEmbed
        url="https://dai.ly/x84sh87"
        playerId="../x8lr5"
        onError={onError}
        lazy={false}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: not a Dailymotion Player ID: ../x8lr5'),
    );
  });
});

// Security: options are not verified, so they must not replace the verified content (D68).
describe('a host-built embed whose options name other content', () => {
  it('keeps the verified Twitch channel and drops every parent', () => {
    const embed = {
      ...parsed(twitchChannel),
      options: {
        channel: 'other',
        video: 'v1',
        clip: 'x',
        parent: 'evil.test',
      },
    };
    const { container } = render(<TwitchEmbed embed={embed} lazy={false} />);
    expect(parts(container).iframe.getAttribute('src')).toBe(
      `https://player.twitch.tv/?channel=twitch&parent=${host()}`,
    );
  });

  it('keeps the verified Dailymotion video', () => {
    const embed = {
      ...parsed(dailymotionPlayer),
      options: { video: 'xevil1', playlist: 'x1', mute: true },
    };
    const { container } = render(
      <DailymotionEmbed embed={embed} playerId="x8lr5" lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://geo.dailymotion.com/player/x8lr5.html?video=x84sh87&mute=true',
    );
  });

  it('keeps the verified Vimeo hash', () => {
    const embed = {
      ...parsed(vimeoResponsive),
      url: 'https://vimeo.com/76979871/abcdef1234',
      options: { h: '0000000000' },
    };
    const { container } = render(<VimeoEmbed embed={embed} lazy={false} />);
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://player.vimeo.com/video/76979871?h=abcdef1234',
    );
  });
});
