import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LinkedInEmbed,
  RedditEmbed,
  SnapchatEmbed,
  TelegramEmbed,
} from '../../src';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import linkedinCollapsed from '../fixtures/linkedin/post-collapsed.html?raw';
import redditComment from '../fixtures/reddit/comment-share.html?raw';
import redditPost from '../fixtures/reddit/post-share.html?raw';
import snapchatLens from '../fixtures/snapchat/lens-share.html?raw';
import telegramOptions from '../fixtures/telegram/widget-configurator-options.html?raw';
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

beforeEach(() => {
  installObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TelegramEmbed', () => {
  it('renders the post iframe, at most 500px wide, sized by its messages', () => {
    const onLoad = vi.fn();
    const { container } = render(
      <TelegramEmbed
        url="https://t.me/telegram/83"
        lazy={false}
        onLoad={onLoad}
      />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe('https://t.me/telegram/83?embed=1');
    expect(iframe.getAttribute('title')).toBe('Telegram post');
    expect(iframe.getAttribute('scrolling')).toBe('no');
    expect(wrapper.style.maxWidth).toBe('500px');
    expect(wrapper.style.aspectRatio).toBe('');

    post(iframe, 'https://t.me', '{"event":"resize","height":540}');
    expect(wrapper.style.height).toBe('540px');
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('ignores Reddit-shaped messages and messages from other origins', () => {
    const { container } = render(
      <TelegramEmbed url="https://t.me/telegram/83" lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    const before = wrapper.style.height;
    post(iframe, 'https://t.me', '{"type":"resize.embed","data":316}');
    post(iframe, 'https://embed.reddit.com', '{"event":"resize","height":540}');
    expect(wrapper.style.height).toBe(before);
  });

  it('passes the configurator options as the widget script does', () => {
    const { container } = render(
      <TelegramEmbed embed={parsed(telegramOptions)} lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://t.me/telegram/83?embed=1&userpic=false&color=E22F38&dark=1&dark_color=F95C54',
    );
  });

  it('keeps single and comment from the URL, and lets props override options', () => {
    const { container } = render(
      <TelegramEmbed
        embed={parsed(telegramOptions)}
        dark={false}
        userpic
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://t.me/telegram/83?embed=1&userpic=true&color=E22F38&dark=0&dark_color=F95C54',
    );

    cleanup();
    const second = render(
      <TelegramEmbed
        url="https://t.me/telegram/83?single&comment=12"
        lazy={false}
      />,
    );
    expect(parts(second.container).iframe.getAttribute('src')).toBe(
      'https://t.me/telegram/83?embed=1&comment=12&single=1',
    );
  });

  it('reports a URL of another platform', () => {
    const onError = vi.fn();
    render(
      <TelegramEmbed
        url="https://www.reddit.com/r/reddit/comments/11zso11/"
        onError={onError}
      />,
    );
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: not a Telegram post URL: https://www.reddit.com/r/reddit/comments/11zso11/',
      ),
    );
  });
});

describe('RedditEmbed', () => {
  it('builds the embed.reddit.com iframe without the host page URL', () => {
    const { container } = render(
      <RedditEmbed embed={parsed(redditPost)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://embed.reddit.com/r/reddit/comments/11zso11/?embed=true',
    );
    expect(iframe.getAttribute('sandbox')).toBe(
      'allow-scripts allow-same-origin allow-popups',
    );
    expect(iframe.getAttribute('allow')).toBe(
      'clipboard-read; clipboard-write',
    );
    expect(iframe.getAttribute('title')).toBe('Reddit post');
    expect(wrapper.style.maxWidth).toBe('640px');
    // The embed code's data-embed-height, until the frame reports its own.
    expect(wrapper.style.height).toBe('316px');

    post(
      iframe,
      'https://embed.reddit.com',
      '{"type":"resize.embed","data":402}',
    );
    expect(wrapper.style.height).toBe('402px');
  });

  it('rejects a host-built embed whose URL is not the canonical one', () => {
    const onError = vi.fn();
    const { container } = render(
      <RedditEmbed
        embed={{
          ...parsed(redditPost),
          url: 'https://reddit.com/r/ab/comments/11zso11/',
        }}
        onError={onError}
        lazy={false}
      />,
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('embeds a comment', () => {
    const { container } = render(
      <RedditEmbed embed={parsed(redditComment)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://embed.reddit.com/r/reddit/comments/11zso11/comment/jde89cx/?embed=true',
    );
    expect(wrapper.style.height).toBe('552px');
  });

  it('passes options from embed code and props', () => {
    const embed = parsed(
      redditPost.replace(
        'data-embed-height="316"',
        'data-embed-height="316" data-embed-theme="dark" data-embed-showmedia="false"',
      ),
    );
    const { container } = render(
      <RedditEmbed embed={embed} locale="bg-BG" showMedia lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://embed.reddit.com/r/reddit/comments/11zso11/?embed=true&theme=dark&showmedia=true&locale=bg-BG',
    );
  });
});

describe('SnapchatEmbed', () => {
  it('renders the /embed page of a Lens at the embed code size', () => {
    const { container } = render(
      <SnapchatEmbed embed={parsed(snapchatLens)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://www.snapchat.com/lens/41b1e6372aa44fb89f903ecd48a4ab8b/embed',
    );
    expect(iframe.getAttribute('allow')).toBe(
      'autoplay; camera; microphone; clipboard-write;',
    );
    expect(iframe.getAttribute('title')).toBe('Dog Lens');
    expect(wrapper.style.aspectRatio).toBe('416 / 692');
    expect(wrapper.style.maxWidth).toBe('416px');
  });

  it('renders a profile from its URL at 416:692', () => {
    const { container } = render(
      <SnapchatEmbed
        url="https://www.snapchat.com/add/teamsnapchat"
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://www.snapchat.com/@teamsnapchat/embed',
    );
    expect(iframe.getAttribute('title')).toBe('Snapchat');
    expect(wrapper.style.aspectRatio).toBe('416 / 692');
  });
});

describe('LinkedInEmbed', () => {
  it('keeps the embed code height and width', () => {
    const { container } = render(
      <LinkedInEmbed embed={parsed(linkedinCollapsed)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7528828146767409153?collapsed=1',
    );
    expect(iframe.getAttribute('title')).toBe('LinkedIn post');
    expect(wrapper.style.height).toBe('525px');
    expect(wrapper.style.maxWidth).toBe('504px');
    expect(wrapper.style.aspectRatio).toBe('');
  });

  it('uses 670px for a URL, and the height prop over both', () => {
    const { container } = render(
      <LinkedInEmbed
        url="https://www.linkedin.com/posts/someone_title-activity-7528828146767409153-Ab1c"
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://www.linkedin.com/embed/feed/update/urn:li:activity:7528828146767409153',
    );
    expect(wrapper.style.height).toBe('670px');

    cleanup();
    const second = render(
      <LinkedInEmbed
        embed={parsed(linkedinCollapsed)}
        height={900}
        collapsed={false}
        lazy={false}
      />,
    );
    const next = parts(second.container);
    expect(next.wrapper.style.height).toBe('900px');
    expect(next.iframe.getAttribute('src')).toBe(
      'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7528828146767409153',
    );
  });
});
