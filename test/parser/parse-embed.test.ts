import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import facebookPost from '../fixtures/facebook/post-iframe.html?raw';
import facebookVideo from '../fixtures/facebook/video-sdk-docs.html?raw';
import instagram from '../fixtures/instagram/post-captioned.html?raw';
import threads from '../fixtures/threads/oembed.html?raw';
import x from '../fixtures/x/oembed-basic.html?raw';
import youtube from '../fixtures/youtube/share.html?raw';

const blockquote = x.slice(0, x.indexOf('<script'));
const script = x.slice(x.indexOf('<script'));

describe('parseEmbed input rules', () => {
  it('accepts the embed alone, and surrounding whitespace and comments', () => {
    expect(parseEmbed(blockquote)?.id).toBe('20');
    expect(parseEmbed(`\n  <!-- embed -->\n${x}\n`)?.id).toBe('20');
  });

  it.each([
    ['a wrapper element', `<p>${x}</p>`],
    ['text next to the embed', `See this: ${x}`],
    ['two embeds', `${blockquote}${blockquote}`],
    ['two platforms', `${blockquote}${youtube}`],
    [
      'a script from another site',
      `${blockquote}<script src="https://cdn.example/x.js"></script>`,
    ],
    [
      'another platform script',
      `${blockquote}<script async src="https://www.threads.com/embed.js"></script>`,
    ],
    ['an inline script', `${blockquote}<script>alert(1)</script>`],
    [
      'a script with content',
      script.replace('></script>', '>alert(1)</script>'),
    ],
    ['fb-root next to a non-Facebook embed', `<div id="fb-root"></div>${x}`],
    ['malformed markup', x.replace('</blockquote>', '')],
    ['an unknown element', '<div class="embed">x</div>'],
    ['an empty string', ''],
    ['plain text', 'https://x.com/jack/status/20'],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(parseEmbed(undefined as unknown as string)).toBeNull();
    expect(matchUrl(42 as unknown as string)).toBeNull();
  });
});

describe('robustness', () => {
  // Deterministic pseudo-random fragments of real embed codes must never make the parser throw.
  const corpus = [x, threads, youtube, instagram, facebookPost, facebookVideo]
    .join('')
    .concat('<<>>&#;&#x;"\'=/ %%');
  let seed = 1;
  const random = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return seed / 2 ** 32;
  };

  it('never throws on deeply nested input', () => {
    const deep = '<div>'.repeat(50_000) + '</div>'.repeat(50_000);
    expect(parseEmbed(deep)).toBeNull();
  });

  it('never throws', () => {
    for (let run = 0; run < 3000; run++) {
      const start = Math.floor(random() * corpus.length);
      const fragment = corpus.slice(start, start + Math.floor(random() * 400));
      expect(() => parseEmbed(fragment)).not.toThrow();
      expect(() => matchUrl(fragment)).not.toThrow();
    }
  });
});
