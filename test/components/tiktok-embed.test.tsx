import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TikTokEmbed } from '../../src';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import player from '../fixtures/tiktok/oembed-player.html?raw';
import { installObserver } from './helpers';

const URL = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';

function parsed(html: string): ParsedEmbed {
  const embed = parseEmbed(html);
  if (!embed) throw new Error('fixture did not parse');
  return embed;
}

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TikTokEmbed', () => {
  it('renders the Embed Player for a post URL, 9:16 and at most 325px wide', () => {
    const { container } = render(<TikTokEmbed url={URL} lazy={false} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('9 / 16');
    expect(wrapper.style.maxWidth).toBe('325px');
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe(
      'https://www.tiktok.com/player/v1/6718335390845095173',
    );
    expect(iframe?.getAttribute('title')).toBe('TikTok video player');
  });

  it('rebuilds the oEmbed player code with its size and parameters', () => {
    const { container } = render(
      <TikTokEmbed embed={parsed(player)} lazy={false} />,
    );
    expect((container.firstElementChild as HTMLElement).style.aspectRatio).toBe(
      '325 / 578',
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.tiktok.com/player/v1/6718335390845095173?embed_from=oembed&music_info=1&description=1&autoplay=1&muted=1',
    );
  });

  it('lets props override embed code parameters', () => {
    const { container } = render(
      <TikTokEmbed
        embed={parsed(player)}
        lazy={false}
        musicInfo={false}
        progressBar={false}
        maxWidth={400}
      />,
    );
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe(
      '400px',
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.tiktok.com/player/v1/6718335390845095173?embed_from=oembed&music_info=0&description=1&autoplay=1&muted=1&progress_bar=0',
    );
  });

  it('renders legacy blockquote embed code through the player', () => {
    const embed = parsed(
      `<blockquote class="tiktok-embed" cite="${URL}" data-video-id="6718335390845095173"><section></section></blockquote>`,
    );
    const { container } = render(<TikTokEmbed embed={embed} lazy={false} />);
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.tiktok.com/player/v1/6718335390845095173',
    );
  });

  it('reports a short link, which cannot be resolved', () => {
    const onError = vi.fn();
    const { container } = render(
      <TikTokEmbed url="https://vm.tiktok.com/ZMabcdef/" onError={onError} />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: not a TikTok post URL: https://vm.tiktok.com/ZMabcdef/',
      ),
    );
  });
});
