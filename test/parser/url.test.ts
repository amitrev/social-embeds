import { describe, expect, it } from 'vitest';
import { coerce, parseUrl, pixels } from '../../src/parser/url';

describe('parseUrl', () => {
  it('splits host, path and decoded query', () => {
    const url = parseUrl(
      ' https://WWW.Example.com/a/b?x=1&y=a%20b+c&x=2&flag#frag ',
    );
    expect(url?.host).toBe('www.example.com');
    expect(url?.path).toBe('/a/b');
    expect(url?.fragment).toBe('frag');
    expect([...(url?.query ?? [])]).toEqual([
      ['x', '1'],
      ['y', 'a b c'],
      ['flag', ''],
    ]);
  });

  it('reads `&amp;` as `&`, as in a URL copied from HTML source', () => {
    const url = parseUrl('https://a.test/?x=1&amp;y=2&amp;x=3');
    expect([...(url?.query ?? [])]).toEqual([
      ['x', '1'],
      ['y', '2'],
    ]);
  });

  it('keeps an escaped `&amp;` inside a value', () => {
    expect(parseUrl('https://a.test/?q=a%26amp%3Bb')?.query.get('q')).toBe(
      'a&amp;b',
    );
  });

  it('accepts http and protocol-relative URLs', () => {
    expect(parseUrl('http://a.test/')?.host).toBe('a.test');
    expect(parseUrl('//a.test/x')?.path).toBe('/x');
  });

  it.each([
    ['a relative path', '/p/abc'],
    ['another scheme', 'javascript://a.test/%0Aalert(1)'],
    ['user info', 'https://user@a.test/'],
    ['whitespace inside', 'https://a.test/a b'],
    ['malformed percent-encoding', 'https://a.test/?q=%E0%A4%A'],
  ])('rejects %s', (_, input) => {
    expect(parseUrl(input)).toBeNull();
  });
});

describe('coerce', () => {
  it.each([
    ['true', true],
    ['false', false],
    ['0', 0],
    ['11', 11],
    ['007', '007'],
    ['1.5', '1.5'],
    ['dark', 'dark'],
    ['', ''],
  ])('%j → %j', (input, expected) => {
    expect(coerce(input)).toBe(expected);
  });
});

describe('pixels', () => {
  it('accepts positive integers only', () => {
    expect(pixels('560')).toBe(560);
    expect(pixels('0')).toBeUndefined();
    expect(pixels('100%')).toBeUndefined();
    expect(pixels(undefined)).toBeUndefined();
  });
});
