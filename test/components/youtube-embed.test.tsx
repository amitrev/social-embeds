import { cleanup, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { YouTubeEmbed } from '../../src';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import nocookie from '../fixtures/youtube/share-nocookie-controls-start.html?raw';
import share from '../fixtures/youtube/share.html?raw';
import { installObserver, lastObserver } from './helpers';

const URL = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

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

describe('YouTubeEmbed', () => {
  it('creates the iframe only when the wrapper comes near the viewport', () => {
    const { container } = render(<YouTubeEmbed url={URL} />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(lastObserver().options?.rootMargin).toBe('200px 0px');

    lastObserver().enter();
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe(
      'https://www.youtube.com/embed/jNQXAC9IVRw',
    );
    expect(iframe?.getAttribute('title')).toBe('YouTube video player');
    expect(iframe?.getAttribute('referrerpolicy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(iframe?.hasAttribute('allowfullscreen')).toBe(true);
  });

  it('creates the iframe right after mount when lazy is off', () => {
    const { container } = render(<YouTubeEmbed url={URL} lazy={false} />);
    expect(container.querySelector('iframe')).not.toBeNull();
  });

  it('rebuilds the share dialog code with its size and parameters', () => {
    const { container } = render(
      <YouTubeEmbed embed={parsed(share)} lazy={false} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('560 / 315');
    expect(wrapper.style.width).toBe('100%');
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.youtube.com/embed/jNQXAC9IVRw?si=zgsn8wwuM9wOXrRk',
    );
  });

  it('keeps privacy-enhanced mode, controls and start from the embed code', () => {
    const { container } = render(
      <YouTubeEmbed embed={parsed(nocookie)} lazy={false} />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?si=zgsn8wwuM9wOXrRk&controls=0&start=11',
    );
  });

  it('takes the start time from the URL and lets props override it', () => {
    const { container, rerender } = render(
      <YouTubeEmbed url={`${URL}&t=1m30s`} lazy={false} />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.youtube.com/embed/jNQXAC9IVRw?start=90',
    );

    rerender(
      <YouTubeEmbed
        url={`${URL}&t=1m30s`}
        lazy={false}
        start={5}
        autoplay
        controls={false}
        ivLoadPolicy={3}
        nocookie
      />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?start=5&autoplay=1&controls=0&iv_load_policy=3',
    );
  });

  it('uses 16:9 without a size, and 9:16 for Shorts', () => {
    const { container, rerender } = render(<YouTubeEmbed url={URL} />);
    expect((container.firstElementChild as HTMLElement).style.aspectRatio).toBe(
      '16 / 9',
    );
    rerender(<YouTubeEmbed url="https://youtube.com/shorts/jNQXAC9IVRw" />);
    expect((container.firstElementChild as HTMLElement).style.aspectRatio).toBe(
      '9 / 16',
    );
  });

  it('uses a fixed height instead of the aspect ratio when given one', () => {
    const { container } = render(<YouTubeEmbed url={URL} height={400} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe('400px');
    expect(wrapper.style.aspectRatio).toBe('');
  });

  it('narrows a vertical video so it is at most maxHeight tall', () => {
    const { container } = render(
      <YouTubeEmbed
        url="https://youtube.com/shorts/jNQXAC9IVRw"
        maxHeight={640}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('9 / 16');
    expect(wrapper.style.maxWidth).toBe('360px');
    expect(wrapper.hasAttribute('maxheight')).toBe(false);
  });

  it('keeps a maxWidth that already makes the embed shorter than maxHeight', () => {
    // 16:9 at 964px is 542px tall.
    const { container } = render(
      <YouTubeEmbed url={URL} maxWidth={964} maxHeight={640} />,
    );
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe(
      '964px',
    );
  });

  it('limits a fixed height to maxHeight', () => {
    const { container } = render(
      <YouTubeEmbed url={URL} height={800} maxHeight={640} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe('800px');
    expect(wrapper.style.maxHeight).toBe('640px');
  });

  it('shows the placeholder until the iframe loads, and calls onLoad once', () => {
    const onLoad = vi.fn();
    const { container, queryByText } = render(
      <YouTubeEmbed
        url={URL}
        lazy={false}
        placeholder={<span>Loading video</span>}
        onLoad={onLoad}
      />,
    );
    expect(queryByText('Loading video')).not.toBeNull();

    const iframe = container.querySelector('iframe');
    if (!iframe) throw new Error('no iframe');
    fireEvent.load(iframe);
    fireEvent.load(iframe);
    expect(queryByText('Loading video')).toBeNull();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('shows a neutral skeleton by default', () => {
    const { container } = render(<YouTubeEmbed url={URL} />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('forwards wrapper props, merges style and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <YouTubeEmbed
        url={URL}
        ref={ref}
        className="video"
        data-testid="wrapper"
        maxWidth={640}
        style={{ width: '80%', margin: 8 }}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(wrapper);
    expect(wrapper.className).toBe('video');
    expect(wrapper.dataset.testid).toBe('wrapper');
    expect(wrapper.style.maxWidth).toBe('640px');
    expect(wrapper.style.width).toBe('80%');
    expect(wrapper.style.margin).toBe('8px');
  });

  it('renders nothing and reports an invalid URL once', () => {
    const onError = vi.fn();
    const { container, rerender } = render(
      <YouTubeEmbed url="https://example.com/video" onError={onError} />,
    );
    rerender(
      <YouTubeEmbed url="https://example.com/video" onError={onError} />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: not a YouTube post URL: https://example.com/video',
      ),
    );
  });

  it('reports an embed of another platform', () => {
    const onError = vi.fn();
    const embed = parsed(
      '<iframe height="578" width="325" src="https://www.tiktok.com/player/v1/1"></iframe>',
    );
    render(<YouTubeEmbed embed={embed} onError={onError} />);
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: expected a YouTube embed, got TikTok'),
    );
  });
});
