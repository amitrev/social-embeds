import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import maxWidth from '../fixtures/threads/embed-dialog-maxwidth.html?raw';
import oembed from '../fixtures/threads/embed-dialog.html?raw';

const post = {
  platform: 'threads',
  kind: 'post',
  url: 'https://www.threads.com/t/Df7kSgBJVNz',
  id: 'Df7kSgBJVNz',
  variant: 'sdk',
} as const;

const permalink = 'https://www.threads.com/@threads/post/Df7kSgBJVNz';

describe('Threads embed code', () => {
  it('parses the Embed dialog code', () => {
    expect(parseEmbed(oembed)).toEqual({
      ...post,
      options: { version: 0 },
      // The logo SVG and all inline styles are dropped; the structure and link remain.
      fallbackHtml: ` <a href="${permalink}"> <div><div> </div><div> View on Threads</div></div></a>`,
    });
  });

  it('keeps the theme when the code carries one', () => {
    expect(
      parseEmbed(
        oembed.replace(
          'data-text-post-version="0"',
          'data-text-post-version="0" data-theme="dark"',
        ),
      )?.options,
    ).toEqual({ theme: 'dark', version: 0 });
  });

  it('ignores the inline max-width', () => {
    expect(parseEmbed(maxWidth)).toEqual(parseEmbed(oembed));
  });

  it('rejects an element id that does not match the permalink', () => {
    expect(
      parseEmbed(oembed.replace('id="ig-tp-Df7kSgBJVNz"', 'id="ig-tp-other"')),
    ).toBeNull();
  });

  it('rejects a permalink on another host', () => {
    expect(
      parseEmbed(
        oembed.replace(
          'data-text-post-permalink="https://www.threads.com/',
          'data-text-post-permalink="https://example.com/',
        ),
      ),
    ).toBeNull();
  });
});

describe('Threads URLs', () => {
  it.each([
    'https://www.threads.com/@threads/post/Df7kSgBJVNz',
    'https://www.threads.net/@threads/post/Df7kSgBJVNz/',
    'https://threads.com/t/Df7kSgBJVNz?xmt=abc',
    'https://www.threads.net/t/Df7kSgBJVNz',
  ])('%s', (url) => {
    expect(matchUrl(url)).toEqual({ ...post, options: {} });
  });

  it.each([
    'https://www.threads.com/@instagram',
    'https://www.threads.com/t/',
    'https://threads.example/t/Df7kSgBJVNz',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
