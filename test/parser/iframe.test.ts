import { describe, expect, expectTypeOf, it } from 'vitest';
import { type ParsedIframe, parseIframe } from '../../src/parser';
import { checkIframe } from '../../src/parser/iframe';
import bandcamp from '../fixtures/generic/bandcamp-embed.html?raw';
import codepen from '../fixtures/generic/codepen-oembed.html?raw';
import datawrapper from '../fixtures/generic/datawrapper-oembed.html?raw';
import deezer from '../fixtures/generic/deezer-oembed.html?raw';
import maps from '../fixtures/generic/google-maps-embed.html?raw';
import loom from '../fixtures/generic/loom-responsive.html?raw';
import mixcloud from '../fixtures/generic/mixcloud-oembed.html?raw';
import ted from '../fixtures/generic/ted-oembed.html?raw';

const frame = (attributes: string) =>
  parseIframe(`<iframe src="https://example.com/" ${attributes}></iframe>`);

describe('parseIframe', () => {
  it('rebuilds a Google Maps iframe from its checked attributes', () => {
    expect(
      parseIframe(
        '<iframe src="https://www.google.com/maps/embed?pb=x" width="600" height="450" style="border:0" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
      ),
    ).toEqual({
      src: 'https://www.google.com/maps/embed?pb=x',
      allow: '',
      allowFullscreen: true,
      referrerPolicy: 'no-referrer-when-downgrade',
      size: { width: 600, height: 450 },
    });
  });

  it.each([
    ['javascript:', '<iframe src="javascript:alert(1)"></iframe>'],
    ['data:', '<iframe src="data:text/html,x"></iframe>'],
    ['blob:', '<iframe src="blob:https://example.com/uuid"></iframe>'],
    ['http:', '<iframe src="http://example.com/"></iframe>'],
    ['a relative path', '<iframe src="/embed/x"></iframe>'],
    [
      'an https: URL without slashes',
      '<iframe src="https:example.com"></iframe>',
    ],
    [
      'a user name and password',
      '<iframe src="https://u:p@example.com/"></iframe>',
    ],
    ['a user name', '<iframe src="https://u@example.com/"></iframe>'],
    ['no src', '<iframe width="600" height="400"></iframe>'],
    ['an empty src', '<iframe src=""></iframe>'],
    [
      'a percent-encoded host',
      '<iframe src="https://%65xample.com/"></iframe>',
    ],
    [
      'a backslash',
      '<iframe src="https://example.com\\@evil.example/"></iframe>',
    ],
    ['a host ending in a dot', '<iframe src="https://example.com./"></iframe>'],
    ['a space in the URL', '<iframe src="https://example.com/a b"></iframe>'],
    ['a tab in the host', '<iframe src="https://exam&#9;ple.com/"></iframe>'],
    [
      'a backslash in the path',
      '<iframe src="https://example.com/a\\..\\b"></iframe>',
    ],
    ['a dot segment', '<iframe src="https://example.com/a/../b"></iframe>'],
    [
      'an encoded dot segment',
      '<iframe src="https://example.com/a/.%2E/b"></iframe>',
    ],
  ])('rejects a src with %s', (_, html) => {
    expect(parseIframe(html)).toBeNull();
  });

  it('drops srcdoc, handlers and the script beside the iframe', () => {
    expect(
      parseIframe(
        '<iframe src="https://example.com/" srcdoc="<script>x</script>" onload="x()"></iframe><script>steal()</script>',
      ),
    ).toEqual({
      src: 'https://example.com/',
      allow: '',
      allowFullscreen: false,
      size: {},
    });
  });

  it('rewrites a protocol-relative src to https', () => {
    expect(parseIframe('<iframe src="//example.com/e"></iframe>')?.src).toBe(
      'https://example.com/e',
    );
  });

  it('keeps only media features in allow, with safe origin lists', () => {
    expect(
      frame(
        'allow="camera; microphone; autoplay *; fullscreen https://evil.example; geolocation"',
      )?.allow,
    ).toBe('autoplay *; fullscreen https://evil.example');
    expect(
      frame(
        `allow="clipboard-write 'self' 'src'; web-share 'none'; picture-in-picture; payment; clipboard-read"`,
      )?.allow,
    ).toBe(
      `clipboard-write 'self' 'src'; web-share 'none'; picture-in-picture`,
    );
  });

  it.each([
    ['an http origin', 'autoplay http://insecure.example'],
    ['a path in the origin', 'autoplay https://example.com/path'],
    ['an unknown keyword', "autoplay 'unsafe'"],
    ['one bad origin among good ones', "autoplay 'self' javascript:x"],
  ])('drops a feature with %s', (_, allow) => {
    expect(frame(`allow="${allow}"`)?.allow).toBe('');
  });

  it('keeps sandbox keywords only, and an empty sandbox', () => {
    expect(
      frame('sandbox="allow-scripts ALLOW-SAME-ORIGIN allow-everything"')
        ?.sandbox,
    ).toBe('allow-scripts allow-same-origin');
    expect(frame('sandbox=""')?.sandbox).toBe('');
    expect(frame('sandbox="allow-everything"')?.sandbox).toBe('');
    expect(frame('')).not.toHaveProperty('sandbox');
  });

  it('keeps a referrerpolicy from the spec list only', () => {
    expect(frame('referrerpolicy="Origin"')?.referrerPolicy).toBe('origin');
    expect(frame('referrerpolicy="always"')).not.toHaveProperty(
      'referrerPolicy',
    );
    expect(frame('referrerpolicy=""')).not.toHaveProperty('referrerPolicy');
  });

  it('keeps scrolling="no" only', () => {
    expect(frame('scrolling="no"')?.scrolling).toBe('no');
    expect(frame('scrolling="yes"')).not.toHaveProperty('scrolling');
  });

  it('keeps a title with text only', () => {
    expect(frame('title=" A chart "')?.title).toBe('A chart');
    expect(frame('title="  "')).not.toHaveProperty('title');
  });

  it.each([
    ['two iframes', `${maps}${maps}`],
    [
      'an iframe inside the iframe',
      '<iframe src="https://example.com/"><iframe src="https://example.com/"></iframe></iframe>',
    ],
    ['no iframe', '<div><a href="https://example.com/">x</a></div>'],
    ['malformed code', '<div><iframe src="https://example.com/"></iframe>'],
    ['an empty string', ''],
  ])('returns null for %s', (_, html) => {
    expect(parseIframe(html)).toBeNull();
  });

  it('returns null for a non-string', () => {
    expect(parseIframe(undefined as unknown as string)).toBeNull();
    expect(parseIframe({} as unknown as string)).toBeNull();
  });

  it('drops wrappers, links, text and comments around the iframe', () => {
    expect(
      parseIframe(
        '<!-- embed --><figure class="x"><a href="https://example.com/">Map</a><p><iframe src="https://example.com/" title="Map"></iframe></p>Caption</figure>\n',
      ),
    ).toEqual({
      src: 'https://example.com/',
      title: 'Map',
      allow: '',
      allowFullscreen: false,
      size: {},
    });
  });
});

