import { describe, expect, it } from 'vitest';
import { genericPlan } from '../../src/core/plans/generic';
import { type ParsedIframe, parseIframe } from '../../src/parser';
import bandcamp from '../fixtures/generic/bandcamp-embed.html?raw';
import codepen from '../fixtures/generic/codepen-oembed.html?raw';
import datawrapper from '../fixtures/generic/datawrapper-oembed.html?raw';
import deezer from '../fixtures/generic/deezer-oembed.html?raw';
import maps from '../fixtures/generic/google-maps-embed.html?raw';
import loom from '../fixtures/generic/loom-responsive.html?raw';
import mixcloud from '../fixtures/generic/mixcloud-oembed.html?raw';
import ted from '../fixtures/generic/ted-oembed.html?raw';

const BASE: ParsedIframe = {
  src: 'https://example.com/',
  allow: '',
  allowFullscreen: false,
  size: {},
};

function parsed(html: string): ParsedIframe {
  const embed = parseIframe(html);
  if (!embed) throw new Error('fixture did not parse');
  return embed;
}

describe('genericPlan', () => {
  it('sizes the frame from a numeric width and height, at most that wide', () => {
    expect(
      genericPlan({
        src: 'https://example.com/',
        allow: '',
        allowFullscreen: false,
        size: { width: 640, height: 360 },
      }),
    ).toMatchObject({
      kind: 'iframe',
      src: 'https://example.com/',
      title: 'Embedded content',
      ratio: { width: 640, height: 360 },
      maxWidth: 640,
    });
  });

  it('gives a height alone a fixed height at full width', () => {
    const plan = genericPlan({
      src: 'https://example.com/',
      allow: '',
      allowFullscreen: false,
      size: { height: 400 },
    });
    expect(plan).toMatchObject({ height: 400 });
    expect(plan).not.toHaveProperty('maxWidth');
  });

  it('reports a src that is not safe to render', () => {
    expect(
      genericPlan({
        src: 'javascript:alert(1)',
        allow: '',
        allowFullscreen: false,
        size: {},
      }),
    ).toEqual({
      kind: 'error',
      message: 'social-embeds: the iframe embed is not safe to render',
    });
  });

  it('reports a frame that a named platform owns', () => {
    expect(
      genericPlan({ ...BASE, src: 'https://www.youtube.com/embed/x' }),
    ).toEqual({
      kind: 'error',
      message: 'social-embeds: the iframe embed is not safe to render',
    });
  });

  it('drops the features a host-built embed may not delegate', () => {
    expect(
      genericPlan({
        src: 'https://example.com/',
        allow: 'camera; autoplay',
        allowFullscreen: false,
        size: {},
      }),
    ).toMatchObject({ allow: 'autoplay' });
  });

  it('keeps the checked attributes, and an empty sandbox', () => {
    expect(
      genericPlan({
        ...BASE,
        title: 'Chart',
        allowFullscreen: true,
        referrerPolicy: 'no-referrer',
        sandbox: '',
        scrolling: 'no',
      }),
    ).toEqual({
      kind: 'iframe',
      src: 'https://example.com/',
      title: 'Chart',
      allow: '',
      allowFullscreen: true,
      referrerPolicy: 'no-referrer',
      sandbox: '',
      scrolling: 'no',
      ratio: { width: 16, height: 9 },
    });
  });

  it('uses a wrapper ratio as the aspect ratio, never as a width', () => {
    const plan = genericPlan({ ...BASE, ratio: { width: 4, height: 3 } });
    expect(plan).toMatchObject({ ratio: { width: 4, height: 3 } });
    expect(plan).not.toHaveProperty('maxWidth');
    expect(plan).not.toHaveProperty('height');
  });

  it('prefers the size over a wrapper ratio', () => {
    expect(
      genericPlan({
        ...BASE,
        size: { width: 640, height: 360 },
        ratio: { width: 4, height: 3 },
      }),
    ).toMatchObject({ ratio: { width: 640, height: 360 }, maxWidth: 640 });
    const fixed = genericPlan({
      ...BASE,
      size: { height: 400 },
      ratio: { width: 4, height: 3 },
    });
    expect(fixed).toMatchObject({ height: 400 });
  });

  it('caps the width of a frame with a width alone, at 16:9', () => {
    expect(genericPlan({ ...BASE, size: { width: 500 } })).toMatchObject({
      ratio: { width: 16, height: 9 },
      maxWidth: 500,
    });
  });

  it('falls back to 16:9 without a usable size', () => {
    const plan = genericPlan(BASE);
    expect(plan).toMatchObject({ ratio: { width: 16, height: 9 } });
    expect(plan).not.toHaveProperty('maxWidth');
    expect(plan).not.toHaveProperty('height');
  });
});

describe('genericPlan with the fixtures', () => {
  it.each<[string, string, Record<string, unknown>]>([
    [
      'Google Maps',
      maps,
      {
        ratio: { width: 600, height: 450 },
        maxWidth: 600,
        allowFullscreen: true,
      },
    ],
    [
      'Datawrapper',
      datawrapper,
      {
        title: 'The transition from the Late Pleistocene to the Holocene',
        height: 200,
        scrolling: 'no',
      },
    ],
    ['Deezer', deezer, { ratio: { width: 420, height: 420 }, maxWidth: 420 }],
    ['Mixcloud', mixcloud, { height: 120, allowFullscreen: false }],
    ['Loom', loom, { ratio: { width: 10_000, height: 5607 } }],
    [
      'TED',
      ted,
      {
        title: 'Tony Buffington: Why do cats act so weird?',
        ratio: { width: 560, height: 315 },
        maxWidth: 560,
      },
    ],
    ['CodePen', codepen, { height: 300 }],
    [
      'Bandcamp',
      bandcamp,
      { ratio: { width: 350, height: 470 }, maxWidth: 350 },
    ],
  ])('plans the %s code', (_, html, expected) => {
    expect(genericPlan(parsed(html))).toMatchObject({
      kind: 'iframe',
      ...expected,
    });
  });
});
