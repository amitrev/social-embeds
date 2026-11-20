import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AppleMusicEmbed,
  ApplePodcastsEmbed,
  GiphyEmbed,
  KickEmbed,
  SoundCloudEmbed,
} from '../../src';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import appleAlbum from '../fixtures/applemusic/share-album.html?raw';
import appleSong from '../fixtures/applemusic/share-song.html?raw';
import podcastEpisode from '../fixtures/applepodcasts/share-episode.html?raw';
import giphyFixed from '../fixtures/giphy/embed-fixed.html?raw';
import kickChannel from '../fixtures/kick/player-channel.html?raw';
import soundcloudClassic from '../fixtures/soundcloud/share-classic.html?raw';
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

const APPLE_SANDBOX =
  'allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation';

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  cleanup();
});

describe('SoundCloudEmbed', () => {
  it('renders a URL as the visual player, 400px high', () => {
    const { container } = render(
      <SoundCloudEmbed
        url="https://soundcloud.com/forss/flickermood"
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fforss%2Fflickermood&visual=true',
    );
    expect(iframe.getAttribute('allow')).toBe('autoplay; encrypted-media');
    expect(wrapper.style.height).toBe('400px');
  });

  it('renders embed code with its own layout and height', () => {
    const { container } = render(
      <SoundCloudEmbed embed={parsed(soundcloudClassic)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F293&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true',
    );
    expect(wrapper.style.height).toBe('166px');
  });

  it('passes a private track’s secret token inside the url', () => {
    const embed = parseEmbed(
      soundcloudClassic.replace(
        'soundcloud%253Atracks%253A293',
        '293%3Fsecret_token%3Ds-AbC12',
      ),
    ) as ParsedEmbed;
    const { container } = render(
      <SoundCloudEmbed embed={embed} lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('src')).toContain(
      'url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F293%3Fsecret_token%3Ds-AbC12&',
    );
  });

  it('lets props override the options and the height', () => {
    const { container } = render(
      <SoundCloudEmbed
        url="https://soundcloud.com/forss/flickermood"
        visual={false}
        color="#000000"
        autoPlay
        hideRelated
        height={166}
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fforss%2Fflickermood&visual=false&color=%23000000&auto_play=true&hide_related=true',
    );
    expect(wrapper.style.height).toBe('166px');
  });

  it('keeps the verified sound when options name another url', () => {
    const embed = parsed(soundcloudClassic);
    const { container } = render(
      <SoundCloudEmbed
        embed={{
          ...embed,
          options: { ...embed.options, url: 'https://evil.example/' },
        }}
        lazy={false}
      />,
    );
    const src = parts(container).iframe.getAttribute('src') ?? '';
    expect(src).toContain(
      'url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F293',
    );
    expect(src).not.toContain('evil');
  });

  it('drops content keys in any letter case', () => {
    const embed = parsed(soundcloudClassic);
    const { container } = render(
      <SoundCloudEmbed
        embed={{
          ...embed,
          options: { URL: 'https://evil.example/', Secret_Token: 's-x' },
        }}
        lazy={false}
      />,
    );
    const src = parts(container).iframe.getAttribute('src') ?? '';
    expect(src).not.toContain('evil');
    expect(src).not.toMatch(/secret_token/i);
  });
});

describe('AppleMusicEmbed', () => {
  it('renders an album URL at 450px with Apple’s sandbox', () => {
    const { container } = render(
      <AppleMusicEmbed
        url="https://music.apple.com/us/album/birds-of-oaks-bottom-piano-solos/1357820591"
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://embed.music.apple.com/us/album/1357820591',
    );
    expect(iframe.getAttribute('sandbox')).toBe(APPLE_SANDBOX);
    expect(iframe.getAttribute('allow')).toBe(
      'autoplay *; encrypted-media *; fullscreen *; clipboard-write',
    );
    expect(wrapper.style.height).toBe('450px');
    expect(wrapper.style.maxWidth).toBe('660px');
    expect(wrapper.style.borderRadius).toBe('10px');
  });

  it('renders a song on its album at 175px', () => {
    const { container } = render(
      <AppleMusicEmbed
        url="https://music.apple.com/us/album/great-blue-heron/1357820591?i=1357820597"
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://embed.music.apple.com/us/album/1357820591?i=1357820597',
    );
    expect(wrapper.style.height).toBe('175px');
  });

  it('keeps the embed code height, and a height prop over it', () => {
    expect(
      parts(
        render(<AppleMusicEmbed embed={parsed(appleSong)} lazy={false} />)
          .container,
      ).wrapper.style.height,
    ).toBe('175px');
    cleanup();
    expect(
      parts(
        render(
          <AppleMusicEmbed
            embed={parsed(appleAlbum)}
            height={300}
            lazy={false}
          />,
        ).container,
      ).wrapper.style.height,
    ).toBe('300px');
  });

  it('keeps the verified song when options name another', () => {
    const embed = parsed(appleAlbum);
    const { container } = render(
      <AppleMusicEmbed
        embed={{ ...embed, options: { i: '1', path: '/evil' } }}
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://embed.music.apple.com/us/album/1357820591',
    );
  });

  it('never takes the sandbox from the embed code', () => {
    const embed = parsed(
      appleAlbum.replace(/sandbox="[^"]*"/, 'sandbox="allow-top-navigation"'),
    );
    const { container } = render(
      <AppleMusicEmbed embed={embed} lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('sandbox')).toBe(APPLE_SANDBOX);
  });
});

describe('ApplePodcastsEmbed', () => {
  it('renders an episode from embed code at 160px', () => {
    const { container } = render(
      <ApplePodcastsEmbed embed={parsed(podcastEpisode)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://embed.podcasts.apple.com/us/podcast/id1200361736?i=1000802907981',
    );
    expect(iframe.getAttribute('sandbox')).toBe(APPLE_SANDBOX);
    expect(wrapper.style.height).toBe('160px');
    expect(wrapper.style.maxWidth).toBe('640px');
  });

  it('renders a show URL at 450px and an episode URL at 160px', () => {
    expect(
      parts(
        render(
          <ApplePodcastsEmbed
            url="https://podcasts.apple.com/us/podcast/the-daily/id1200361736"
            lazy={false}
          />,
        ).container,
      ).wrapper.style.height,
    ).toBe('450px');
    cleanup();
    expect(
      parts(
        render(
          <ApplePodcastsEmbed
            url="https://podcasts.apple.com/us/podcast/x/id1200361736?i=1000802907981"
            lazy={false}
          />,
        ).container,
      ).wrapper.style.height,
    ).toBe('160px');
  });
});

describe('KickEmbed', () => {
  it('renders a channel URL at 16:9', () => {
    const { container } = render(
      <KickEmbed url="https://kick.com/kick" lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe('https://player.kick.com/kick');
    expect(iframe.getAttribute('allow')).toBe('autoplay; fullscreen');
    expect(wrapper.style.aspectRatio).toBe('16 / 9');
  });

  it('passes autoplay and muted, props over the embed code', () => {
    const embed = parsed(
      kickChannel.replace('/kick"', '/kick?autoplay=true&muted=false"'),
    );
    const { container } = render(
      <KickEmbed embed={embed} muted lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://player.kick.com/kick?autoplay=true&muted=true',
    );
  });

  it('keeps the verified channel when options name another', () => {
    const embed = parsed(kickChannel);
    const { container } = render(
      <KickEmbed
        embed={{ ...embed, options: { channel: 'other', video: '1' } }}
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://player.kick.com/kick',
    );
  });

  it('narrows to a maxHeight', () => {
    const { container } = render(
      <KickEmbed url="https://kick.com/kick" maxHeight={360} lazy={false} />,
    );
    expect(parts(container).wrapper.style.maxWidth).toBe('640px');
  });
});

describe('GiphyEmbed', () => {
  it('renders a URL at 1:1', () => {
    const { container } = render(
      <GiphyEmbed
        url="https://giphy.com/gifs/originals-animation-kitten-logo-l41YlHs99JsSptZf2"
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://giphy.com/embed/l41YlHs99JsSptZf2',
    );
    expect(wrapper.style.aspectRatio).toBe('1 / 1');
  });

  it('renders embed code at its size, without the credit', () => {
    const { container } = render(
      <GiphyEmbed embed={parsed(giphyFixed)} lazy={false} />,
    );
    expect(parts(container).wrapper.style.aspectRatio).toBe('480 / 269');
    expect(container.textContent).not.toContain('via GIPHY');
  });
});
