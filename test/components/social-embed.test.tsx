import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialEmbed } from '../../src';
import { parseIframe } from '../../src/parser';
import dailymotionOembed from '../fixtures/dailymotion/oembed.html?raw';
import dailymotion from '../fixtures/dailymotion/player-id-docs.html?raw';
import fbVideo from '../fixtures/facebook/video-sdk-docs.html?raw';
import instagram from '../fixtures/instagram/post-captioned.html?raw';
import linkedin from '../fixtures/linkedin/post-full.html?raw';
import pinterest from '../fixtures/pinterest/widget-docs.html?raw';
import reddit from '../fixtures/reddit/post-share.html?raw';
import snapchat from '../fixtures/snapchat/profile-share.html?raw';
import spotify from '../fixtures/spotify/oembed-track.html?raw';
import telegram from '../fixtures/telegram/widget-configurator.html?raw';
import threads from '../fixtures/threads/embed-dialog.html?raw';
import tiktok from '../fixtures/tiktok/oembed-player.html?raw';
import twitch from '../fixtures/twitch/docs-channel.html?raw';
import vimeo from '../fixtures/vimeo/responsive-docs.html?raw';
import x from '../fixtures/x/oembed-basic.html?raw';
import youtube from '../fixtures/youtube/share.html?raw';
import appleMusic from '../fixtures/applemusic/share-song.html?raw';
import applePodcasts from '../fixtures/applepodcasts/share-episode.html?raw';
import bluesky from '../fixtures/bluesky/oembed.html?raw';
import giphy from '../fixtures/giphy/embed-responsive.html?raw';
import kick from '../fixtures/kick/player-channel.html?raw';
import soundcloud from '../fixtures/soundcloud/share-visual.html?raw';
import tumblr from '../fixtures/tumblr/oembed.html?raw';
import mapsFixture from '../fixtures/generic/google-maps-embed.html?raw';
import { installObserver, installResizeObserver } from './helpers';

vi.mock('../../src/loader/platform-scripts', () => ({
  FACEBOOK_SDK_VERSION: 'v26.0',
  loadPlatformScript: vi.fn(() => new Promise(() => {})),
}));

const fixtures = import.meta.glob<string>('../fixtures/*/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function fixture(path: string): string {
  const html = fixtures[`../fixtures/${path}`];
  if (html === undefined) throw new Error(`no fixture ${path}`);
  return html;
}

const generic = Object.fromEntries(
  Object.entries(fixtures)
    .filter(([path]) => path.startsWith('../fixtures/generic/'))
    .map(([path, html]) => [path.replace('../fixtures/generic/', ''), html]),
);

function rendered(container: HTMLElement): string {
  const iframe = container.querySelector('iframe');
  if (iframe) return `iframe ${iframe.getAttribute('src') ?? ''}`;
  const root =
    container.firstElementChild?.firstElementChild?.firstElementChild
      ?.firstElementChild;
  if (!root) return 'nothing';
  // X, Instagram and Threads blockquotes get their class only when the post renders
  // (docs/decisions.md D39), so the host of the post's link tells them apart.
  const link =
    root.getAttribute('data-href') ??
    root.getAttribute('data-instgrm-permalink') ??
    root.getAttribute('data-text-post-permalink') ??
    // Pinterest: the pin link itself.
    root.getAttribute('href') ??
    root.querySelector('a[href*="/status/"]')?.getAttribute('href') ??
    '';
  const name = root.className ? `.${root.className}` : '';
  return `${root.tagName.toLowerCase()}${name} ${new URL(link).hostname}`;
}

