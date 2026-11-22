import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RumbleEmbed,
  SocialEmbed,
  StreamableEmbed,
  TenorEmbed,
} from '../../src';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import rumbleDialog from '../fixtures/rumble/embed-dialog-iframe.html?raw';
import streamableDocs from '../fixtures/streamable/embed-docs.html?raw';
import tenorDialog from '../fixtures/tenor/embed-dialog.html?raw';
import tenorOembed from '../fixtures/tenor/oembed.html?raw';
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

const LOOKUP = 'social-embeds: a Rumble URL needs a lookup: use the embed code';

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  cleanup();
});

describe('TenorEmbed', () => {
  it('renders a URL at 4:3', () => {
    const { container } = render(
      <TenorEmbed
        url="https://tenor.com/view/hello-wave-gif-12345"
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe('https://tenor.com/embed/12345');
    expect(iframe.getAttribute('allow')).toBe('fullscreen');
    expect(wrapper.style.aspectRatio).toBe('133 / 100');
  });

  it('uses the embed code ratio', () => {
    const { container } = render(
      <TenorEmbed embed={parsed(tenorDialog)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://tenor.com/embed/12328062661350661133',
    );
    expect(wrapper.style.aspectRatio).toBe('1 / 1');
  });

  it('uses the oEmbed frame size', () => {
    const { container } = render(
      <TenorEmbed embed={parsed(tenorOembed)} lazy={false} />,
    );
    expect(parts(container).wrapper.style.aspectRatio).toBe('600 / 400');
  });

  it('keeps the verified id when options name another', () => {
    const embed = parsed(tenorDialog);
    const { container } = render(
      <TenorEmbed
        embed={{ ...embed, options: { id: '1', postid: '2' } }}
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://tenor.com/embed/12328062661350661133',
    );
  });

  it('narrows to a maxHeight', () => {
    const { container } = render(
      <TenorEmbed
        url="https://tenor.com/view/hello-wave-gif-12345"
        maxHeight={300}
        lazy={false}
      />,
    );
    expect(parts(container).wrapper.style.maxWidth).toBe('399px');
  });
});

describe('StreamableEmbed', () => {
  it('renders a URL at 16:9', () => {
    const { container } = render(
      <StreamableEmbed url="https://streamable.com/abc123" lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe('https://streamable.com/e/abc123');
    expect(iframe.getAttribute('allow')).toBe('autoplay; fullscreen');
    expect(wrapper.style.aspectRatio).toBe('16 / 9');
  });

  it('adds option props over the embed code', () => {
    const embed = parsed(
      streamableDocs.replace('/e/lttg48"', '/e/lttg48?loop=0&autoplay=1"'),
    );
    const { container } = render(
      <StreamableEmbed embed={embed} loop muted lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://streamable.com/e/lttg48?loop=1&autoplay=1&muted=1',
    );
  });

  it('keeps the verified id when options name another', () => {
    const embed = parsed(streamableDocs);
    const { container } = render(
      <StreamableEmbed
        embed={{ ...embed, options: { id: 'other', v: 'x' } }}
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://streamable.com/e/lttg48',
    );
  });

  it('narrows to a maxHeight', () => {
    const { container } = render(
      <StreamableEmbed
        url="https://streamable.com/abc123"
        maxHeight={360}
        lazy={false}
      />,
    );
    expect(parts(container).wrapper.style.maxWidth).toBe('640px');
  });
});

describe('RumbleEmbed', () => {
  it('renders embed code with its size and pub', () => {
    const { container } = render(
      <RumbleEmbed embed={parsed(rumbleDialog)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://rumble.com/embed/v12onr1/?pub=4',
    );
    expect(wrapper.style.aspectRatio).toBe('640 / 360');
  });

  it('renders an embed URL without adding pub', () => {
    const { container } = render(
      <RumbleEmbed url="https://rumble.com/embed/v12onr1/" lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://rumble.com/embed/v12onr1/',
    );
  });

  it('reports a page URL as needing a lookup', () => {
    const onError = vi.fn();
    const { container } = render(
      <RumbleEmbed
        url="https://rumble.com/v2xyz-some-title.html"
        onError={onError}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(new Error(LOOKUP));
  });

  it('reports the lookup error through SocialEmbed', () => {
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed
        url="https://rumble.com/v2xyz-some-title.html"
        onError={onError}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(new Error(LOOKUP));
  });

  it('keeps the verified id when options name another', () => {
    const embed = parsed(rumbleDialog);
    const { container } = render(
      <RumbleEmbed
        embed={{ ...embed, options: { pub: '4', id: 'v9', src: 'x' } }}
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://rumble.com/embed/v12onr1/?pub=4',
    );
  });

  it('narrows to a maxHeight', () => {
    const { container } = render(
      <RumbleEmbed
        url="https://rumble.com/embed/v12onr1/"
        maxHeight={360}
        lazy={false}
      />,
    );
    expect(parts(container).wrapper.style.maxWidth).toBe('640px');
  });
});
