// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TikTokEmbed, YouTubeEmbed } from '../../src';

describe('server rendering', () => {
  it('renders the sized wrapper and placeholder, without the iframe', () => {
    const html = renderToString(
      <YouTubeEmbed url="https://youtu.be/jNQXAC9IVRw" />,
    );
    expect(html).toContain('aspect-ratio:16 / 9');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('<iframe');
  });

  it('renders nothing for an invalid URL, without throwing', () => {
    expect(renderToString(<TikTokEmbed url="not a url" />)).toBe('');
  });
});
