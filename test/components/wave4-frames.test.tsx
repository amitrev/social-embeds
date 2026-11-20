import { act, cleanup, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlueskyEmbed, TumblrEmbed } from '../../src';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import bluesky from '../fixtures/bluesky/oembed.html?raw';
import tumblr from '../fixtures/tumblr/oembed.html?raw';
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

function post(iframe: HTMLIFrameElement, origin: string, data: unknown) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data,
        origin,
        source: iframe.contentWindow,
      }),
    );
  });
}

const DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  cleanup();
});

describe('BlueskyEmbed', () => {
  it('builds the frame from the AT URI and takes its height from the frame', () => {
    const { container } = render(
      <BlueskyEmbed embed={parsed(bluesky)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      `https://embed.bsky.app/embed/${DID}/app.bsky.feed.post/3mxu3hsnebc2v`,
    );
    expect(wrapper.style.maxWidth).toBe('600px');
    post(iframe, 'https://embed.bsky.app', { height: 682.27, id: null });
    expect(wrapper.style.height).toBe('683px');
  });

  it('ignores heights from another origin', () => {
    const { container } = render(
      <BlueskyEmbed embed={parsed(bluesky)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    const before = wrapper.style.height;
    post(iframe, 'https://example.com', { height: 900 });
    expect(wrapper.style.height).toBe(before);
  });

  it('passes the colour mode, the prop over the embed code', () => {
    const embed = parsed(
      bluesky.replace(
        'data-bluesky-cid=',
        'data-bluesky-embed-color-mode="dark" data-bluesky-cid=',
      ),
    );
    const { container } = render(
      <BlueskyEmbed embed={embed} colorMode="light" lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      `https://embed.bsky.app/embed/${DID}/app.bsky.feed.post/3mxu3hsnebc2v?colorMode=light`,
    );
  });

  it('renders a DID URL', () => {
    const { container } = render(
      <BlueskyEmbed
        url={`https://bsky.app/profile/${DID}/post/3mxu3hsnebc2v`}
        lazy={false}
      />,
    );
    expect(parts(container).iframe).not.toBeNull();
  });

  it('reports a handle URL as needing a lookup and renders nothing', () => {
    const onError = vi.fn();
    const { container } = render(
      <BlueskyEmbed
        url="https://bsky.app/profile/bsky.app/post/3mxu3hsnebc2v"
        onError={onError}
        lazy={false}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: a Bluesky URL needs a lookup: use the embed code',
      ),
    );
  });

  it('renders the post text on the server, without the frame', () => {
    const html = renderToString(<BlueskyEmbed embed={parsed(bluesky)} />);
    expect(html).toContain('saw some cool clouds today');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<script');
  });
});

describe('TumblrEmbed', () => {
  it('builds the frame from the blog name and takes its height from the frame', () => {
    const { container } = render(
      <TumblrEmbed embed={parsed(tumblr)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://embed.tumblr.com/embed/post/staff/828009069026721792/v2',
    );
    expect(wrapper.style.maxWidth).toBe('540px');
    post(
      iframe,
      'https://embed.tumblr.com',
      '{"method":"tumblr-post:sizeChange","args":[768]}',
    );
    expect(wrapper.style.height).toBe('768px');
  });

  it('renders a post URL', () => {
    const { container } = render(
      <TumblrEmbed
        url="https://staff.tumblr.com/post/828009069026721792"
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://embed.tumblr.com/embed/post/staff/828009069026721792/v2',
    );
  });

  it('ignores other Tumblr messages', () => {
    const { container } = render(
      <TumblrEmbed embed={parsed(tumblr)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    const before = wrapper.style.height;
    post(
      iframe,
      'https://embed.tumblr.com',
      '{"method":"tumblr-post:other","args":[9]}',
    );
    expect(wrapper.style.height).toBe(before);
  });
});
