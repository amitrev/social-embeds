import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dailymotionPlan } from '../../src/core/plans/dailymotion';
import { youtubePlan } from '../../src/core/plans/youtube';
import { lookupMessage } from '../../src/core/resolve';
import { SocialEmbedElement } from '../../src/element';
import { matchUrl, type ParsedEmbed } from '../../src/parser';
import vimeoCode from '../fixtures/vimeo/oembed.html?raw';
import xCode from '../fixtures/x/oembed-basic.html?raw';
import youtubeCode from '../fixtures/youtube/share.html?raw';
import { installObserver } from '../components/helpers';

vi.mock('../../src/loader/platform-scripts', () => ({
  FACEBOOK_SDK_VERSION: 'v26.0',
  loadPlatformScript: vi.fn(() => Promise.resolve()),
}));

const YOUTUBE = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
const YOUTUBE_SHORT = 'https://youtu.be/jNQXAC9IVRw?t=11';
const TELEGRAM = 'https://t.me/telegram/83';
const DAILYMOTION = 'https://www.dailymotion.com/video/x84sh87';
const BLUESKY_HANDLE = 'https://bsky.app/profile/bsky.app/post/3l6oveex3ii2l';

const page = window as unknown as Record<string, unknown>;

function matched(url: string): ParsedEmbed {
  const embed = matchUrl(url);
  if (!embed) throw new Error(`no match: ${url}`);
  return embed;
}

function create(
  attributes: Record<string, string> = {},
  children = '',
): SocialEmbedElement {
  const element = document.createElement('social-embed');
  for (const [name, value] of Object.entries(attributes))
    element.setAttribute(name, value);
  element.innerHTML = children;
  return element;
}

function listen(element: Element) {
  const loads = vi.fn();
  const errors = vi.fn<(event: ErrorEvent) => void>();
  element.addEventListener('load', loads);
  element.addEventListener('error', (event) => {
    errors(event as ErrorEvent);
  });
  return { loads, errors };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const iframes = (element: Element) => element.querySelectorAll('iframe');

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, 'twttr');
});

