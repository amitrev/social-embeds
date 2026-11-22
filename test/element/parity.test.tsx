import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { URLS } from '../../playground/samples';
import { SocialEmbed } from '../../src';
import '../../src/element';
import { type Platform, parseEmbed, parseIframe } from '../../src/parser';
import { installObserver, installResizeObserver } from '../components/helpers';
import type { LoadPlatformScript } from '../loader/helpers';

const loadPlatformScript = vi.hoisted(() =>
  vi.fn<LoadPlatformScript>(() => new Promise(() => {})),
);
vi.mock('../../src/loader/platform-scripts', async () =>
  (await import('../loader/helpers')).mockPlatformScripts(loadPlatformScript),
);

const fixtures = import.meta.glob<string>('../fixtures/**/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const IFRAME_ATTRIBUTES = [
  'src',
  'title',
  'allow',
  'allowfullscreen',
  'referrerpolicy',
  'scrolling',
  'sandbox',
] as const;
const WRAPPER_STYLES = [
  'width',
  'max-width',
  'aspect-ratio',
  'height',
  'max-height',
  'border-radius',
  'overflow',
  'display',
  'position',
] as const;

const PLATFORMS = {
  x: true,
  instagram: true,
  threads: true,
  facebook: true,
  tiktok: true,
  youtube: true,
  telegram: true,
  snapchat: true,
  linkedin: true,
  reddit: true,
  pinterest: true,
  spotify: true,
  vimeo: true,
  twitch: true,
  dailymotion: true,
  bluesky: true,
  soundcloud: true,
  applemusic: true,
  applepodcasts: true,
  tumblr: true,
  kick: true,
  giphy: true,
  truthsocial: true,
  imgur: true,
  tenor: true,
  streamable: true,
  strava: true,
  flickr: true,
  rumble: true,
} satisfies Record<Platform, true>;

