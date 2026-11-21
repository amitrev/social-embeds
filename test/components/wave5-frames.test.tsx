import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FlickrEmbed,
  ImgurEmbed,
  SocialEmbed,
  StravaEmbed,
  TruthSocialEmbed,
} from '../../src';
import { parseEmbed, type ParsedEmbed } from '../../src/parser';
import flickrAlbum from '../fixtures/flickr/embed-dialog-album.html?raw';
import flickrDialog from '../fixtures/flickr/embed-dialog.html?raw';
import flickrHeaderFooter from '../fixtures/flickr/embed-dialog-header-footer.html?raw';
import imgurAlbum from '../fixtures/imgur/embed-dialog-album.html?raw';
import imgurImage from '../fixtures/imgur/oembed-image.html?raw';
import stravaRoute from '../fixtures/strava/route-derived.html?raw';
import truthVideo from '../fixtures/truthsocial/embed-dialog-video.html?raw';
import truthText from '../fixtures/truthsocial/oembed-text.html?raw';
import {
  installObserver,
  installResizeObserver,
  lastResizeObserver,
} from './helpers';

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

function post(
  source: MessageEventSource | null,
  origin: string,
  data: unknown,
) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
  });
}

const TRUTH = 'https://truthsocial.com';
const setHeight = (height: number) => ({
  type: 'setHeight',
  id: undefined,
  height,
});
const IMGUR = 'https://imgur.com';
const resizeImgur = (height: number) =>
  JSON.stringify({
    message: 'resize_imgur',
    href: 'https://imgur.com/a/04b1CmA/embed?pub=true',
    height,
    width: 360,
    context: true,
  });
const STRAVA = 'https://strava-embeds.com';
const stravaHeight = (height: number) => [
  'social-embeds',
  'BROADCAST_IFRAME_HEIGHT',
  height,
];