describe('<social-embed>', () => {
  it('renders a URL as the plan’s iframe', () => {
    const element = create({ url: YOUTUBE, eager: '' });
    document.body.append(element);
    const plan = youtubePlan(matched(YOUTUBE), {});
    if (plan.kind !== 'iframe') throw new Error('expected an iframe plan');
    expect(iframes(element)).toHaveLength(1);
    expect(element.querySelector('iframe')?.getAttribute('src')).toBe(plan.src);
  });

  it('sets no inline display on itself', () => {
    const element = create({ url: YOUTUBE });
    document.body.append(element);
    expect(element.style.display).toBe('');
    expect(element.hasAttribute('style')).toBe(false);
  });

  it('renders embed code from a template, without its script', async () => {
    const handlers = new Set<(event: { target?: unknown }) => void>();
    page.twttr = {
      widgets: { load: vi.fn() },
      events: {
        bind: (_: string, handler: (event: { target?: unknown }) => void) =>
          handlers.add(handler),
        unbind: () => {},
      },
    };
    const element = create({ eager: '' }, `<template>${xCode}</template>`);
    document.body.append(element);
    await flush();
    const tweet = element.querySelector('.twitter-tweet');
    expect(tweet?.textContent).toContain('just setting up my twttr');
    expect(element.querySelector('script')).toBeNull();
  });

  it('prefers the html property over a template, and a template over url', () => {
    const element = create(
      { url: TELEGRAM, eager: '' },
      `<template>${youtubeCode}</template>`,
    );
    document.body.append(element);
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'youtube',
    );
    element.html = vimeoCode;
    expect(iframes(element)).toHaveLength(1);
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'player.vimeo.com',
    );
    expect(element.html).toBe(vimeoCode);
  });

  it('re-renders when the template is replaced', async () => {
    const element = create(
      { eager: '' },
      `<template>${youtubeCode}</template>`,
    );
    document.body.append(element);
    const template = document.createElement('template');
    template.innerHTML = vimeoCode;
    element.querySelector('template')?.replaceWith(template);
    await flush();
    expect(iframes(element)).toHaveLength(1);
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'player.vimeo.com',
    );
  });

  it('re-renders when the template’s content changes in place', async () => {
    const element = create(
      { eager: '' },
      `<template>${youtubeCode}</template>`,
    );
    document.body.append(element);
    await flush();
    const template = element.querySelector('template');
    if (!template) throw new Error('no template');
    template.innerHTML = vimeoCode;
    await flush();
    expect(iframes(element)).toHaveLength(1);
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'player.vimeo.com',
    );
  });

  it('watches the content of a template added later', async () => {
    const element = create({ url: TELEGRAM, eager: '' });
    document.body.append(element);
    const template = document.createElement('template');
    template.innerHTML = youtubeCode;
    element.append(template);
    await flush();
    template.innerHTML = vimeoCode;
    await flush();
    expect(iframes(element)).toHaveLength(1);
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'player.vimeo.com',
    );
  });

  it('reflects its properties to attributes', () => {
    const element = create();
    document.body.append(element);
    expect(element.url).toBeNull();
    expect(element.eager).toBe(false);
    element.eager = true;
    element.url = YOUTUBE;
    expect(element.getAttribute('url')).toBe(YOUTUBE);
    expect(element.hasAttribute('eager')).toBe(true);
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'youtube',
    );
    element.width = '300';
    element.maxWidth = '400';
    element.height = '200';
    element.maxHeight = '500';
    expect(element.getAttribute('width')).toBe('300');
    expect(element.getAttribute('max-width')).toBe('400');
    expect(element.getAttribute('height')).toBe('200');
    expect(element.getAttribute('max-height')).toBe('500');
    expect([
      element.width,
      element.maxWidth,
      element.height,
      element.maxHeight,
    ]).toEqual(['300', '400', '200', '500']);
    element.setAttribute('url', TELEGRAM);
    expect(element.url).toBe(TELEGRAM);
    element.url = null;
    element.maxWidth = null;
    element.eager = false;
    expect(element.hasAttribute('url')).toBe(false);
    expect(element.hasAttribute('max-width')).toBe(false);
    expect(element.hasAttribute('eager')).toBe(false);
    expect(element.childElementCount).toBe(0);
  });

  it('ignores an html property that is not a string', () => {
    const element = create({ url: YOUTUBE, eager: '' });
    (element as unknown as { html: unknown }).html = 42;
    document.body.append(element);
    expect(element.html).toBeNull();
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'youtube',
    );
  });

  it('reports an unknown URL and renders nothing', async () => {
    const element = create({ url: 'https://example.com/' });
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    expect(errors).toHaveBeenCalledOnce();
    const event = errors.mock.calls[0]?.[0];
    expect(event).toBeInstanceOf(ErrorEvent);
    expect(event?.message).toBe(
      'social-embeds: not a supported post URL: https://example.com/',
    );
    expect(event?.error).toBeInstanceOf(Error);
    expect(event?.bubbles).toBe(false);
    expect(element.childElementCount).toBe(0);
  });

  it('reports unrecognised embed code', async () => {
    const element = create();
    element.html = '<p>not an embed</p>';
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    expect(errors.mock.calls[0]?.[0].message).toBe(
      'social-embeds: unrecognised embed code',
    );
    expect(element.childElementCount).toBe(0);
  });

  it('reports a Bluesky URL that needs a lookup', async () => {
    const element = create({ url: BLUESKY_HANDLE });
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    expect(errors.mock.calls[0]?.[0].message).toBe(lookupMessage('bluesky'));
  });

  it('reports a Dailymotion URL without a Player ID', async () => {
    const plan = dailymotionPlan(matched(DAILYMOTION), {});
    if (plan.kind !== 'error') throw new Error('expected a plan error');
    const element = create({ url: DAILYMOTION });
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    expect(errors.mock.calls[0]?.[0].message).toBe(plan.message);
    expect(element.childElementCount).toBe(0);
  });

  it('applies the layout attributes', () => {
    const element = create({
      url: YOUTUBE,
      'max-width': '400',
      width: '50%',
      height: 'tall',
    });
    document.body.append(element);
    const wrapper = element.firstElementChild as HTMLElement;
    expect(wrapper.style.maxWidth).toBe('400px');
    expect(wrapper.style.width).toBe('50%');
    expect(wrapper.style.height).toBe('');
    element.setAttribute('width', '300');
    const next = element.firstElementChild as HTMLElement;
    expect(next.style.width).toBe('300px');
    expect(element.childElementCount).toBe(1);
  });

  it('reads px in the pixel attributes and ignores other units', () => {
    const element = create({
      url: YOUTUBE,
      'max-width': '400px',
      height: '300px',
      'max-height': '500px',
    });
    document.body.append(element);
    const wrapper = element.firstElementChild as HTMLElement;
    expect(wrapper.style.maxWidth).toBe('400px');
    expect(wrapper.style.height).toBe('300px');
    expect(wrapper.style.maxHeight).toBe('500px');
    element.setAttribute('max-width', '20em');
    element.setAttribute('height', '50%');
    element.setAttribute('max-height', '2in');
    const next = element.firstElementChild as HTMLElement;
    expect(next.style.maxWidth).toBe('');
    expect(next.style.height).toBe('');
    expect(next.style.aspectRatio).toBe('16 / 9');
  });

  it('replaces the embed when url changes during load', async () => {
    const element = create({ url: YOUTUBE, eager: '' });
    document.body.append(element);
    const { loads } = listen(element);
    const old = element.querySelector('iframe');
    element.setAttribute('url', YOUTUBE_SHORT);
    expect(old?.isConnected).toBe(false);
    expect(iframes(element)).toHaveLength(1);
    old?.dispatchEvent(new Event('load'));
    await flush();
    expect(loads).not.toHaveBeenCalled();
    element.querySelector('iframe')?.dispatchEvent(new Event('load'));
    await flush();
    expect(loads).toHaveBeenCalledOnce();
    expect(loads.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    expect((loads.mock.calls[0]?.[0] as Event).bubbles).toBe(false);
  });

  it('survives a move in the same task', async () => {
    const add = vi.spyOn(window, 'addEventListener');
    const element = create({ url: TELEGRAM, eager: '' });
    const other = document.createElement('div');
    document.body.append(element, other);
    element.remove();
    other.append(element);
    const { loads } = listen(element);
    await flush();
    expect(iframes(element)).toHaveLength(1);
    expect(add.mock.calls.filter(([type]) => type === 'message')).toHaveLength(
      1,
    );
    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ event: 'resize', height: 400 }),
        origin: 'https://t.me',
        source: element.querySelector('iframe')?.contentWindow ?? null,
      }),
    );
    await flush();
    expect(loads).toHaveBeenCalledOnce();
  });

  it('cleans up once removed, and renders again when re-added', async () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const element = create({ url: TELEGRAM, eager: '' });
    document.body.append(element);
    element.remove();
    await flush();
    expect(iframes(element)).toHaveLength(0);
    expect(remove.mock.calls.some(([type]) => type === 'message')).toBe(true);
    document.body.append(element);
    expect(iframes(element)).toHaveLength(1);
  });

  it('upgrades markup parsed before define', () => {
    document.body.innerHTML = `<social-embed-upgrade url="${YOUTUBE}" eager><p>wait</p></social-embed-upgrade>`;
    class Upgrade extends SocialEmbedElement {}
    customElements.define('social-embed-upgrade', Upgrade);
    const element = document.querySelector('social-embed-upgrade');
    expect(element).toBeInstanceOf(Upgrade);
    expect(element?.querySelectorAll('iframe')).toHaveLength(1);
  });

  it('picks up an html property set before define', () => {
    const element = document.createElement(
      'social-embed-property',
    ) as Element & {
      html?: string;
    };
    element.html = vimeoCode;
    element.setAttribute('eager', '');
    document.body.append(element);
    class Property extends SocialEmbedElement {}
    customElements.define('social-embed-property', Property);
    expect(Object.hasOwn(element, 'html')).toBe(false);
    expect(element.html).toBe(vimeoCode);
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'player.vimeo.com',
    );
  });

  it('picks up url and eager properties set before define', () => {
    const element = document.createElement(
      'social-embed-reflect',
    ) as Element & {
      url?: string;
      eager?: boolean;
    };
    element.url = YOUTUBE;
    element.eager = true;
    document.body.append(element);
    class Reflecting extends SocialEmbedElement {}
    customElements.define('social-embed-reflect', Reflecting);
    expect(Object.hasOwn(element, 'url')).toBe(false);
    expect(Object.hasOwn(element, 'eager')).toBe(false);
    expect(element.getAttribute('url')).toBe(YOUTUBE);
    expect(element.hasAttribute('eager')).toBe(true);
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'youtube',
    );
  });

  it('shows a child as the placeholder until load', async () => {
    const element = create({ url: YOUTUBE, eager: '' }, '<p>wait</p>');
    const original = element.querySelector('p');
    document.body.append(element);
    const { loads } = listen(element);
    expect(original?.isConnected).toBe(false);
    expect(element.querySelectorAll('p')).toHaveLength(1);
    expect(element.querySelector('p')?.textContent).toBe('wait');
    expect(element.querySelector('[aria-hidden="true"]')).toBeNull();
    element.querySelector('iframe')?.dispatchEvent(new Event('load'));
    await flush();
    expect(element.querySelector('p')).toBeNull();
    expect(loads).toHaveBeenCalledOnce();
    element.setAttribute('url', YOUTUBE_SHORT);
    expect(element.querySelector('p')?.textContent).toBe('wait');
  });

  it('dispatches nothing once removed in the same task', async () => {
    const element = create({ url: 'https://example.com/' });
    const { errors } = listen(element);
    document.body.append(element);
    element.remove();
    await flush();
    expect(errors).not.toHaveBeenCalled();
  });

  it('still dispatches after a move in the same task', async () => {
    const element = create({ url: 'https://example.com/' });
    const other = document.createElement('div');
    const { errors } = listen(element);
    document.body.append(element, other);
    element.remove();
    other.append(element);
    await flush();
    expect(errors).toHaveBeenCalledOnce();
  });

  it('waits for parsing to capture its children', async () => {
    const state = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('loading');
    const element = create({ url: TELEGRAM, eager: '' });
    document.body.append(element);
    element.insertAdjacentHTML(
      'beforeend',
      `<p>wait</p><template>${youtubeCode}</template>`,
    );
    await flush();
    expect(element.querySelector('iframe')).toBeNull();
    expect(element.childElementCount).toBe(2);
    state.mockReturnValue('interactive');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flush();
    expect(iframes(element)).toHaveLength(1);
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'youtube',
    );
    expect(element.querySelectorAll('p')).toHaveLength(1);
    expect(element.querySelector('p')?.parentElement).not.toBe(element);
  });
});