beforeEach(() => {
  installObserver();
  // Flickr's frame waits for the box's width.
  installResizeObserver(640);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SocialEmbed with embed code', () => {
  it.each([
    ['X', x, 'blockquote x.com'],
    ['Instagram', instagram, 'blockquote www.instagram.com'],
    ['Threads', threads, 'blockquote www.threads.com'],
    ['Facebook', fbVideo, 'div.fb-video www.facebook.com'],
    [
      'TikTok',
      tiktok,
      'iframe https://www.tiktok.com/player/v1/7704834703446117662?embed_from=oembed&music_info=1&description=1&autoplay=1&muted=1',
    ],
    [
      'YouTube',
      youtube,
      'iframe https://www.youtube.com/embed/jNQXAC9IVRw?si=zgsn8wwuM9wOXrRk',
    ],
    ['Telegram', telegram, 'iframe https://t.me/telegram/83?embed=1'],
    [
      'Snapchat',
      snapchat,
      'iframe https://www.snapchat.com/@teamsnapchat/embed',
    ],
    [
      'LinkedIn',
      linkedin,
      'iframe https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7528828146767409153',
    ],
    [
      'Reddit',
      reddit,
      'iframe https://embed.reddit.com/r/reddit/comments/11zso11/?embed=true',
    ],
    ['Pinterest', pinterest, 'a www.pinterest.com'],
    [
      'Spotify',
      spotify,
      'iframe https://open.spotify.com/embed/track/0LrHzQHk5gYGbMsoVbKDuS',
    ],
    [
      'Vimeo',
      vimeo,
      'iframe https://player.vimeo.com/video/76979871?badge=0&autopause=0',
    ],
    [
      'Twitch',
      twitch,
      `iframe https://player.twitch.tv/?channel=twitch&muted=true&parent=${window.location.hostname}`,
    ],
    [
      'Dailymotion',
      dailymotion,
      'iframe https://geo.dailymotion.com/player/x8lr5.html?video=x84sh87&mute=true',
    ],
    [
      'Bluesky',
      bluesky,
      'iframe https://embed.bsky.app/embed/did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mxu3hsnebc2v',
    ],
    [
      'SoundCloud',
      soundcloud,
      'iframe https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F293&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true',
    ],
    [
      'Apple Music',
      appleMusic,
      'iframe https://embed.music.apple.com/us/song/1357820597',
    ],
    [
      'Apple Podcasts',
      applePodcasts,
      'iframe https://embed.podcasts.apple.com/us/podcast/id947965068?i=1000430702647',
    ],
    [
      'Tumblr',
      tumblr,
      'iframe https://embed.tumblr.com/embed/post/staff/828009069026721792/v2',
    ],
    ['Kick', kick, 'iframe https://player.kick.com/kick'],
    ['Giphy', giphy, 'iframe https://giphy.com/embed/l41YlHs99JsSptZf2'],
    [
      'Truth Social video',
      fixture('truthsocial/embed-dialog-video.html'),
      'iframe https://truthsocial.com/@truthsocial/117529982042129746/embed',
    ],
    [
      'Truth Social oEmbed',
      fixture('truthsocial/oembed-text.html'),
      'iframe https://truthsocial.com/@truthsocial/116862065232992052/embed',
    ],
    [
      'Imgur Embed dialog',
      fixture('imgur/embed-dialog-album.html'),
      'iframe https://imgur.com/a/04b1CmA/embed?pub=true',
    ],
    [
      'Imgur Embed dialog with Hide Title',
      fixture('imgur/embed-dialog-album-hide-title.html'),
      'iframe https://imgur.com/a/04b1CmA/embed?pub=true&context=false',
    ],
    [
      'Imgur oEmbed album',
      fixture('imgur/oembed-album.html'),
      'iframe https://imgur.com/a/04b1CmA/embed?pub=true',
    ],
    [
      'Imgur oEmbed image',
      fixture('imgur/oembed-image.html'),
      'iframe https://imgur.com/yOBT04V/embed?pub=true',
    ],
    [
      'Tenor Embed dialog',
      fixture('tenor/embed-dialog.html'),
      'iframe https://tenor.com/embed/12328062661350661133',
    ],
    [
      'Tenor oEmbed',
      fixture('tenor/oembed.html'),
      'iframe https://tenor.com/embed/12328062661350661133',
    ],
    [
      'Streamable API',
      fixture('streamable/api-embed-code.html'),
      'iframe https://streamable.com/e/lttg48',
    ],
    [
      'Streamable help center',
      fixture('streamable/embed-docs.html'),
      'iframe https://streamable.com/e/lttg48',
    ],
    [
      'Streamable oEmbed',
      fixture('streamable/oembed.html'),
      'iframe https://streamable.com/e/lttg48',
    ],
    [
      'Streamable player copy',
      fixture('streamable/player-copy-embed.html'),
      'iframe https://streamable.com/e/lttg48',
    ],
    [
      'Strava route',
      fixture('strava/route-derived.html'),
      'iframe https://strava-embeds.com/route/3247927232574435836?style=standard#ns=social-embeds',
    ],
    [
      'Flickr Embed dialog',
      fixture('flickr/embed-dialog.html'),
      'iframe https://embedr.flickr.com/photos/55618331478?width=640&height=360',
    ],
    [
      'Flickr Embed dialog with header and footer',
      fixture('flickr/embed-dialog-header-footer.html'),
      'iframe https://embedr.flickr.com/photos/55618331478?width=640&height=360&header=true&footer=true',
    ],
    [
      'Flickr Embed dialog with slideshow',
      fixture('flickr/embed-dialog-slideshow.html'),
      'iframe https://embedr.flickr.com/photos/55618331478?width=640&height=359&context=true',
    ],
    [
      'Flickr Embed dialog album',
      fixture('flickr/embed-dialog-album.html'),
      'iframe https://embedr.flickr.com/photosets/72157716823987722?width=640&height=480',
    ],
    [
      'Flickr oEmbed',
      fixture('flickr/oembed.html'),
      'iframe https://embedr.flickr.com/photos/55618331478?width=640&height=359',
    ],
    [
      'Flickr oEmbed album',
      fixture('flickr/oembed-album.html'),
      'iframe https://embedr.flickr.com/photosets/72157716823987722?width=640&height=480',
    ],
    [
      'Rumble Embed dialog',
      fixture('rumble/embed-dialog-iframe.html'),
      'iframe https://rumble.com/embed/v12onr1/?pub=4',
    ],
    [
      'Rumble oEmbed',
      fixture('rumble/oembed.html'),
      'iframe https://rumble.com/embed/v12onr1/',
    ],
  ])('routes %s embed code to its component', (_, html, expected) => {
    const { container } = render(<SocialEmbed html={html} lazy={false} />);
    expect(rendered(container)).toBe(expected);
  });

  it('hands unrecognised embed code to fallback, unchanged', () => {
    const html =
      '<p>Sanitised by the CMS</p><img src="https://maps.test/map.png">';
    const fallback = vi.fn((code: string) => (
      <div data-testid="host">{code}</div>
    ));
    const onError = vi.fn();
    const { getByTestId } = render(
      <SocialEmbed html={html} fallback={fallback} onError={onError} />,
    );
    expect(fallback).toHaveBeenCalledWith(html);
    expect(getByTestId('host').textContent).toBe(html);
    expect(onError).not.toHaveBeenCalled();
  });

  it('renders nothing and reports unrecognised embed code without a fallback', () => {
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed html="<p>hello</p>" onError={onError} />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: unrecognised embed code'),
    );
  });
});

