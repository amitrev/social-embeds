import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { verifyEmbed } from '../../src/parser/verify';
import fixed from '../fixtures/giphy/embed-fixed.html?raw';
import responsive from '../fixtures/giphy/embed-responsive.html?raw';

const base = {
  platform: 'giphy',
  kind: 'video',
  variant: 'iframe',
  url: 'https://giphy.com/gifs/l41YlHs99JsSptZf2',
  id: 'l41YlHs99JsSptZf2',
  options: {},
} as const;
// A made-up `v1.…` segment, the shape Giphy's "Copy GIF link" puts before the id.
const token =
  'v1.Y2lkPTc5MGI3NjExeDJsOXE4ejB3NGs2bTFuM2I1djdjOXgybDRrNmo4aDBnMmY0ZDZzOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmcmlkPWdpcGh5LmdpZiZjdD1n';

describe('Giphy embed code', () => {
  it('parses fixed code and drops its credit', () => {
    expect(parseEmbed(fixed)).toEqual({
      ...base,
      size: { width: 480, height: 269 },
    });
  });

  it('parses responsive code with the wrapper’s ratio', () => {
    expect(parseEmbed(responsive)).toEqual({
      ...base,
      size: { width: 25, height: 14 },
    });
  });

  it('parses the iframe without the credit', () => {
    expect(parseEmbed(fixed.replace(/<p>.*<\/p>$/, ''))).toEqual(
      parseEmbed(fixed),
    );
  });

  it('accepts a credit that links the sticker page', () => {
    const code = fixed.replace('/gifs/', '/stickers/');
    expect(parseEmbed(code)).toEqual(parseEmbed(fixed));
  });

  it('passes verifyEmbed', () => {
    const embed = parseEmbed(responsive);
    expect(embed && verifyEmbed(embed)).toEqual(embed);
  });

  it.each([
    [
      'a credit for another GIF',
      fixed.replace(
        '/gifs/originals-animation-kitten-logo-l41YlHs99JsSptZf2"',
        '/gifs/abc123"',
      ),
    ],
    [
      'a credit with extra markup',
      fixed.replace('via GIPHY</a>', 'via GIPHY</a><b>x</b>'),
    ],
    ['a credit and another element', `${fixed}<p>hi</p>`],
    ['a credit with an attribute', fixed.replace('<p>', '<p class="x">')],
    ['another host', fixed.replace('giphy.com/embed', 'example.com/embed')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Giphy URLs', () => {
  it.each([
    'https://giphy.com/gifs/originals-animation-kitten-logo-l41YlHs99JsSptZf2',
    'https://giphy.com/gifs/l41YlHs99JsSptZf2',
    'https://www.giphy.com/gifs/originals-animation-kitten-logo-l41YlHs99JsSptZf2/',
    'https://giphy.com/embed/l41YlHs99JsSptZf2',
    'https://media.giphy.com/media/l41YlHs99JsSptZf2/giphy.gif',
    'https://media4.giphy.com/media/l41YlHs99JsSptZf2/giphy.gif',
    `https://media.giphy.com/media/${token}/l41YlHs99JsSptZf2/giphy.gif`,
    `https://media2.giphy.com/media/${token}/l41YlHs99JsSptZf2/giphy.webp`,
    'https://media.giphy.com/media/l41YlHs99JsSptZf2/200.gif',
    'https://media.giphy.com/media/l41YlHs99JsSptZf2/200w_d.webp',
    'https://media.giphy.com/media/l41YlHs99JsSptZf2/giphy-downsized.mp4',
    'https://i.giphy.com/l41YlHs99JsSptZf2.webp',
    'https://i.giphy.com/l41YlHs99JsSptZf2.gif',
    'https://i.giphy.com/media/l41YlHs99JsSptZf2/giphy.webp',
    'https://giphy.com/stickers/originals-cat-l41YlHs99JsSptZf2',
    'https://giphy.com/stickers/l41YlHs99JsSptZf2/',
  ])('matches %s', (url) => {
    const embed = matchUrl(url);
    expect(embed).toEqual(base);
    expect(embed && verifyEmbed(embed)).toEqual(embed);
  });

  it.each([
    'https://gph.is/abc',
    'https://giphy.com/clips/cat-l41YlHs99JsSptZf2',
    'https://giphy.com/',
    'https://media.giphy.com/media/v2.abc/l41YlHs99JsSptZf2/giphy.gif',
    'https://media.giphy.com/media/v1./l41YlHs99JsSptZf2/giphy.gif',
    'https://media.giphy.com/media/l41YlHs99JsSptZf2/giphy.png',
    'https://media.giphy.com/media/l41YlHs99JsSptZf2/x/giphy.gif',
    'https://media.giphy.com/l41YlHs99JsSptZf2.gif',
    'https://i.giphy.com/l41YlHs99JsSptZf2.png',
    'https://i.giphy.com/l41YlHs99JsSptZf2',
    'https://img.giphy.com/l41YlHs99JsSptZf2.gif',
    'https://i.giphy.com.example/l41YlHs99JsSptZf2.gif',
    'https://giphy.com/l41YlHs99JsSptZf2.gif',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
