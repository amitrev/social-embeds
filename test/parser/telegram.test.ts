import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import configurator from '../fixtures/telegram/widget-configurator.html?raw';
import configuratorOptions from '../fixtures/telegram/widget-configurator-options.html?raw';

const post = {
  platform: 'telegram',
  kind: 'post',
  url: 'https://t.me/telegram/83',
  id: 'telegram/83',
  variant: 'iframe',
} as const;

describe('Telegram embed code', () => {
  it('parses the widget script from the configurator', () => {
    expect(parseEmbed(configurator)).toEqual({
      ...post,
      options: { width: '100%' },
    });
  });

  it('reads the options the configurator adds', () => {
    expect(parseEmbed(configuratorOptions)?.options).toEqual({
      width: '100%',
      userpic: false,
      color: 'E22F38',
      dark: 1,
      darkColor: 'F95C54',
    });
  });

  it('reads comment, mode and single', () => {
    expect(
      parseEmbed(
        '<script async src="https://telegram.org/js/telegram-widget.js?24" data-telegram-post="telegram/83" data-comment="5" data-mode="tme" data-single></script>',
      )?.options,
    ).toEqual({ comment: 5, mode: 'tme', single: true });
  });

  it.each([
    [
      'another script',
      '<script async src="https://example.com/telegram-widget.js?24" data-telegram-post="telegram/83"></script>',
    ],
    [
      'the login widget',
      '<script async src="https://telegram.org/js/telegram-widget.js?24" data-telegram-login="some_bot"></script>',
    ],
    [
      'a post widget that also logs in',
      '<script async src="https://telegram.org/js/telegram-widget.js?24" data-telegram-post="telegram/83" data-telegram-login="some_bot"></script>',
    ],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });

  it('rejects a post id that is not a channel and a number', () => {
    expect(
      parseEmbed(configurator.replace('telegram/83', 'telegram/abc')),
    ).toBeNull();
    expect(parseEmbed(configurator.replace('telegram/83', 'c/1/2'))).toBeNull();
  });

  it('rejects a second widget script', () => {
    expect(parseEmbed(configurator + configurator)).toBeNull();
  });

  it('rejects a script with inline code', () => {
    expect(
      parseEmbed(configurator.replace('></script>', '>alert(1)</script>')),
    ).toBeNull();
  });
});

describe('Telegram URLs', () => {
  it.each([
    'https://t.me/telegram/83',
    'https://t.me/s/telegram/83',
    'https://telegram.me/telegram/83/',
  ])('%s', (url) => {
    expect(matchUrl(url)).toEqual({ ...post, options: {} });
  });

  it('keeps single and comment', () => {
    expect(matchUrl('https://t.me/telegram/83?single&comment=12')).toEqual({
      ...post,
      options: { single: true, comment: 12 },
    });
  });

  it.each([
    'https://t.me/c/1234567890/83',
    'https://t.me/telegram',
    'https://t.me/telegram/abc',
    'https://example.com/telegram/83',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