describe('SocialEmbed with generic iframe code', () => {
  it.each(Object.entries(generic))(
    'renders the %s code as a generic iframe',
    (_, html) => {
      const fallback = vi.fn(() => <p>fallback</p>);
      const onError = vi.fn();
      const { container } = render(
        <SocialEmbed
          html={html}
          fallback={fallback}
          onError={onError}
          lazy={false}
        />,
      );
      expect(rendered(container)).toBe(
        `iframe ${parseIframe(html)?.src ?? ''}`,
      );
      expect(fallback).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    },
  );

  it('renders generic iframe code instead of calling fallback', () => {
    const fallback = vi.fn(() => <p>fallback</p>);
    render(<SocialEmbed html={mapsFixture} fallback={fallback} lazy={false} />);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('passes the frame props to the generic iframe', () => {
    const { container } = render(
      <SocialEmbed
        html={mapsFixture}
        className="map"
        maxWidth={400}
        height={300}
        lazy={false}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe('map');
    expect(wrapper.style.maxWidth).toBe('400px');
    expect(wrapper.style.height).toBe('300px');
  });

  it.each([
    [
      'a YouTube iframe with a bad id',
      '<iframe src="https://www.youtube.com/embed/!!bad"></iframe>',
    ],
    [
      'an unknown Facebook plugin',
      '<iframe src="https://www.facebook.com/plugins/unknown.php?href=x"></iframe>',
    ],
    ['an http iframe', '<iframe src="http://example.com/"></iframe>'],
    ['a javascript: iframe', '<iframe src="javascript:alert(1)"></iframe>'],
    ['two iframes', `${mapsFixture}${mapsFixture}`],
    ['code without an iframe', '<p>hello</p>'],
    ['Rumble’s script player code', fixture('rumble/embed-dialog-js.html')],
  ])('hands %s to fallback', (_, html) => {
    const fallback = vi.fn((code: string) => <p data-testid="host">{code}</p>);
    const { container, getByTestId } = render(
      <SocialEmbed html={html} fallback={fallback} lazy={false} />,
    );
    expect(fallback).toHaveBeenCalledWith(html);
    expect(getByTestId('host').textContent).toBe(html);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('reports a rejected iframe without a fallback', () => {
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed
        html='<iframe src="http://example.com/"></iframe>'
        onError={onError}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error('social-embeds: unrecognised embed code'),
    );
  });

  it('never renders a URL as a generic iframe', () => {
    const onError = vi.fn();
    const url = 'https://www.google.com/maps/embed?pb=x';
    const { container } = render(
      <SocialEmbed url={url} onError={onError} lazy={false} />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error(`social-embeds: not a supported post URL: ${url}`),
    );
  });
});

describe('SocialEmbed with a URL', () => {
  it.each([
    ['https://x.com/jack/status/20', 'blockquote x.com'],
    [
      'https://www.instagram.com/p/Df75lxnmIrF/',
      'blockquote www.instagram.com',
    ],
    ['https://www.threads.com/t/Df5MmLBm0O7', 'blockquote www.threads.com'],
    [
      'https://www.facebook.com/facebook/videos/10153231379946729/',
      'div.fb-video www.facebook.com',
    ],
    [
      'https://www.tiktok.com/@tiktok/video/7704834703446117662',
      'iframe https://www.tiktok.com/player/v1/7704834703446117662',
    ],
    [
      'https://youtu.be/jNQXAC9IVRw?t=90',
      'iframe https://www.youtube.com/embed/jNQXAC9IVRw?start=90',
    ],
    ['https://t.me/s/telegram/83', 'iframe https://t.me/telegram/83?embed=1'],
    [
      'https://www.snapchat.com/lens/6451403405463552',
      'iframe https://www.snapchat.com/lens/6451403405463552/embed',
    ],
    [
      'https://www.linkedin.com/feed/update/urn:li:activity:7528828146767409153/',
      'iframe https://www.linkedin.com/embed/feed/update/urn:li:activity:7528828146767409153',
    ],
    [
      'https://old.reddit.com/r/reddit/comments/11zso11/comment/jde89cx/',
      'iframe https://embed.reddit.com/r/reddit/comments/11zso11/comment/jde89cx/?embed=true',
    ],
    ['https://bg.pinterest.com/pin/424605071145752542/', 'a www.pinterest.com'],
    [
      'https://open.spotify.com/intl-de/playlist/37i9dQZF1DX4sWSpwq3LiO',
      'iframe https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO',
    ],
    [
      'https://vimeo.com/76979871/abcdef1234',
      'iframe https://player.vimeo.com/video/76979871?h=abcdef1234',
    ],
    [
      'https://clips.twitch.tv/LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      `iframe https://clips.twitch.tv/embed?clip=LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu&parent=${window.location.hostname}`,
    ],
    [
      'https://truthsocial.com/@truthsocial/posts/117529982042129746',
      'iframe https://truthsocial.com/@truthsocial/117529982042129746/embed',
    ],
    [
      'https://imgur.com/gallery/04b1CmA',
      'iframe https://imgur.com/a/04b1CmA/embed?pub=true',
    ],
    [
      'https://i.imgur.com/yOBT04V.jpeg',
      'iframe https://imgur.com/yOBT04V/embed?pub=true',
    ],
    [
      'https://tenor.com/en-GB/view/happy-cat-day-national-cat-day-cat-day-cat-cat-lover-gif-12328062661350661133',
      'iframe https://tenor.com/embed/12328062661350661133',
    ],
    ['https://streamable.com/lttg48', 'iframe https://streamable.com/e/lttg48'],
    [
      'https://www.strava.com/routes/3247927232574435836',
      'iframe https://strava-embeds.com/route/3247927232574435836?style=standard#ns=social-embeds',
    ],
    [
      'https://flic.kr/p/2sJNueC',
      'iframe https://embedr.flickr.com/photos/55618331478?width=640&height=480',
    ],
    [
      'https://www.flickr.com/photos/flickr/albums/72157716823987722',
      'iframe https://embedr.flickr.com/photosets/72157716823987722?width=640&height=480',
    ],
    [
      'https://rumble.com/embed/v12onr1/',
      'iframe https://rumble.com/embed/v12onr1/',
    ],
  ])('routes %s', (url, expected) => {
    const { container } = render(<SocialEmbed url={url} lazy={false} />);
    expect(rendered(container)).toBe(expected);
  });

  it('reports an unsupported URL and never calls fallback for it', () => {
    const fallback = vi.fn(() => <div>fallback</div>);
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed
        url="https://fb.watch/abc123/"
        fallback={fallback}
        onError={onError}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(fallback).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: not a supported post URL: https://fb.watch/abc123/',
      ),
    );
  });
});

describe('SocialEmbed with Dailymotion', () => {
  // The dispatcher takes no Player ID: only embed code that carries one renders (D63).
  it('reports a URL, which carries no Player ID', () => {
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed
        url="https://www.dailymotion.com/video/x84sh87"
        onError={onError}
        lazy={false}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: a Dailymotion embed needs a Player ID: pass playerId to DailymotionEmbed',
      ),
    );
  });

  // Dailymotion answers code without a Player ID with 403, so it never reaches fallback.
  it('reports embed code without a Player ID, even with a fallback', () => {
    const onError = vi.fn();
    const fallback = vi.fn();
    const { container } = render(
      <SocialEmbed
        html={dailymotionOembed}
        fallback={fallback}
        onError={onError}
        lazy={false}
      />,
    );
    expect(fallback).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: a Dailymotion embed needs a Player ID: pass playerId to DailymotionEmbed',
      ),
    );
  });
});

