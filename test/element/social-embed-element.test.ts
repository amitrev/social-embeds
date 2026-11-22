import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dailymotionPlan } from '../../src/core/plans/dailymotion';
import { youtubePlan } from '../../src/core/plans/youtube';
import { lookupMessage } from '../../src/core/resolve';
import { SocialEmbedElement } from '../../src/element';
import { matchUrl, type ParsedEmbed, parseIframe } from '../../src/parser';
import datawrapperCode from '../fixtures/generic/datawrapper-oembed.html?raw';
import mapsCode from '../fixtures/generic/google-maps-embed.html?raw';
import vimeoCode from '../fixtures/vimeo/oembed.html?raw';
import xCode from '../fixtures/x/oembed-basic.html?raw';
import youtubeCode from '../fixtures/youtube/share.html?raw';
import { installObserver } from '../components/helpers';
import type { LoadPlatformScript } from '../loader/helpers';

const loadPlatformScript = vi.hoisted(() =>
  vi.fn<LoadPlatformScript>(() => Promise.resolve()),
);
vi.mock('../../src/loader/platform-scripts', async () =>
  (await import('../loader/helpers')).mockPlatformScripts(loadPlatformScript),
);

const YOUTUBE = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
const YOUTUBE_SHORT = 'https://youtu.be/jNQXAC9IVRw?t=11';
const TELEGRAM = 'https://t.me/telegram/83';
const DAILYMOTION = 'https://www.dailymotion.com/video/x84sh87';
const BLUESKY_HANDLE = 'https://bsky.app/profile/bsky.app/post/3l6oveex3ii2l';
const RUMBLE_PAGE =
  'https://rumble.com/v15atp3-rumble-basics-how-to-upload-a-video-ios-app.html';

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

const createRange = (html: string) =>
  document.createRange().createContextualFragment(html).childNodes;

const iframes = (element: Element) => element.querySelectorAll('iframe');

const outputs = (element: Element) =>
  element.querySelectorAll(':scope > [slot="embed"]');

