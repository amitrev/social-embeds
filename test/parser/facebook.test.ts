import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed, parseIframe } from '../../src/parser';
import { verifyEmbed } from '../../src/parser/verify';
import postIframe from '../fixtures/facebook/post-iframe.html?raw';
import postSdk from '../fixtures/facebook/post-sdk-docs.html?raw';
import videoIframe from '../fixtures/facebook/video-iframe-reel.html?raw';
import videoSdk from '../fixtures/facebook/video-sdk-docs.html?raw';

const pfbid =
  'pfbid0LNzRz67SN7wHoVMbZnhzwU3Cu7RwipTFrJw8jqo88cP3Ay3uezQjjA5n4XeSLRvAl';
const docsVideo = 'https://www.facebook.com/facebook/videos/10153231379946729/';
const reel = 'https://www.facebook.com/reel/1523911562856332';

describe('Facebook post embed code', () => {
  it('renders the post iframe through the SDK, keeping show_text and width', () => {
    expect(parseEmbed(postIframe)).toEqual({
      platform: 'facebook',
      kind: 'post',
      url: `https://www.facebook.com/facebook/posts/${pfbid}`,
      id: pfbid,
      variant: 'sdk',
      options: { showText: true, width: 500 },
    });
  });

  it('parses the SDK snippet and takes the locale from the SDK URL', () => {
    expect(parseEmbed(postSdk)).toEqual({
      platform: 'facebook',
      kind: 'post',
      url: 'https://www.facebook.com/facebook/posts/1710463914458955',
      id: '1710463914458955',
      variant: 'sdk',
      options: { locale: 'en_US', width: 500 },
      fallbackHtml: '',
    });
  });

  it('gives an SDK snippet for web.facebook.com the www URL', () => {
    const code = postSdk.replace(
      'https://www.facebook.com/',
      'https://web.facebook.com/',
    );
    expect(parseEmbed(code)).toEqual(parseEmbed(postSdk));
  });

  it('reads another locale', () => {
    const code = postSdk.replace('/en_US/sdk.js', '/bg_BG/sdk.js');
    expect(parseEmbed(code)?.options.locale).toBe('bg_BG');
  });
});

describe('Facebook video embed code', () => {
  it('parses the fb-video SDK snippet with its fallback content', () => {
    expect(parseEmbed(videoSdk)).toEqual({
      platform: 'facebook',
      kind: 'video',
      url: docsVideo,
      id: '10153231379946729',
      variant: 'sdk',
      options: { locale: 'en_US', width: 500, showText: false },
      fallbackHtml:
        '\n    <div class="fb-xfbml-parse-ignore">\n' +
        `      <blockquote cite="${docsVideo}">\n` +
        `        <a href="${docsVideo}">How to Share With Just Friends</a>\n` +
        '        <p>How to share with just friends.</p>\n' +
        '        Posted by <a href="https://www.facebook.com/facebook/">Facebook</a> on Friday, December 5, 2014\n' +
        '      </blockquote>\n    </div>\n  ',
    });
  });

  it('keeps a video iframe without the post text as given', () => {
    // Derived: the Embed dialog with "Include full post" unticked adds no height for text.
    const code = videoIframe
      .replace('show_text=true', 'show_text=false')
      .replace('height="591"', 'height="476"');
    expect(parseEmbed(code)).toEqual({
      platform: 'facebook',
      kind: 'video',
      url: reel,
      id: '1523911562856332',
      variant: 'iframe',
      options: { height: 476, show_text: false, width: 267, t: 0 },
      size: { width: 267, height: 476 },
    });
  });

  it('renders a video iframe that shows the post text through the SDK', () => {
    expect(parseEmbed(videoIframe)).toEqual({
      platform: 'facebook',
      kind: 'video',
      url: reel,
      id: '1523911562856332',
      variant: 'sdk',
      options: { showText: true },
      // The player's own size, from the iframe's parameters: 115 of the iframe's 591px
      // are for the text.
      size: { width: 267, height: 476 },
    });
  });

  it('reads show_text=1 as showing the post text', () => {
    // plugins/video.php renders the text for 1 as it does for true (docs/decisions.md D44).
    const code = videoIframe.replace('show_text=true', 'show_text=1');
    expect(parseEmbed(code)).toMatchObject({
      variant: 'sdk',
      options: { showText: true },
    });
  });

  it('carries the player parameters the SDK also reads over to it', () => {
    const code = videoIframe.replace(
      '&t=0',
      '&t=0&allowfullscreen=true&autoplay=true&show_captions=true',
    );
    expect(parseEmbed(code)?.options).toEqual({
      showText: true,
      allowfullscreen: true,
      autoplay: true,
      showCaptions: true,
    });
  });

  it('reads every documented fb-video attribute', () => {
    const code = videoSdk.replace(
      'data-show-text="false"',
      'data-show-text="false" data-allowfullscreen="true" data-autoplay="true" data-lazy="true" data-show-captions="true"',
    );
    expect(parseEmbed(code)?.options).toEqual({
      locale: 'en_US',
      width: 500,
      showText: false,
      allowfullscreen: true,
      autoplay: true,
      lazy: true,
      showCaptions: true,
    });
  });

  it('reads a web.facebook.com link in a plugin iframe as www', () => {
    const code = videoIframe.replace(
      'https%3A%2F%2Fwww.facebook.com',
      'https%3A%2F%2Fweb.facebook.com',
    );
    expect(parseEmbed(code)).toEqual(parseEmbed(videoIframe));
  });

  it('reads a plugin iframe on web.facebook.com as one on www', () => {
    const code = videoIframe.replace(
      'https://www.facebook.com/plugins/',
      'https://web.facebook.com/plugins/',
    );
    expect(parseEmbed(code)).toEqual(parseEmbed(videoIframe));
  });

  it('keeps web.facebook.com plugins off the generic path', () => {
    expect(
      parseIframe(
        '<iframe src="https://web.facebook.com/plugins/unknown.php?href=x"></iframe>',
      ),
    ).toBeNull();
  });

  it('keeps only the parse-ignore class in fallback content', () => {
    const code = videoSdk.replace(
      'class="fb-xfbml-parse-ignore"',
      'class="evil"',
    );
    expect(parseEmbed(code)?.fallbackHtml).toMatch(/^\n {4}<div>\n/);
  });
});

