// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SocialEmbed, TikTokEmbed, YouTubeEmbed } from '../../src';
import flickrDialog from '../fixtures/flickr/embed-dialog.html?raw';
import imgurAlbum from '../fixtures/imgur/embed-dialog-album.html?raw';
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

  it('renders the fallback content of embed code for crawlers', () => {
    const html = renderToString(<SocialEmbed html={xLink} />);
    // The class is added on the client when the post renders (docs/decisions.md D39).
    expect(html).toContain(
      '<blockquote><p lang="en" dir="ltr">Introducing a new era for the Twitter Developer Platform!',
    );
    expect(html).toContain(
      'href="https://x.com/XDevelopers/status/1460323737035677698?ref_src=twsrc%5Etfw"',
    );
    expect(html).not.toContain('<script');
  });

  it('renders the linked image of Flickr embed code, sized at its ratio', () => {
    const html = renderToString(<SocialEmbed html={flickrDialog} />);
    expect(html).toContain('aspect-ratio:4096 / 2301');
    expect(html).toContain(
      '<a href="https://www.flickr.com/photos/flickr/55618331478/"><img style="display:block;width:100%;height:100%;object-fit:cover" src="https://live.staticflickr.com/65535/55618331478_aa284e58b6_4k.jpg"',
    );
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<script');
  });

  it('renders the title link of Imgur embed code', () => {
    const html = renderToString(<SocialEmbed html={imgurAlbum} />);
    expect(html).toContain(
      '<blockquote><a href="https://imgur.com/a/04b1CmA">It&#39;s Imgur&#39;s 16th Birthday Week!',
    );
    expect(html).not.toContain('<iframe');
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
