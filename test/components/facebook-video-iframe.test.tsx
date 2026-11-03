import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FacebookVideoIframe } from '../../src/components/facebook-video-iframe';
import { parseEmbed } from '../../src/parser';
import postIframe from '../fixtures/facebook/post-iframe.html?raw';

const video = 'https://www.facebook.com/facebook/videos/10153231379946729/';

afterEach(() => {
  cleanup();
});

describe('FacebookVideoIframe', () => {
  it('rebuilds the video iframe that came in, sized by its own width and height', () => {
    // Derived from the post iframe, as in the parser tests (docs/decisions.md D22).
    const embed = parseEmbed(
      postIframe
        .replace('/plugins/post.php', '/plugins/video.php')
        .replace(/href=[^&]+/, `href=${encodeURIComponent(video)}`),
    );
    if (!embed) throw new Error('fixture did not parse');

    const { container } = render(
      <FacebookVideoIframe embed={embed} lazy={false} />,
    );
    expect((container.firstElementChild as HTMLElement).style.aspectRatio).toBe(
      '500 / 726',
    );
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe(
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video)}&show_text=true&width=500`,
    );
    expect(iframe?.getAttribute('scrolling')).toBe('no');
    expect(iframe?.getAttribute('allow')).toBe(
      'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share',
    );
  });
});
