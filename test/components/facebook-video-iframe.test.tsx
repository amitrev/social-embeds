import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FacebookVideoIframe } from '../../src/components/facebook-video-iframe';
import { parseEmbed } from '../../src/parser';
import videoIframe from '../fixtures/facebook/video-iframe-reel.html?raw';

const reel = 'https://www.facebook.com/reel/1709746083847442';

afterEach(() => {
  cleanup();
});

describe('FacebookVideoIframe', () => {
  it('rebuilds the video iframe that came in, sized by its own width and height', () => {
    // Derived: the Embed dialog's code without the post text.
    const embed = parseEmbed(
      videoIframe
        .replace('show_text=true', 'show_text=false')
        .replace('height="591"', 'height="476"'),
    );
    if (!embed) throw new Error('fixture did not parse');

    const { container } = render(
      <FacebookVideoIframe embed={embed} lazy={false} />,
    );
    expect((container.firstElementChild as HTMLElement).style.aspectRatio).toBe(
      '267 / 476',
    );
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe(
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(reel)}&height=476&show_text=false&width=267&t=0`,
    );
    expect(iframe?.getAttribute('scrolling')).toBe('no');
    expect(iframe?.getAttribute('allow')).toBe(
      'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share',
    );
  });
});