const slotted = (element: Element) =>
  element.shadowRoot?.querySelector('slot')?.assignedNodes() ?? [];

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, 'twttr');
  Reflect.deleteProperty(window, 'instgrm');
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
    expect(document.querySelector('.twitter-tweet')).toBe(tweet);
    expect(slotted(element)).toEqual([...outputs(element)]);
  });

  it('prefers the html property, then the html attribute, then a template, then url', async () => {
    const element = create(
      { url: TELEGRAM, eager: '' },
      `<template>${youtubeCode}</template>`,
    );
    document.body.append(element);
    const src = () => element.querySelector('iframe')?.getAttribute('src');
    expect(src()).toContain('youtube');
    element.setAttribute('html', vimeoCode);
    expect(src()).toContain('player.vimeo.com');
    element.html = mapsCode;
    expect(iframes(element)).toHaveLength(1);
    expect(src()).toContain('google.com/maps');
    expect(element.html).toBe(mapsCode);
    element.html = null;
    expect(src()).toContain('player.vimeo.com');
    element.removeAttribute('html');
    expect(src()).toContain('youtube');
    element.querySelector('template')?.remove();
    await flush();
    expect(src()).toContain('t.me');
  });

  it('renders embed code from an html attribute', () => {
    const element = create({ html: youtubeCode, eager: '' });
    document.body.append(element);
    expect(element.html).toBeNull();
    expect(element.querySelector('iframe')?.getAttribute('src')).toContain(
      'youtube',
    );
  });

  it('renders html that React set as an attribute before define', () => {
    const { container } = render(
      createElement('social-embed-react', { html: vimeoCode, eager: '' }),
    );
    const element = container.firstElementChild;
    expect(element?.getAttribute('html')).toBe(vimeoCode);
    class Late extends SocialEmbedElement {}
    customElements.define('social-embed-react', Late);
    expect(element).toBeInstanceOf(Late);
    expect(element?.querySelector('iframe')?.getAttribute('src')).toContain(
      'player.vimeo.com',
    );
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

  it('treats an undefined eager property as off', () => {
    const element = create();
    // React sets a removed prop to undefined on an upgraded custom element.
    element.eager = undefined;
    expect(element.hasAttribute('eager')).toBe(false);
    element.eager = true;
    element.eager = undefined;
    expect(element.hasAttribute('eager')).toBe(false);
  });

  it('reads eager as a boolean attribute in which "false" is off', () => {
    const element = create({ url: YOUTUBE, eager: 'false' });
    document.body.append(element);
    expect(element.eager).toBe(false);
    expect(iframes(element)).toHaveLength(0);
    element.eager = true;
    expect(element.getAttribute('eager')).toBe('');
    expect(iframes(element)).toHaveLength(1);
    const values = [
      ['', true],
      ['false', false],
      [false, false],
      [null, false],
      [undefined, false],
      ['true', true],
      [true, true],
    ] as const;
    for (const [value, on] of values) {
      (element as unknown as { eager: unknown }).eager = value;
      expect(element.eager).toBe(on);
      expect(element.hasAttribute('eager')).toBe(on);
    }
  });

  it('turns eager on for an empty eager property, as React 19 sets', () => {
    const { container } = render(
      createElement('social-embed', { url: YOUTUBE, eager: '' }),
    );
    const element = container.firstElementChild as SocialEmbedElement;
    expect(element.eager).toBe(true);
    expect(iframes(element)).toHaveLength(1);
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

  it('renders generic iframe code from a template and fires load', async () => {
    const element = create({ eager: '' }, `<template>${mapsCode}</template>`);
    document.body.append(element);
    const { loads, errors } = listen(element);
    expect(iframes(element)).toHaveLength(1);
    const iframe = element.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe(parseIframe(mapsCode)?.src);
    expect(iframe?.title).toBe('Embedded content');
    expect(iframe?.hasAttribute('allowfullscreen')).toBe(true);
    expect(iframe?.getAttribute('referrerpolicy')).toBe(
      'strict-origin-when-cross-origin',
    );
    iframe?.dispatchEvent(new Event('load'));
    await flush();
    expect(loads).toHaveBeenCalledOnce();
    expect(errors).not.toHaveBeenCalled();
  });

  it('sizes generic iframe code from the code', () => {
    const element = create({ eager: '' });
    element.html = mapsCode;
    document.body.append(element);
    const wrapper = element.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('600 / 450');
    expect(wrapper.style.maxWidth).toBe('600px');
    element.html = datawrapperCode;
    const fixed = element.firstElementChild as HTMLElement;
    expect(fixed.style.height).toBe('200px');
    element.setAttribute('height', '300');
    expect((element.firstElementChild as HTMLElement).style.height).toBe(
      '300px',
    );
  });

  it('passes an empty sandbox and leaves out a missing allowfullscreen', () => {
    const element = create({ eager: '' });
    element.html =
      '<iframe src="https://example.com/" sandbox srcdoc="<b>x</b>"></iframe>';
    document.body.append(element);
    const iframe = element.querySelector('iframe');
    expect(iframe?.getAttribute('sandbox')).toBe('');
    expect(iframe?.hasAttribute('allowfullscreen')).toBe(false);
    expect(iframe?.hasAttribute('srcdoc')).toBe(false);
  });

  it.each([
    ['a YouTube iframe with a bad id', 'https://www.youtube.com/embed/!!bad'],
    ['an http iframe', 'http://example.com/'],
  ])('reports %s as unrecognised embed code', async (_, src) => {
    const element = create();
    element.html = `<iframe src="${src}"></iframe>`;
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    expect(errors.mock.calls[0]?.[0].message).toBe(
      'social-embeds: unrecognised embed code',
    );
    expect(element.childElementCount).toBe(0);
  });

  it('never renders a URL as a generic iframe', async () => {
    const url = 'https://www.google.com/maps/embed?pb=x';
    const element = create({ url, eager: '' });
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    expect(errors.mock.calls[0]?.[0].message).toBe(
      `social-embeds: not a supported post URL: ${url}`,
    );
    expect(element.childElementCount).toBe(0);
  });

  it('reports a Bluesky URL that needs a lookup', async () => {
    const element = create({ url: BLUESKY_HANDLE });
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    expect(errors.mock.calls[0]?.[0].message).toBe(lookupMessage('Bluesky'));
  });

  it('reports a Rumble page URL that needs a lookup', async () => {
    const element = create({ url: RUMBLE_PAGE, eager: '' });
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    expect(errors).toHaveBeenCalledOnce();
    expect(errors.mock.calls[0]?.[0].message).toBe(
      'social-embeds: a Rumble URL needs a lookup: use the embed code',
    );
    expect(element.childElementCount).toBe(0);
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

  it('restyles an iframe embed in place when the layout or eager changes', async () => {
    const element = create({ url: YOUTUBE, eager: '' }, '<p>wait</p>');
    document.body.append(element);
    const { loads } = listen(element);
    const [wrapper] = outputs(element);
    const iframe = element.querySelector('iframe');
    iframe?.dispatchEvent(new Event('load'));
    await flush();
    element.setAttribute('width', '300');
    element.setAttribute('max-width', '400');
    element.setAttribute('height', '200');
    element.setAttribute('max-height', '500');
    element.removeAttribute('eager');
    await flush();
    expect([...outputs(element)]).toEqual([wrapper]);
    expect(element.querySelector('iframe')).toBe(iframe);
    expect(wrapper?.querySelector('p')).toBeNull();
    const { style } = wrapper as HTMLElement;
    expect([
      style.width,
      style.maxWidth,
      style.height,
      style.maxHeight,
    ]).toEqual(['300px', '400px', '200px', '500px']);
    expect(loads).toHaveBeenCalledOnce();
  });

  it('restyles a script embed in place', async () => {
    const load = vi.fn();
    page.twttr = {
      widgets: { load },
      events: { bind: () => {}, unbind: () => {} },
    };
    const element = create({ url: 'https://x.com/jack/status/20', eager: '' });
    document.body.append(element);
    await flush();
    const [wrapper] = outputs(element);
    element.setAttribute('width', '50%');
    element.setAttribute('max-width', '400px');
    await flush();
    expect([...outputs(element)]).toEqual([wrapper]);
    expect((wrapper as HTMLElement).style.width).toBe('50%');
    expect((wrapper as HTMLElement).style.maxWidth).toBe('400px');
    expect(load).toHaveBeenCalledOnce();
  });

  it('starts when eager turns on before the embed started', () => {
    const element = create({ url: YOUTUBE });
    document.body.append(element);
    expect(iframes(element)).toHaveLength(0);
    element.eager = true;
    const iframe = element.querySelector('iframe');
    expect(iframe).not.toBeNull();
    element.eager = false;
    element.eager = true;
    expect(element.querySelector('iframe')).toBe(iframe);
  });

  it('renders embed code written as its children', async () => {
    const element = create({ eager: '' }, xCode);
    const children = [...element.childNodes];
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    const [wrapper] = outputs(element);
    expect(wrapper?.querySelectorAll('blockquote')).toHaveLength(1);
    expect(wrapper?.textContent).toContain('just setting up my twttr');
    expect(wrapper?.querySelector('script')).toBeNull();
    expect([...element.childNodes].slice(0, -1)).toEqual(children);
    expect(errors).not.toHaveBeenCalled();
  });

  it('renders iframe code written as its children, with the skeleton', () => {
    const element = create({ eager: '' }, `<p>wait</p>${mapsCode}`);
    document.body.append(element);
    const [wrapper] = outputs(element);
    expect(wrapper?.querySelector('iframe')?.src).toBe(
      parseIframe(mapsCode)?.src,
    );
    expect(wrapper?.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(wrapper?.querySelector('p')).toBeNull();
  });

  it('prefers a template and a url over embed code in its children', () => {
    const element = create(
      { eager: '' },
      `${xCode}<template>${youtubeCode}</template>`,
    );
    document.body.append(element);
    expect(outputs(element)[0]?.querySelector('iframe')?.src).toContain(
      'youtube',
    );
    element.querySelector('template')?.remove();
    element.url = TELEGRAM;
    expect(outputs(element)[0]?.querySelector('iframe')?.src).toContain('t.me');
  });

  it('keeps unrecognised children as a silent placeholder', async () => {
    const element = create({ eager: '' }, '<p>wait</p>');
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    expect(outputs(element)).toHaveLength(0);
    expect(errors).not.toHaveBeenCalled();
    element.url = YOUTUBE;
    expect(outputs(element)[0]?.querySelector('p')?.textContent).toBe('wait');
  });

  it('keeps embed code from its children when a platform script renders them', async () => {
    const element = create({ eager: '' }, xCode);
    document.body.append(element);
    await flush();
    const [wrapper] = outputs(element);
    const rendered = document.createElement('div');
    rendered.innerHTML =
      '<iframe src="https://platform.twitter.com/embed/Tweet.html?id=20"></iframe>';
    element.querySelector(':scope > blockquote')?.replaceWith(rendered);
    await flush();
    expect([...outputs(element)]).toEqual([wrapper]);
    element.replaceChildren(...createRange(vimeoCode));
    await flush();
    expect(outputs(element)[0]?.querySelector('iframe')?.src).toContain(
      'player.vimeo.com',
    );
  });

  it.each([
    ['Instagram', 'https://www.instagram.com/p/Df75lxnmIrF/'],
    ['Threads', 'https://www.threads.com/@instagram/post/Df5MmLBm0O7'],
  ])('fails at once inside a shadow root: %s', async (label, url) => {
    const process = vi.fn();
    page.instgrm = { Embeds: { process } };
    const host = document.createElement('div');
    document.body.append(host);
    const element = create({ url, eager: '' });
    host.attachShadow({ mode: 'open' }).append(element);
    const { errors } = listen(element);
    await flush();
    expect(errors).toHaveBeenCalledOnce();
    expect(errors.mock.calls[0]?.[0].message).toBe(
      `social-embeds: the ${label} embed cannot render inside a shadow root`,
    );
    expect(process).not.toHaveBeenCalled();
    expect(element.querySelector('a[href]')?.textContent).toBe(
      `View this post on ${label}`,
    );
  });

  it('still renders X inside a shadow root', async () => {
    const load = vi.fn();
    page.twttr = {
      widgets: { load },
      events: { bind: () => {}, unbind: () => {} },
    };
    const host = document.createElement('div');
    document.body.append(host);
    const element = create({ url: 'https://x.com/jack/status/20', eager: '' });
    host.attachShadow({ mode: 'open' }).append(element);
    const { errors } = listen(element);
    await flush();
    expect(load).toHaveBeenCalledWith(
      element.querySelector('blockquote')?.parentElement,
    );
    expect(errors).not.toHaveBeenCalled();
  });

  it('strips ids from the placeholder copies', () => {
    const element = create(
      { url: YOUTUBE, eager: '' },
      '<div id="a"><p id="b">wait</p></div>',
    );
    document.body.append(element);
    const [wrapper] = outputs(element);
    expect(wrapper?.querySelector('p')?.textContent).toBe('wait');
    expect(wrapper?.querySelectorAll('[id]')).toHaveLength(0);
    expect(document.querySelectorAll('#a, #b')).toHaveLength(2);
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

  it('shows a copy of its children as the placeholder until load', async () => {
    const element = create({ url: YOUTUBE, eager: '' }, '<p>wait</p>');
    const original = element.querySelector('p');
    document.body.append(element);
    const { loads } = listen(element);
    const [wrapper] = outputs(element);
    expect(original?.parentNode).toBe(element);
    expect(wrapper?.querySelector('p')?.textContent).toBe('wait');
    expect(element.querySelector('[aria-hidden="true"]')).toBeNull();
    element.querySelector('iframe')?.dispatchEvent(new Event('load'));
    await flush();
    expect(wrapper?.querySelector('p')).toBeNull();
    expect(original?.parentNode).toBe(element);
    expect(loads).toHaveBeenCalledOnce();
    if (original) original.textContent = 'later';
    element.setAttribute('url', YOUTUBE_SHORT);
    expect(outputs(element)[0]?.querySelector('p')?.textContent).toBe('later');
  });

  it('renders only its output, never its own children', () => {
    const element = create(
      { url: YOUTUBE, eager: '' },
      'text<p>wait</p><!--?lit$1$-->',
    );
    const children = [...element.childNodes];
    document.body.append(element);
    expect([...element.childNodes].slice(0, -1)).toEqual(children);
    const slots = element.shadowRoot?.querySelectorAll('slot');
    expect(slots).toHaveLength(1);
    expect(slots?.[0]?.name).toBe('embed');
    expect(outputs(element)).toHaveLength(1);
    expect(slotted(element)).toEqual([...outputs(element)]);
  });

  it('leaves children added after render in place, without rendering again', async () => {
    const element = create({ url: YOUTUBE, eager: '' });
    document.body.append(element);
    const iframe = element.querySelector('iframe');
    const late = document.createElement('p');
    element.append(late);
    await flush();
    expect(late.parentNode).toBe(element);
    expect(element.querySelector('iframe')).toBe(iframe);
    expect(slotted(element)).toEqual([...outputs(element)]);
  });

  it('keeps a conditional React child and the embed when the condition flips', async () => {
    const view = (loading: boolean) =>
      createElement(
        'social-embed',
        { url: YOUTUBE, eager: true },
        loading ? createElement('p', null, 'Loading') : null,
        createElement('span', null, 'after'),
      );
    const { container, rerender } = render(view(true));
    const element = container.firstElementChild as SocialEmbedElement;
    const iframe = element.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(() => {
      rerender(view(false));
    }).not.toThrow();
    await flush();
    expect(element.querySelector(':scope > p')).toBeNull();
    expect(element.querySelector('iframe')).toBe(iframe);
    rerender(view(true));
    await flush();
    expect(element.querySelector(':scope > p')?.textContent).toBe('Loading');
    expect(element.querySelector('iframe')).toBe(iframe);
  });

  it('renders again when React replaces its text child', async () => {
    const view = (count: number) =>
      createElement(
        'social-embed',
        { url: YOUTUBE, eager: true },
        `Loading ${String(count)}`,
      );
    const { container, rerender } = render(view(1));
    const element = container.firstElementChild as SocialEmbedElement;
    expect(iframes(element)).toHaveLength(1);
    rerender(view(2));
    await flush();
    expect(element.firstChild?.textContent).toBe('Loading 2');
    expect(iframes(element)).toHaveLength(1);
    expect(outputs(element)[0]?.textContent).toBe('Loading 2');
  });

  it('renders again when outside code replaces its children', async () => {
    const element = create({ url: YOUTUBE, eager: '' }, '<p>wait</p>');
    document.body.append(element);
    const { errors } = listen(element);
    const iframe = element.querySelector('iframe');
    const fresh = document.createElement('p');
    fresh.textContent = 'morphed';
    element.replaceChildren(fresh);
    await flush();
    expect(iframe?.isConnected).toBe(false);
    expect(iframes(element)).toHaveLength(1);
    expect(outputs(element)).toHaveLength(1);
    expect(outputs(element)[0]?.querySelector('p')?.textContent).toBe(
      'morphed',
    );
    expect(errors).not.toHaveBeenCalled();
  });

  it('drops an output copied from another element and renders its own', () => {
    const element = create({ url: YOUTUBE, eager: '' }, '<p>wait</p>');
    document.body.append(element);
    const copy = element.cloneNode(true) as SocialEmbedElement;
    const stale = copy.querySelector('[slot="embed"]');
    expect(stale).not.toBeNull();
    document.body.append(copy);
    expect(stale?.isConnected).toBe(false);
    expect(outputs(copy)).toHaveLength(1);
    expect(iframes(copy)).toHaveLength(1);
    document.body.insertAdjacentHTML('beforeend', element.outerHTML);
    const saved = document.body.lastElementChild as SocialEmbedElement;
    expect(saved).toBeInstanceOf(SocialEmbedElement);
    expect(outputs(saved)).toHaveLength(1);
    expect(iframes(saved)).toHaveLength(1);
    expect(saved.querySelector('p')?.parentNode).toBe(saved);
  });

  it('replaces the skeleton with a link to the post when the platform script fails', async () => {
    loadPlatformScript.mockRejectedValueOnce(new Error('blocked'));
    const url = 'https://x.com/jack/status/20';
    const element = create({ url, eager: '' });
    document.body.append(element);
    const { errors } = listen(element);
    expect(element.querySelector('[aria-hidden="true"]')).not.toBeNull();
    await flush();
    expect(errors).toHaveBeenCalledOnce();
    expect(errors.mock.calls[0]?.[0].message).toBe('blocked');
    expect(element.querySelector('[aria-hidden="true"]')).toBeNull();
    const link = [...element.querySelectorAll('a')].find(
      (anchor) => anchor.textContent !== '',
    );
    expect(link?.getAttribute('href')).toBe(url);
    expect(link?.textContent).toBe('View this post on X');
  });

  it('keeps the fallback content of embed code when the platform script fails', async () => {
    loadPlatformScript.mockRejectedValueOnce(new Error('blocked'));
    const element = create({ eager: '' }, `<template>${xCode}</template>`);
    document.body.append(element);
    const { errors } = listen(element);
    await flush();
    expect(errors).toHaveBeenCalledOnce();
    expect(outputs(element)[0]?.textContent).toContain(
      'just setting up my twttr',
    );
    expect(element.textContent).not.toContain('View this post');
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

  it('waits for parsing before it reads its children', async () => {
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
    expect(element.querySelector(':scope > p')).not.toBeNull();
    expect(outputs(element)[0]?.querySelector('p')?.textContent).toBe('wait');
  });
});