describe('parseIframe size', () => {
  it('reads a numeric height without a numeric width', () => {
    expect(frame('width="100%" height="400"')?.size).toEqual({ height: 400 });
  });

  it('reads width and height in px from the style when the attributes have none', () => {
    expect(
      frame(
        'width="100%" style="max-width: 500px; width: 320px; height: 180px"',
      )?.size,
    ).toEqual({ width: 320, height: 180 });
  });

  it('reads a long style quickly', () => {
    const style = `width: 1px${' '.repeat(50_000)}x; height: 180px`;
    const started = performance.now();
    expect(frame(`style="${style}"`)?.size).toEqual({ height: 180 });
    expect(performance.now() - started).toBeLessThan(500);
  });

  it('prefers the attributes to the style', () => {
    expect(
      frame('height="200" style="width: 320px; height: 180px"')?.size,
    ).toEqual({
      height: 200,
    });
  });

  it("reads the wrapper's padding-bottom ratio last", () => {
    const wrapped = (style: string) =>
      parseIframe(
        `<div style="position: relative; padding-bottom: 75%; height: 0;"><iframe src="https://example.com/" ${style}></iframe></div>`,
      )?.size;
    expect(wrapped('')).toEqual({ width: 4, height: 3 });
    expect(wrapped('style="width: 100%; height: 100%"')).toEqual({
      width: 4,
      height: 3,
    });
    expect(wrapped('width="640" height="360"')).toEqual({
      width: 640,
      height: 360,
    });
  });

  it('reads no ratio from a wrapper that is not a ratio box', () => {
    expect(
      parseIframe(
        '<div class="embed" style="padding-bottom: 75%"><iframe src="https://example.com/"></iframe></div>',
      )?.size,
    ).toEqual({});
    expect(
      parseIframe(
        '<div style="padding-bottom: 75%"><iframe src="https://example.com/"></iframe><p>Caption</p></div>',
      )?.size,
    ).toEqual({});
  });
});