describe('SocialEmbed with wave 4 URLs', () => {
  it('reports a Bluesky handle URL as needing a lookup', () => {
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed
        url="https://bsky.app/profile/bsky.app/post/3mxu3hsnebc2v"
        onError={onError}
      />,
    );
    expect(container.innerHTML).toBe('');
    expect(onError).toHaveBeenCalledWith(
      new Error(
        'social-embeds: a Bluesky URL needs a lookup: use the embed code',
      ),
    );
  });

  it('renders a SoundCloud URL as the 400px visual player', () => {
    const { container } = render(
      <SocialEmbed
        url="https://soundcloud.com/forss/flickermood"
        lazy={false}
      />,
    );
    expect(rendered(container)).toBe(
      'iframe https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fforss%2Fflickermood&visual=true',
    );
    expect((container.firstElementChild as HTMLElement).style.height).toBe(
      '400px',
    );
  });

  it('passes height to the wave 4 iframe embeds', () => {
    const { container } = render(
      <SocialEmbed url="https://kick.com/kick" height={300} lazy={false} />,
    );
    expect((container.firstElementChild as HTMLElement).style.height).toBe(
      '300px',
    );
  });
});

describe('SocialEmbed props', () => {
  it('forwards wrapper props, and height to iframe embeds', () => {
    const { container } = render(
      <SocialEmbed
        url="https://youtu.be/jNQXAC9IVRw"
        className="embed"
        maxWidth={640}
        height={360}
      />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe('embed');
    expect(wrapper.style.maxWidth).toBe('640px');
    expect(wrapper.style.height).toBe('360px');
  });

  it('forwards maxHeight to iframe embeds only', () => {
    const video = render(
      <SocialEmbed
        url="https://youtube.com/shorts/jNQXAC9IVRw"
        maxHeight={640}
      />,
    );
    expect(
      (video.container.firstElementChild as HTMLElement).style.maxWidth,
    ).toBe('360px');

    // A script-based embed sizes itself: the prop must not reach its wrapper div.
    const post = render(
      <SocialEmbed url="https://x.com/jack/status/20" maxHeight={640} />,
    );
    const wrapper = post.container.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute('maxheight')).toBe(false);
    expect(wrapper.style.maxWidth).toBe('550px');
  });

  it('forwards height to LinkedIn and Snapchat, not to Telegram or Reddit', () => {
    const fixed = render(
      <SocialEmbed
        url="https://www.linkedin.com/feed/update/urn:li:share:7528828146767409153/"
        height={900}
      />,
    );
    expect(
      (fixed.container.firstElementChild as HTMLElement).style.height,
    ).toBe('900px');

    // Telegram sizes itself from its frame's messages, starting at 300px.
    const sized = render(
      <SocialEmbed url="https://t.me/telegram/83" height={900} />,
    );
    expect(
      (sized.container.firstElementChild as HTMLElement).style.height,
    ).toBe('300px');
  });

  it('forwards height to the wave 3 iframes', () => {
    for (const url of [
      'https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS',
      'https://vimeo.com/76979871',
      'https://www.twitch.tv/twitch',
    ]) {
      const { container } = render(<SocialEmbed url={url} height={400} />);
      expect((container.firstElementChild as HTMLElement).style.height).toBe(
        '400px',
      );
      cleanup();
    }
  });

  it('forwards height to Tenor, Streamable, Rumble and Flickr, not to Truth Social, Imgur or Strava', () => {
    for (const url of [
      'https://tenor.com/view/12328062661350661133',
      'https://streamable.com/lttg48',
      'https://rumble.com/embed/v12onr1/',
      'https://flic.kr/p/2sJNueC',
    ]) {
      const { container } = render(
        <SocialEmbed url={url} height={400} maxHeight={300} />,
      );
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.style.height).toBe('400px');
      expect(wrapper.style.maxHeight).toBe('300px');
      cleanup();
    }

    // These size themselves from their frames' messages, starting at the plan's height.
    for (const [url, start] of [
      [
        'https://truthsocial.com/@truthsocial/posts/117529982042129746',
        '300px',
      ],
      ['https://imgur.com/a/04b1CmA', '500px'],
      ['https://www.strava.com/routes/3247927232574435836', '650px'],
    ] as const) {
      const { container } = render(
        <SocialEmbed url={url} height={400} maxHeight={300} />,
      );
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.style.height).toBe(start);
      expect(wrapper.style.maxHeight).toBe('');
      cleanup();
    }
  });

  it('accepts html or url, never both or neither', () => {
    // Checked by `pnpm typecheck`: each element below must be a type error.
    const invalid = [
      // @ts-expect-error -- html and url are mutually exclusive
      <SocialEmbed key="both" html={x} url="https://x.com/jack/status/20" />,
      // @ts-expect-error -- one of html or url is required
      <SocialEmbed key="neither" />,
    ];
    expect(invalid).toHaveLength(2);
  });
});
