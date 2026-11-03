// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SocialEmbed, TikTokEmbed, YouTubeEmbed } from '../../src';
import xLink from '../fixtures/x/oembed-link.html?raw';

describe('server rendering', () => {
  it('renders the sized wrapper and placeholder, without the iframe', () => {
    const html = renderToString(
      <YouTubeEmbed url="https://youtu.be/jNQXAC9IVRw" />,
    );
    expect(html).toContain('aspect-ratio:16 / 9');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('<iframe');
  });

  it('renders the fallback content of embed code for crawlers (brief §6.3)', () => {
    const html = renderToString(<SocialEmbed html={xLink} />);
    expect(html).toContain('<blockquote class="twitter-tweet">');
    expect(html).toContain('Four more years.');
    expect(html).toContain(
      'href="https://x.com/BarackObama/status/266031293945503744?ref_src=twsrc%5Etfw"',
    );
    expect(html).not.toContain('<script');
  });

  it('renders the host fallback for unrecognised embed code', () => {
    const html = renderToString(
      <SocialEmbed
        html="<p>custom</p>"
        fallback={(code) => <div>{code}</div>}
      />,
    );
    expect(html).toBe('<div>&lt;p&gt;custom&lt;/p&gt;</div>');
  });

  it('renders nothing for an invalid URL, without throwing', () => {
    expect(renderToString(<TikTokEmbed url="not a url" />)).toBe('');
  });
});