describe('generic embed code fixtures', () => {
  it.each<[string, string, ParsedIframe]>([
    [
      'Google Maps',
      maps,
      {
        src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3168.6369962312624!2d-122.08532419999999!3d37.4220541!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fba02425dad8f%3A0x6c296c66619367e0!2sGoogleplex!5e0!3m2!1sen!2sbg!4v1795259440256!5m2!1sen!2sbg',
        allow: '',
        allowFullscreen: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        size: { width: 600, height: 450 },
      },
    ],
    [
      'Datawrapper',
      datawrapper,
      {
        src: 'https://datawrapper.dwcdn.net/9kGOy/3/',
        title: 'The transition from the Late Pleistocene to the Holocene',
        allow: '',
        allowFullscreen: false,
        scrolling: 'no',
        size: { height: 200 },
      },
    ],
    [
      'Deezer',
      deezer,
      {
        src: 'https://widget.deezer.com/widget/dark/playlist/4590807924?app_id=457142&autoplay=false&radius=true&tracklist=false',
        allow: 'encrypted-media',
        allowFullscreen: true,
        size: { width: 420, height: 420 },
      },
    ],
    [
      'Mixcloud',
      mixcloud,
      {
        src: 'https://www.mixcloud.com/widget/iframe/?feed=https%3A%2F%2Fwww.mixcloud.com%2Fmixcloud%2Fguest-episode-from-the-how-do-i-music-podcast-keep-it-to-one-sentence%2F&hide_cover=1',
        allow: 'encrypted-media; fullscreen; autoplay; web-share',
        allowFullscreen: false,
        size: { height: 120 },
      },
    ],
    [
      'Loom',
      loom,
      {
        src: 'https://www.loom.com/embed/e5b8c04bca094dd8a5507925ab887002?hideEmbedTopBar=true&t=20s',
        allow: '',
        allowFullscreen: true,
        size: { width: 10_000, height: 5607 },
      },
    ],
    [
      'TED',
      ted,
      {
        src: 'https://embed.ted.com/talks/tony_buffington_why_do_cats_act_so_weird',
        title: 'Tony Buffington: Why do cats act so weird?',
        allow: 'autoplay; fullscreen; encrypted-media; picture-in-picture',
        allowFullscreen: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        size: { width: 560, height: 315 },
      },
    ],
    [
      'CodePen',
      codepen,
      {
        src: 'https://codepen.io/editor/team/codepen/embed/preview/pveGvJj',
        title: 'CodePen Confetti Button (Example Embed)',
        allow: '',
        allowFullscreen: true,
        scrolling: 'no',
        size: { height: 300 },
      },
    ],
    [
      'Bandcamp',
      bandcamp,
      {
        src: 'https://bandcamp.com/EmbeddedPlayer/album=1029513932/size=large/bgcol=FFFFFF/linkcol=0687f5/tracklist=false/transparent=true/',
        allow: '',
        allowFullscreen: false,
        size: { width: 350, height: 470 },
      },
    ],
  ])('parses the %s code', (_, html, expected) => {
    expect(parseIframe(html)).toEqual(expected);
  });
});

describe('checkIframe', () => {
  const embed: ParsedIframe = {
    src: 'https://example.com/',
    allow: '',
    allowFullscreen: false,
    size: {},
  };

  it.each([maps, datawrapper, deezer, mixcloud, loom, ted, codepen, bandcamp])(
    'keeps a parsed embed as it is (%#)',
    (html) => {
      const parsed = parseIframe(html);
      expect(parsed).not.toBeNull();
      expect(checkIframe(parsed as ParsedIframe)).toEqual(parsed);
    },
  );

  it('rejects a host-built value with an unsafe src', () => {
    expect(checkIframe({ ...embed, src: 'javascript:alert(1)' })).toBeNull();
    expect(checkIframe({ ...embed, src: 'http://example.com/' })).toBeNull();
    expect(checkIframe({ ...embed, src: ' data:text/html,x' })).toBeNull();
  });

  it('filters the attributes of a host-built value', () => {
    expect(
      checkIframe({
        ...embed,
        src: '//example.com/',
        allow: 'camera; autoplay',
        sandbox: 'allow-scripts allow-anything',
        referrerPolicy: 'bogus' as ParsedIframe['referrerPolicy'],
        title: '',
        size: { width: 640.5, height: 360 },
      }),
    ).toEqual({
      src: 'https://example.com/',
      allow: 'autoplay',
      allowFullscreen: false,
      sandbox: 'allow-scripts',
      size: { height: 360 },
    });
  });

  it('rejects a value that is not an object', () => {
    expect(checkIframe(null as unknown as ParsedIframe)).toBeNull();
    expect(checkIframe('x' as unknown as ParsedIframe)).toBeNull();
  });

  it("types referrerPolicy as the DOM's keywords", () => {
    expectTypeOf<NonNullable<ParsedIframe['referrerPolicy']>>().toEqualTypeOf<
      Exclude<ReferrerPolicy, ''>
    >();
  });
});
