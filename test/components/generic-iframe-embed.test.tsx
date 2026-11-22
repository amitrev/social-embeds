import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericIframeEmbed } from '../../src';
import { type ParsedIframe, parseIframe } from '../../src/parser';
import datawrapper from '../fixtures/generic/datawrapper-oembed.html?raw';
import maps from '../fixtures/generic/google-maps-embed.html?raw';
import mixcloud from '../fixtures/generic/mixcloud-oembed.html?raw';
import youtube from '../fixtures/youtube/share.html?raw';
import { installObserver, lastObserver } from './helpers';

const MAPS_SRC = parseIframe(maps)?.src;

function parts(container: HTMLElement) {
  return {
    wrapper: container.firstElementChild as HTMLElement,
    iframe: container.querySelector('iframe'),
    skeleton: container.querySelector('[aria-hidden="true"]'),
  };
}

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('GenericIframeEmbed', () => {
  it('renders the sized wrapper on the server, without the iframe or a script', () => {
    const html = renderToString(<GenericIframeEmbed html={datawrapper} />);
    expect(html).toContain('height:200px');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<script');
  });

  it('creates the iframe only near the viewport', () => {
    const { container } = render(<GenericIframeEmbed html={maps} />);
    expect(parts(container).iframe).toBeNull();
    lastObserver().enter();
    expect(parts(container).iframe?.getAttribute('src')).toBe(MAPS_SRC);
  });

  it('shows the skeleton until the iframe loads', () => {
    const onLoad = vi.fn();
    const { container } = render(
      <GenericIframeEmbed html={maps} lazy={false} onLoad={onLoad} />,
    );
    expect(parts(container).skeleton).not.toBeNull();
    fireEvent.load(parts(container).iframe as HTMLIFrameElement);
    expect(parts(container).skeleton).toBeNull();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('passes the kept attributes to the iframe', () => {
    const { container } = render(
      <GenericIframeEmbed html={maps} lazy={false} />,
    );
    const { iframe } = parts(container);
    expect(iframe?.getAttribute('title')).toBe('Embedded content');
    expect(iframe?.getAttribute('allow')).toBe('');
    expect(iframe?.hasAttribute('allowfullscreen')).toBe(true);
    expect(iframe?.getAttribute('referrerpolicy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(iframe?.hasAttribute('sandbox')).toBe(false);
  });

  it('leaves out allowfullscreen when the code has none', () => {
    const { container } = render(
      <GenericIframeEmbed html={mixcloud} lazy={false} />,
    );
    const { iframe } = parts(container);
    expect(iframe?.hasAttribute('allowfullscreen')).toBe(false);
    expect(iframe?.getAttribute('allow')).toBe(
      'encrypted-media; fullscreen; autoplay; web-share',
    );
  });

  it('passes the sandbox keywords, and an empty sandbox as a full sandbox', () => {
    const keywords = render(
      <GenericIframeEmbed
        html='<iframe src="https://example.com/" sandbox="allow-scripts bogus allow-popups"></iframe>'
        lazy={false}
      />,
    );
    expect(parts(keywords.container).iframe?.getAttribute('sandbox')).toBe(
      'allow-scripts allow-popups',
    );
    cleanup();
    const empty = render(
      <GenericIframeEmbed
        html='<iframe src="https://example.com/" sandbox></iframe>'
        lazy={false}
      />,
    );
    expect(parts(empty.container).iframe?.getAttribute('sandbox')).toBe('');
  });

  it('never passes srcdoc, handlers or scripts', () => {
    const { container } = render(
      <GenericIframeEmbed
        html='<iframe src="https://example.com/" srcdoc="<script>x()</script>" onload="x()" style="position:fixed"></iframe><script>steal()</script>'
        lazy={false}
      />,
    );
    const { iframe } = parts(container);
    expect(iframe?.getAttribute('src')).toBe('https://example.com/');
    expect(iframe?.hasAttribute('srcdoc')).toBe(false);
    expect(iframe?.hasAttribute('onload')).toBe(false);
    expect(iframe?.getAttribute('style')).not.toContain('fixed');
    expect(container.querySelector('script')).toBeNull();
  });

  it('reports an error after 15 s without load', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    render(<GenericIframeEmbed html={maps} onError={onError} />);
    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: Embedded content did not load'),
    );
  });

  it('names the frame by the code’s title in the timeout error', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    render(<GenericIframeEmbed html={datawrapper} onError={onError} />);
    lastObserver().enter();
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: The transition from the Late Pleistocene to the Holocene did not load',
      ),
    );
  });

  it.each([
    ['code without an iframe', '<p>hello</p>'],
    ['an http iframe', '<iframe src="http://example.com/"></iframe>'],
    ['a named platform’s iframe', youtube],
  ])('renders nothing and reports %s', (_, html) => {
    const onError = vi.fn();
    const { container } = render(
      <GenericIframeEmbed html={html} onError={onError} lazy={false} />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: not an iframe embed code'),
    );
  });
});

describe('GenericIframeEmbed with a host-built embed', () => {
  const embed: ParsedIframe = {
    src: 'https://example.com/',
    allow: '',
    allowFullscreen: false,
    size: {},
  };

  it('renders nothing and reports a src that is not safe', () => {
    const onError = vi.fn();
    const { container } = render(
      <GenericIframeEmbed
        embed={{ ...embed, src: 'javascript:alert(1)' }}
        onError={onError}
        lazy={false}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: not a generic iframe embed'),
    );
  });

  it('drops the features it may not delegate', () => {
    const { container } = render(
      <GenericIframeEmbed
        embed={{ ...embed, allow: 'camera; microphone' }}
        lazy={false}
      />,
    );
    expect(parts(container).iframe?.getAttribute('allow')).toBe('');
  });
});

describe('GenericIframeEmbed size', () => {
  it('keeps the code’s aspect ratio, at most its width', () => {
    const { container } = render(
      <GenericIframeEmbed html={maps} lazy={false} />,
    );
    const { wrapper } = parts(container);
    expect(wrapper.style.aspectRatio).toBe('600 / 450');
    expect(wrapper.style.maxWidth).toBe('600px');
  });

  it('keeps the code’s height at full width', () => {
    const { container } = render(
      <GenericIframeEmbed html={datawrapper} lazy={false} />,
    );
    const { wrapper } = parts(container);
    expect(wrapper.style.height).toBe('200px');
    expect(wrapper.style.width).toBe('100%');
    expect(wrapper.style.maxWidth).toBe('');
  });

  it('lets the host’s maxWidth and height win', () => {
    const { container } = render(
      <GenericIframeEmbed
        html={maps}
        maxWidth={400}
        height={300}
        className="map"
        lazy={false}
      />,
    );
    const { wrapper } = parts(container);
    expect(wrapper.style.maxWidth).toBe('400px');
    expect(wrapper.style.height).toBe('300px');
    expect(wrapper.className).toBe('map');
  });

  it('accepts html or embed, never both or neither', () => {
    // Checked by `pnpm typecheck`: each element below must be a type error.
    const invalid = [
      // @ts-expect-error -- html and embed are mutually exclusive
      <GenericIframeEmbed
        key="both"
        html={maps}
        embed={{
          src: 'https://example.com/',
          allow: '',
          allowFullscreen: false,
          size: {},
        }}
      />,
      // @ts-expect-error -- one of html or embed is required
      <GenericIframeEmbed key="neither" />,
    ];
    expect(invalid).toHaveLength(2);
  });
});
