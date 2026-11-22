import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { verifyEmbed } from '../../src/parser/verify';
import api from '../fixtures/streamable/api-embed-code.html?raw';
import docs from '../fixtures/streamable/embed-docs.html?raw';
import oembed from '../fixtures/streamable/oembed.html?raw';
import player from '../fixtures/streamable/player-copy-embed.html?raw';

const base = {
  platform: 'streamable',
  kind: 'video',
  variant: 'iframe',
  url: 'https://streamable.com/lttg48',
  id: 'lttg48',
  options: {},
} as const;

describe('Streamable embed code', () => {
  it('parses the API code with the wrapper’s ratio', () => {
    expect(parseEmbed(api)).toEqual({
      ...base,
      size: { width: 16, height: 9 },
    });
  });

  it('parses the docs code with a three-decimal ratio', () => {
    expect(parseEmbed(docs)).toEqual({
      ...base,
      size: { width: 16, height: 9 },
    });
  });

  it('parses the oEmbed iframe with its own size', () => {
    expect(parseEmbed(oembed)).toEqual({
      ...base,
      size: { width: 1280, height: 720 },
    });
  });

  it('parses the player’s code, which ends in a stray </div>', () => {
    expect(parseEmbed(player)).toEqual(base);
  });

  it('keeps only the player options', () => {
    const html = docs.replace(
      '/e/lttg48"',
      '/e/lttg48?loop=0&autoplay=1&muted=1&nocontrols=1&hd=1&t=5"',
    );
    expect(parseEmbed(html)?.options).toEqual({
      loop: 0,
      autoplay: 1,
      muted: 1,
      nocontrols: 1,
      hd: 1,
    });
  });

  it('passes verifyEmbed', () => {
    for (const html of [api, docs, oembed, player]) {
      const embed = parseEmbed(html);
      expect(embed && verifyEmbed(embed)).toEqual(embed);
    }
  });

  it.each([
    ['a wrapper and another element', `${api}<p>hi</p>`],
    ['a second stray </div>', `${player}</div>`],
    ['a stray </div> after a wrapper', `${api}</div>`],
    ['a stray </div> before the iframe', `</div>${oembed}`],
    ['a stray </span>', player.replace('</div>', '</span>')],
    ['a reserved name in /e/', player.replace('lttg48', 'about')],
    ['a reserved name in /o/', oembed.replace('lttg48', 'login')],
    ['another host', oembed.replace('streamable.com', 'example.com')],
    ['another path', oembed.replace('/o/lttg48', '/s/lttg48')],
    ['an upper-case id', oembed.replace('lttg48', 'LTTG48')],
    [
      'a wrapper with another style',
      api.replace('56.25%', '56.25%; color: red'),
    ],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });

  it('still rejects a stray </div> on other platforms', () => {
    expect(
      parseEmbed(
        '<iframe src="https://player.vimeo.com/video/76979871"></iframe></div>',
      ),
    ).toBeNull();
  });
});

describe('Streamable URLs', () => {
  it.each([
    'https://streamable.com/lttg48',
    'https://www.streamable.com/lttg48',
    'https://streamable.com/e/lttg48',
    'https://streamable.com/o/lttg48',
  ])('matches %s', (url) => {
    expect(matchUrl(url)).toEqual(base);
  });

  it.each([
    'https://streamable.com/LTTG48',
    'https://streamable.com/abc',
    'https://streamable.com/abcdefghi',
    'https://streamable.com/login',
    'https://streamable.com/',
    'https://api.streamable.com/videos/lttg48',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
