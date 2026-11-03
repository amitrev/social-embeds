import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import maxWidth from '../fixtures/threads/oembed-maxwidth.html?raw';
import oembed from '../fixtures/threads/oembed.html?raw';

const post = {
  platform: 'threads',
  kind: 'post',
  url: 'https://www.threads.com/t/DfQSavwEs5C',
  id: 'DfQSavwEs5C',
  variant: 'sdk',
} as const;

const permalink =
  'https://www.threads.com/t/DfQSavwEs5C?utm_source=th_embed&amp;utm_campaign=threads_api';

describe('Threads embed code', () => {
  it('parses the oEmbed code', () => {
    expect(parseEmbed(oembed)).toEqual({
      ...post,
      options: { theme: 'light', version: 0 },
      // The logo SVG and all inline styles are dropped; the structure and link remain.
      fallbackHtml: ` <a href="${permalink}"> <div>\n<div> \n</div>\n<div> View on Threads</div>\n</div></a>\n`,
    });
  });

  it('ignores the inline max-width set by the oEmbed maxwidth parameter', () => {
    expect(parseEmbed(maxWidth)).toEqual(parseEmbed(oembed));
  });

  it('rejects an element id that does not match the permalink', () => {
    expect(
      parseEmbed(oembed.replace('id="ig-tp-DfQSavwEs5C"', 'id="ig-tp-other"')),
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
    'https://www.threads.com/@instagram/post/DfQSavwEs5C',
    'https://www.threads.net/@instagram/post/DfQSavwEs5C/',
    'https://threads.com/t/DfQSavwEs5C?xmt=abc',
    'https://www.threads.net/t/DfQSavwEs5C',
  ])('%s', (url) => {
    expect(matchUrl(url)).toEqual({ ...post, options: {} });
  });

  it.each([
    'https://www.threads.com/@instagram',
    'https://www.threads.com/t/',
    'https://threads.example/t/DfQSavwEs5C',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
