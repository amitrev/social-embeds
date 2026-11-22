import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { needsLookup } from '../../src/parser/lookup';
import { verifyEmbed } from '../../src/parser/verify';
import dialog from '../fixtures/rumble/embed-dialog-iframe.html?raw';
import script from '../fixtures/rumble/embed-dialog-js.html?raw';
import oembed from '../fixtures/rumble/oembed.html?raw';

const base = {
  platform: 'rumble',
  kind: 'video',
  variant: 'iframe',
  url: 'https://rumble.com/embed/v12onr1/',
  id: 'v12onr1',
} as const;

describe('Rumble embed code', () => {
  it('parses the dialog iframe and keeps pub', () => {
    expect(parseEmbed(dialog)).toEqual({
      ...base,
      options: { pub: 4 },
      size: { width: 640, height: 360 },
    });
  });

  it('parses the oEmbed iframe without options', () => {
    expect(parseEmbed(oembed)).toEqual({
      ...base,
      options: {},
      size: { width: 3840, height: 2160 },
    });
  });

  it('drops other query parameters', () => {
    const html = oembed.replace('/embed/v12onr1/', '/embed/v12onr1/?pub=4&x=1');
    expect(parseEmbed(html)?.options).toEqual({ pub: 4 });
  });

  it('passes verifyEmbed', () => {
    for (const html of [dialog, oembed]) {
      const embed = parseEmbed(html);
      expect(embed && verifyEmbed(embed)).toEqual(embed);
    }
  });

  it('rejects the embedJS script player', () => {
    expect(parseEmbed(script)).toBeNull();
  });

  it.each([
    ['another host', oembed.replace('rumble.com', 'example.com')],
    ['a page URL', oembed.replace('/embed/v12onr1/', '/v15atp3-title.html')],
    ['an uppercase id', oembed.replace('v12onr1', 'V12ONR1')],
    ['an id without v', oembed.replace('v12onr1', '12onr1')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Rumble URLs', () => {
  it.each([
    'https://rumble.com/embed/v12onr1/',
    'https://rumble.com/embed/v12onr1',
    'https://www.rumble.com/embed/v12onr1/?pub=4',
  ])('matches %s', (url) => {
    expect(matchUrl(url)).toEqual({ ...base, options: {} });
  });

  it('does not match a page URL, which needs a lookup', () => {
    const url = 'https://rumble.com/v15atp3-rumble-basics.html';
    expect(matchUrl(url)).toBeNull();
    expect(needsLookup(url)).toBe('rumble');
    expect(
      needsLookup('https://www.rumble.com/v15atp3-rumble-basics.html?x=1'),
    ).toBe('rumble');
  });

  it.each([
    'https://rumble.com/embed/v12onr1/',
    'https://rumble.com/user/Mario',
    'https://rumble.com/c/HowtoRumble',
    'https://rumble.com/v15atp3.html',
    'https://example.com/v15atp3-title.html',
  ])('needs no lookup for %s', (url) => {
    expect(needsLookup(url)).toBeNull();
  });
});