beforeEach(() => {
  installObserver();
  installResizeObserver();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TruthSocialEmbed', () => {
  it('renders the post frame at 300px, at most 600px wide', () => {
    const { container } = render(
      <TruthSocialEmbed embed={parsed(truthText)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://truthsocial.com/@truthsocial/116862065232992052/embed',
    );
    expect(iframe.getAttribute('scrolling')).toBe('no');
    expect(wrapper.style.height).toBe('300px');
    expect(wrapper.style.maxWidth).toBe('600px');
  });

  it('renders a URL as the same frame', () => {
    const { container } = render(
      <TruthSocialEmbed
        url="https://truthsocial.com/@truthsocial/posts/116862065232992052"
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://truthsocial.com/@truthsocial/116862065232992052/embed',
    );
  });

  it('takes the height the frame posts, and calls onLoad', () => {
    const onLoad = vi.fn();
    const { container } = render(
      <TruthSocialEmbed
        embed={parsed(truthText)}
        onLoad={onLoad}
        lazy={false}
      />,
    );
    const { wrapper, iframe } = parts(container);
    post(iframe.contentWindow, TRUTH, setHeight(221));
    expect(wrapper.style.height).toBe('221px');
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('adds 165px to the heights of a video post', () => {
    const { container } = render(
      <TruthSocialEmbed embed={parsed(truthVideo)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(wrapper.style.height).toBe('300px');
    post(iframe.contentWindow, TRUTH, setHeight(530));
    expect(wrapper.style.height).toBe('695px');
    post(iframe.contentWindow, TRUTH, setHeight(586));
    expect(wrapper.style.height).toBe('751px');
  });

  it('ignores heights from another origin or another window', () => {
    const { container } = render(
      <TruthSocialEmbed embed={parsed(truthText)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    post(iframe.contentWindow, 'https://evil.example', setHeight(900));
    post(window, TRUTH, setHeight(900));
    expect(wrapper.style.height).toBe('300px');
  });
});

describe('ImgurEmbed', () => {
  it('renders the album frame with the title link as its placeholder', () => {
    const { container } = render(
      <ImgurEmbed embed={parsed(imgurAlbum)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      'https://imgur.com/a/04b1CmA/embed?pub=true',
    );
    expect(wrapper.style.height).toBe('500px');
    expect(wrapper.style.maxWidth).toBe('540px');
    expect(container.querySelector('blockquote a')?.getAttribute('href')).toBe(
      'https://imgur.com/a/04b1CmA',
    );
  });

  it('renders the image frame', () => {
    const { container } = render(
      <ImgurEmbed embed={parsed(imgurImage)} lazy={false} />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://imgur.com/yOBT04V/embed?pub=true',
    );
  });

  it('renders a gallery URL as its album frame, and hides the title', () => {
    const { container } = render(
      <ImgurEmbed
        url="https://imgur.com/gallery/its-imgurs-16th-birthday-week-04b1CmA"
        context={false}
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://imgur.com/a/04b1CmA/embed?pub=true&context=false',
    );
  });

  it('takes the height the frame posts, removing the placeholder', () => {
    const { container } = render(
      <ImgurEmbed embed={parsed(imgurAlbum)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    post(iframe.contentWindow, IMGUR, resizeImgur(415));
    expect(wrapper.style.height).toBe('415px');
    expect(container.querySelector('blockquote')).toBeNull();
  });

  it('ignores heights from another origin or another window', () => {
    const { container } = render(
      <ImgurEmbed embed={parsed(imgurAlbum)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    post(iframe.contentWindow, 'https://i.imgur.com', resizeImgur(415));
    post(window, IMGUR, resizeImgur(415));
    expect(wrapper.style.height).toBe('500px');
  });
});

describe('StravaEmbed', () => {
  const ROUTE = '3247927232574435836';

  it('renders the route frame at 650px, at most 554px wide', () => {
    const { container } = render(
      <StravaEmbed embed={parsed(stravaRoute)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      `https://strava-embeds.com/route/${ROUTE}?style=standard#ns=social-embeds`,
    );
    expect(wrapper.style.height).toBe('650px');
    expect(wrapper.style.maxWidth).toBe('554px');
  });

  it('renders an activity URL with the option props', () => {
    const { container } = render(
      <StravaEmbed
        url="https://www.strava.com/activities/123456"
        embedStyle="minimal"
        mapHash="abc"
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      'https://strava-embeds.com/activity/123456?style=minimal#ns=social-embeds&mapHash=abc',
    );
  });

  it('renders a full-width route with no maximum width', () => {
    const { container } = render(
      <StravaEmbed embed={parsed(stravaRoute)} fullWidth lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    expect(iframe.getAttribute('src')).toBe(
      `https://strava-embeds.com/route/${ROUTE}?style=standard&fullWidth=true#ns=social-embeds`,
    );
    expect(wrapper.style.maxWidth).toBe('');
  });

  it('keeps the verified id when a host-built embed names another', () => {
    const embed = parsed(stravaRoute);
    const { container } = render(
      <StravaEmbed
        embed={{
          ...embed,
          options: { embedId: '1', embedType: 'activity', id: '2' },
        }}
        lazy={false}
      />,
    );
    expect(parts(container).iframe.getAttribute('src')).toBe(
      `https://strava-embeds.com/route/${ROUTE}?style=standard#ns=social-embeds`,
    );
  });

  it('keeps the wrapper style prop', () => {
    const { container } = render(
      <StravaEmbed
        embed={parsed(stravaRoute)}
        style={{ margin: '0 auto' }}
        lazy={false}
      />,
    );
    expect(parts(container).wrapper.style.margin).toBe('0px auto');
  });

  it('takes the height the frame posts', () => {
    const { container } = render(
      <StravaEmbed embed={parsed(stravaRoute)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    post(iframe.contentWindow, STRAVA, stravaHeight(571));
    expect(wrapper.style.height).toBe('571px');
  });

  it('ignores heights from another origin or another window', () => {
    const { container } = render(
      <StravaEmbed embed={parsed(stravaRoute)} lazy={false} />,
    );
    const { wrapper, iframe } = parts(container);
    post(iframe.contentWindow, 'https://www.strava.com', stravaHeight(571));
    post(window, STRAVA, stravaHeight(571));
    expect(wrapper.style.height).toBe('650px');
  });
});

describe('FlickrEmbed', () => {
  const LONG = 'https://www.flickr.com/photos/flickr/55618331478/';

  it('shows the linked image at the image ratio until the frame loads', () => {
    const onLoad = vi.fn();
    const { container } = render(
      <FlickrEmbed embed={parsed(flickrDialog)} onLoad={onLoad} lazy={false} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.aspectRatio).toBe('4096 / 2301');
    expect(wrapper.style.maxWidth).toBe('4096px');
    const image = container.querySelector('a > img') as HTMLElement;
    expect(image.getAttribute('src')).toBe(
      'https://live.staticflickr.com/65535/55618331478_aa284e58b6_4k.jpg',
    );
    expect(image.style.width).toBe('100%');
    expect(container.querySelector('iframe')).toBeNull();

    lastResizeObserver().resize(800);
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photos/55618331478?width=800&height=449',
    );
    fireEvent.load(iframe);
    expect(container.querySelector('img')).toBeNull();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('rebuilds the frame when the box width changes', () => {
    const { container } = render(
      <FlickrEmbed embed={parsed(flickrHeaderFooter)} lazy={false} />,
    );
    const observer = lastResizeObserver();
    observer.resize(800);
    observer.resize(375);
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photos/55618331478?width=375&height=211&header=true&footer=true',
    );
  });

  it('renders an album as its slideshow frame', () => {
    const { container } = render(
      <FlickrEmbed embed={parsed(flickrAlbum)} lazy={false} />,
    );
    lastResizeObserver().resize(400);
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photosets/72157716823987722?width=400&height=300',
    );
  });

  it('renders a URL at 4:3, and a flic.kr URL as the same frame', () => {
    const long = render(<FlickrEmbed url={LONG} lazy={false} />);
    lastResizeObserver().resize(600);
    const longSrc = long.container.querySelector('iframe')?.getAttribute('src');
    expect(longSrc).toBe(
      'https://embedr.flickr.com/photos/55618331478?width=600&height=450',
    );
    expect(
      (long.container.firstElementChild as HTMLElement).style.aspectRatio,
    ).toBe('4 / 3');
    cleanup();

    const short = render(
      <FlickrEmbed url="https://flic.kr/p/2sJNueC" lazy={false} />,
    );
    lastResizeObserver().resize(600);
    expect(short.container.querySelector('iframe')?.getAttribute('src')).toBe(
      longSrc,
    );
  });

  it('adds the option props', () => {
    const { container } = render(
      <FlickrEmbed url={LONG} header context lazy={false} />,
    );
    lastResizeObserver().resize(600);
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photos/55618331478?width=600&height=450&header=true&context=true',
    );
  });
});

describe('SocialEmbed with the wave 5 frames', () => {
  it.each([
    [
      truthText,
      'https://truthsocial.com/@truthsocial/116862065232992052/embed',
    ],
    [imgurAlbum, 'https://imgur.com/a/04b1CmA/embed?pub=true'],
    [
      stravaRoute,
      'https://strava-embeds.com/route/3247927232574435836?style=standard#ns=social-embeds',
    ],
  ])('renders the frame of %s', (html, src) => {
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed html={html} onError={onError} lazy={false} />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(src);
    expect(onError).not.toHaveBeenCalled();
  });

  it('renders Flickr embed code, narrowed to a maxHeight', () => {
    const onError = vi.fn();
    const { container } = render(
      <SocialEmbed
        html={flickrDialog}
        maxHeight={449}
        onError={onError}
        lazy={false}
      />,
    );
    lastResizeObserver().resize(799);
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://embedr.flickr.com/photos/55618331478?width=799&height=449',
    );
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe(
      '799px',
    );
    expect(onError).not.toHaveBeenCalled();
  });
});
