import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import oembed from '../fixtures/pinterest/oembed-iframe.html?raw';
import widget from '../fixtures/pinterest/widget-docs.html?raw';

const pin = (id: string) =>
  ({
    platform: 'pinterest',
    kind: 'post',
    url: `https://www.pinterest.com/pin/${id}/`,
    id,
    variant: 'sdk',
  }) as const;

describe('Pinterest embed code', () => {
  it('parses the widget code from the docs', () => {
    expect(parseEmbed(widget)).toEqual({
      ...pin('424605071145752542'),
      options: {},
    });
  });

  it('reads data-pin-width', () => {
    expect(
      parseEmbed(
        widget.replace(
          'data-pin-do="embedPin"',
          'data-pin-do="embedPin" data-pin-width="large"',
        ),
      )?.options,
    ).toEqual({ width: 'large' });
  });

  // Rendered through the widget, as Facebook post iframes are through the SDK
  // (docs/decisions.md D51).
  it('parses the oEmbed iframe as a widget pin', () => {
    expect(parseEmbed(oembed)).toEqual({
      ...pin('424605071145752542'),
      options: {},
    });
  });

  it.each([
    ['a board', widget.replace('embedPin', 'embedBoard')],
    [
      'a link without data-pin-do',
      widget.replace(' data-pin-do="embedPin"', ''),
    ],
    ['another script', widget.replace('pinit.js', 'other.js')],
    [
      'an iframe on another host',
      oembed.replace('assets.pinterest.com', 'example.com'),
    ],
    ['an iframe without an id', oembed.replace('id=424605071145752542&', '')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Pinterest URLs', () => {
  it.each([
    'https://www.pinterest.com/pin/424605071145752542/',
    'https://pinterest.com/pin/424605071145752542',
    'https://bg.pinterest.com/pin/424605071145752542/',
    'https://www.pinterest.co.uk/pin/424605071145752542/',
    'https://www.pinterest.com/pin/next-stop-pinterest--424605071145752542/',
  ])('%s', (url) => {
    expect(matchUrl(url)).toEqual({
      ...pin('424605071145752542'),
      options: {},
    });
  });

  it.each([
    'https://pin.it/abcdef',
    'https://www.pinterest.com/kentbrew/',
    'https://www.pinterest.com/kentbrew/some-board/',
    'https://www.pinterest.com/pin/abc/',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