type Rendered = {
  kind: 'iframe' | 'script' | 'error' | 'none';
  iframe: Record<string, string | null> | null;
  container: string | null;
  placeholder: string;
  error: string | null;
  styles: Record<string, string>;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function placeholderKind(layer: Element | null | undefined): string {
  if (layer instanceof HTMLAnchorElement)
    return `link:${String(layer.getAttribute('href'))} ${layer.textContent}`;
  const skeleton = layer?.matches('[aria-hidden="true"]')
    ? layer
    : layer?.querySelector('[aria-hidden="true"]');
  if (skeleton instanceof HTMLElement)
    return `skeleton:${skeleton.style.minHeight}`;
  if (layer?.querySelector('blockquote')) return 'blockquote';
  if (layer?.querySelector('a > img')) return 'image';
  return 'none';
}

// React's wrapper is the root div, the element's its first child div.
function describeDom(wrapper: Element | null, error: string | null): Rendered {
  const iframe = wrapper?.querySelector('iframe') ?? null;
  const frame = wrapper?.firstElementChild;
  const container =
    iframe || !wrapper ? null : (frame?.firstElementChild ?? null);
  // Iframe embeds: the frame's child that is not the iframe. Script embeds: the frame's second child.
  const layer = iframe
    ? ([...(frame?.children ?? [])].find((child) => child !== iframe) ?? null)
    : (frame?.children[1] ?? null);
  const styles: Record<string, string> = {};
  if (wrapper instanceof HTMLElement)
    for (const name of WRAPPER_STYLES)
      styles[name] = wrapper.style.getPropertyValue(name);
  return {
    kind: iframe ? 'iframe' : container ? 'script' : error ? 'error' : 'none',
    iframe: iframe
      ? Object.fromEntries(
          IFRAME_ATTRIBUTES.map((name) => [name, iframe.getAttribute(name)]),
        )
      : null,
    container: container ? container.innerHTML : null,
    placeholder: wrapper ? placeholderKind(layer) : 'none',
    error,
    styles,
  };
}

async function viaReact(source: { html: string } | { url: string }) {
  const errors: string[] = [];
  const { container } = render(
    <SocialEmbed
      {...source}
      lazy={false}
      onError={(error) => errors.push(error.message)}
    />,
  );
  await act(flush);
  const wrapper = container.firstElementChild;
  return describeDom(wrapper, errors[0] ?? null);
}

async function viaElement(source: { html: string } | { url: string }) {
  const element = document.createElement('social-embed');
  element.setAttribute('eager', '');
  const errors: string[] = [];
  element.addEventListener('error', (event) => {
    const error: unknown = event.error;
    if (error instanceof Error) errors.push(error.message);
  });
  if ('html' in source)
    (element as unknown as { html: string }).html = source.html;
  else element.setAttribute('url', source.url);
  document.body.append(element);
  await flush();
  const rendered = describeDom(element.firstElementChild, errors[0] ?? null);
  element.remove();
  return rendered;
}

beforeEach(() => {
  installObserver();
  // Frames with their size in the src wait for the box's width (Flickr).
  installResizeObserver(640);
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

const entries = Object.entries(fixtures);
const parsed = entries.filter(([, html]) => parseEmbed(html) !== null);
const generic = entries.filter(
  ([path, html]) =>
    path.startsWith('../fixtures/generic/') &&
    parseEmbed(html) === null &&
    parseIframe(html) !== null,
);
const skipped = entries
  .filter(([, html]) => parseEmbed(html) === null)
  .filter(([path]) => !generic.some(([kept]) => kept === path))
  .map(([path]) => path.replace('../fixtures/', ''));

type Case = { label: string; platform: Platform | 'generic'; source: Source };
type Source = { html: string } | { url: string };

const cases: Case[] = [
  ...parsed.map(([path, html]) => ({
    label: path,
    platform: parseEmbed(html)?.platform as Platform,
    source: { html },
  })),
  ...generic.map(([path, html]) => ({
    label: path,
    platform: 'generic' as const,
    source: { html },
  })),
  ...Object.entries(URLS).flatMap(([platform, samples]) =>
    samples.map((sample) => ({
      label: `URL ${platform} ${sample.label}`,
      platform: platform as Platform,
      source: { url: sample.value },
    })),
  ),
];

const seen = {
  iframe: 0,
  script: 0,
  error: [] as string[],
  failed: { link: 0, fallback: 0 },
};
const platforms = new Set<Platform | 'generic'>();

// Nothing has loaded, so a placeholder must be showing, unless the markup is the fallback.
function check(side: Rendered): void {
  if (side.kind === 'iframe') {
    expect(side.iframe?.src).toBeTruthy();
    expect(side.iframe?.title).toBeTruthy();
    expect(side.iframe?.allow).not.toBeNull();
    expect(side.placeholder).toMatch(/^(skeleton:|blockquote|image)/);
  } else if (side.kind === 'script') {
    expect(side.container).toBeTruthy();
    if (side.placeholder === 'none')
      expect(side.container).toContain('<blockquote');
    else expect(side.placeholder).toMatch(/^skeleton:/);
  } else {
    expect(side.kind).toBe('error');
    expect(side.error).toBeTruthy();
    expect(side.container).toBeNull();
    expect(side.iframe).toBeNull();
  }
}

describe('<social-embed> and <SocialEmbed>', () => {
  it('parses every fixture or renders it as a generic iframe, except Rumble’s script player', () => {
    // Rumble's script player code has no iframe, and the package accepts only its iframe code.
    expect([...skipped].sort()).toEqual(['rumble/embed-dialog-js.html']);
    expect(parsed).toHaveLength(74);
    expect(generic).toHaveLength(8);
  });

  it.each(cases.map((item) => [item.label, item] as const))(
    'renders the same for %s',
    async (_label, { label, platform, source }) => {
      const react = await viaReact(source);
      cleanup();
      const element = await viaElement(source);
      check(react);
      check(element);
      expect(element).toEqual(react);
      platforms.add(platform);
      if (react.kind === 'error') seen.error.push(label);
      else seen[react.kind as 'iframe' | 'script'] += 1;
    },
  );

  const scripts = new Set<Case['platform']>([
    'x',
    'instagram',
    'threads',
    'facebook',
    'pinterest',
  ]);
  it.each(
    cases
      .filter((item) => scripts.has(item.platform))
      .map((item) => [item.label, item] as const),
  )('fails the same for %s', async (_label, { source }) => {
    loadPlatformScript.mockImplementation(() =>
      Promise.reject(new Error('blocked')),
    );
    const react = await viaReact(source);
    cleanup();
    const element = await viaElement(source);
    loadPlatformScript.mockImplementation(() => new Promise(() => {}));
    expect(element).toEqual(react);
    if (react.kind !== 'script') return;
    expect(react.error).toBe('blocked');
    if (react.placeholder === 'none') {
      expect(react.container).toContain('<blockquote');
      seen.failed.fallback += 1;
    } else {
      expect(react.placeholder).toMatch(
        /^link:https:\/\/\S+ View this post on /,
      );
      seen.failed.link += 1;
    }
  });

  it('covered every platform and the known case kinds', () => {
    expect([...platforms].sort()).toEqual(
      [...Object.keys(PLATFORMS), 'generic'].sort(),
    );
    expect(seen.iframe).toBe(103);
    expect(seen.script).toBe(23);
    expect(seen.failed).toEqual({ link: 13, fallback: 10 });
    expect(seen.error).toEqual([
      '../fixtures/dailymotion/oembed.html',
      'URL dailymotion Video, no Player ID: reports an error',
      'URL bluesky Post, by handle: reports a lookup error',
      'URL rumble Page URL: reports a lookup error',
    ]);
  });
});
