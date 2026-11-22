import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as entry from '../../src';
import {
  createSocialEmbed,
  genericIframe,
  SocialEmbed,
  x,
  youtube,
} from '../../src';
import type { EmbedPlatform } from '../../src';
import { platforms as parsers } from '../../src/parser/platforms';
import maps from '../fixtures/generic/google-maps-embed.html?raw';
import youtubeCode from '../fixtures/youtube/share.html?raw';
import { installObserver, installResizeObserver } from './helpers';

vi.mock('../../src/loader/platform-scripts', async () =>
  (await import('../loader/helpers')).mockPlatformScripts(
    () => new Promise(() => {}),
  ),
);

const fixtures = import.meta.glob<string>('../fixtures/*/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const sampleUrls = [
  ...readFileSync(
    join(import.meta.dirname, '..', '..', 'playground', 'samples.ts'),
    'utf8',
  ).matchAll(/'(https:\/\/[^'\s]+)'/g),
].flatMap(([, url]) => (url === undefined ? [] : [url]));

function isPlatform(value: unknown): value is EmbedPlatform {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    (value.kind === 'platform' || value.kind === 'iframe')
  );
}

const exported = Object.values(entry).filter(isPlatform);

beforeEach(() => {
  installObserver();
  installResizeObserver(640);
});

afterEach(() => {
  cleanup();
});

describe('the exported platforms', () => {
  it('cover every parser once, plus generic iframes', () => {
    const named = exported.flatMap((p) =>
      p.kind === 'platform' ? [p.parser] : [],
    );
    expect(new Set(named)).toEqual(new Set(parsers));
    expect(named).toHaveLength(parsers.length);
    expect(exported.filter((p) => p.kind === 'iframe')).toEqual([
      genericIframe,
    ]);
  });

  it('are each exported under the platform id', () => {
    for (const [name, value] of Object.entries(entry))
      if (isPlatform(value) && value.kind === 'platform')
        expect(name).toBe(value.parser.platform);
  });
});

describe('createSocialEmbed with every platform', () => {
  const Every = createSocialEmbed(exported);

  it.each(Object.entries(fixtures))(
    '%s renders as SocialEmbed does',
    (_, html) => {
      const expected = render(<SocialEmbed html={html} />).container.innerHTML;
      cleanup();
      expect(render(<Every html={html} />).container.innerHTML).toBe(expected);
    },
  );

  it.each(sampleUrls)('%s renders as SocialEmbed does', (url) => {
    const expected = render(<SocialEmbed url={url} />).container.innerHTML;
    cleanup();
    expect(render(<Every url={url} />).container.innerHTML).toBe(expected);
  });

  it('does not depend on the order of the list', () => {
    const Reversed = createSocialEmbed([...exported].reverse());
    for (const html of Object.values(fixtures)) {
      const expected = render(<SocialEmbed html={html} />).container.innerHTML;
      cleanup();
      expect(render(<Reversed html={html} />).container.innerHTML).toBe(
        expected,
      );
      cleanup();
    }
  });
});

describe('createSocialEmbed with some platforms', () => {
  const Some = createSocialEmbed([youtube, x]);

  it('renders the listed platforms from embed code and URLs', () => {
    const { container } = render(<Some html={youtubeCode} />);
    expect(container.innerHTML).toBe(
      render(<SocialEmbed html={youtubeCode} />).container.innerHTML,
    );
    cleanup();
    const url = 'https://x.com/jack/status/20';
    expect(render(<Some url={url} />).container.innerHTML).toBe(
      render(<SocialEmbed url={url} />).container.innerHTML,
    );
  });

  it('hands embed code of another platform to fallback', () => {
    const fallback = vi.fn(() => <p>host</p>);
    const onError = vi.fn();
    const { container } = render(
      <Some
        html={fixtures['../fixtures/vimeo/responsive-docs.html'] ?? ''}
        fallback={fallback}
        onError={onError}
      />,
    );
    expect(fallback).toHaveBeenCalledOnce();
    expect(container.innerHTML).toBe('<p>host</p>');
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports a URL of another platform as unsupported', () => {
    const onError = vi.fn();
    const url = 'https://vimeo.com/76979871';
    const { container } = render(<Some url={url} onError={onError} />);
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error(`social-embeds: not a supported post URL: ${url}`),
    );
  });

  it('renders generic iframes only with genericIframe in the list', () => {
    const onError = vi.fn();
    expect(
      render(<Some html={maps} onError={onError} />).container.innerHTML,
    ).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: unrecognised embed code'),
    );
    cleanup();
    const WithIframes = createSocialEmbed([youtube, genericIframe]);
    const expected = render(<SocialEmbed html={maps} />).container.innerHTML;
    cleanup();
    expect(expected).not.toBe('');
    expect(render(<WithIframes html={maps} />).container.innerHTML).toBe(
      expected,
    );
  });

  it('renders nothing for an empty list, and reports it', () => {
    const None = createSocialEmbed([]);
    const onError = vi.fn();
    expect(
      render(<None html={youtubeCode} onError={onError} />).container.innerHTML,
    ).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: unrecognised embed code'),
    );
  });

  it('is named SocialEmbed in React DevTools', () => {
    expect(Some.name).toBe('SocialEmbed');
  });
});