describe('Facebook embed code rules', () => {
  it.each([
    [
      'the inline SDK loader',
      postSdk.replace(
        /<script[^>]*><\/script>/,
        '<script>(function(d, s, id){ /* loader */ }(document, "script", "facebook-jssdk"));</script>',
      ),
    ],
    [
      'an unverified URL shape',
      postSdk.replace(
        /data-href="[^"]*"/,
        'data-href="https://www.facebook.com/groups/1/posts/2/"',
      ),
    ],
    [
      'another plugin',
      postIframe.replace('/plugins/post.php', '/plugins/page.php'),
    ],
    [
      'a div without the plugin class',
      '<div data-href="https://www.facebook.com/a/posts/1"></div>',
    ],
  ])('rejects %s', (_, code) => {
    expect(parseEmbed(code)).toBeNull();
  });
});

describe('Facebook URLs (shapes verified in docs/decisions.md D21)', () => {
  const post = (id: string, url: string) => ({
    platform: 'facebook',
    kind: 'post',
    url,
    id,
    variant: 'sdk',
    options: {},
  });
  const video = (id: string, url: string) => ({
    ...post(id, url),
    kind: 'video',
  });

  it.each([
    [
      `https://www.facebook.com/facebook/posts/${pfbid}`,
      post(pfbid, `https://www.facebook.com/facebook/posts/${pfbid}`),
    ],
    [
      'https://m.facebook.com/facebook/posts/1710463914458955/?app=fbl',
      post(
        '1710463914458955',
        'https://www.facebook.com/facebook/posts/1710463914458955',
      ),
    ],
    [
      'https://facebook.com/permalink.php?story_fbid=1710463914458955&id=20531316728',
      post(
        '1710463914458955',
        'https://www.facebook.com/permalink.php?story_fbid=1710463914458955&id=20531316728',
      ),
    ],
    [
      'https://www.facebook.com/story.php?story_fbid=1710463914458955&id=20531316728&rdid=x',
      post(
        '1710463914458955',
        'https://www.facebook.com/story.php?story_fbid=1710463914458955&id=20531316728',
      ),
    ],
    [
      'https://www.facebook.com/photo.php?fbid=1000000000000001&set=a.1000000000001&type=3',
      post(
        '1000000000000001',
        'https://www.facebook.com/photo.php?fbid=1000000000000001',
      ),
    ],
    [
      'https://www.facebook.com/photo/?fbid=1000000000000001',
      post(
        '1000000000000001',
        'https://www.facebook.com/photo/?fbid=1000000000000001',
      ),
    ],
    [
      'https://www.facebook.com/facebook/photos/a.1000000000001/1000000000000001/',
      post(
        '1000000000000001',
        'https://www.facebook.com/facebook/photos/a.1000000000001/1000000000000001/',
      ),
    ],
    [docsVideo, video('10153231379946729', docsVideo)],
    [
      'https://www.facebook.com/facebook/videos/how-to-share-with-just-friends/10153231379946729',
      video('10153231379946729', docsVideo),
    ],
    [
      'https://www.facebook.com/watch?v=10153231379946729',
      video(
        '10153231379946729',
        'https://www.facebook.com/watch/?v=10153231379946729',
      ),
    ],
    [
      'https://www.facebook.com/video.php?v=10153231379946729',
      video(
        '10153231379946729',
        'https://www.facebook.com/video.php?v=10153231379946729',
      ),
    ],
    [
      'https://www.facebook.com/reel/10153231379946729/',
      video(
        '10153231379946729',
        'https://www.facebook.com/reel/10153231379946729',
      ),
    ],
    [
      'https://web.facebook.com/watch/?v=10153231379946729',
      video(
        '10153231379946729',
        'https://www.facebook.com/watch/?v=10153231379946729',
      ),
    ],
    [
      'https://web.facebook.com/facebook/posts/1710463914458955/',
      post(
        '1710463914458955',
        'https://www.facebook.com/facebook/posts/1710463914458955',
      ),
    ],
  ])('%s', (url, expected) => {
    const embed = matchUrl(url);
    expect(embed).toEqual(expected);
    expect(embed && verifyEmbed(embed)).toEqual(embed);
  });

  it.each([
    'https://web.facebook.com.example.com/facebook/posts/1710463914458955',
    'https://fb.watch/abc123/',
    'https://www.facebook.com/share/p/1AbCdEf/',
    'https://www.facebook.com/groups/1/posts/2/',
    'https://www.facebook.com/facebook',
    'https://www.facebook.com/a/posts/not-an-id',
    'https://www.facebook.com/watch/?v=abc',
    'https://www.facebook.com/permalink.php?id=1',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
