import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEmbed } from '../../src/parser';
import { matchWith } from '../../src/parser/match-url';
import { platforms } from '../../src/parser/platforms';

// Per-platform components verify with their own parser alone (docs/decisions.md D103), which
// equals verifying with all of them only while no URL belongs to two platforms.

const fixtures = import.meta.glob<string>('../fixtures/**/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const root = join(import.meta.dirname, '..', '..');
const sources = [
  join(root, 'playground', 'samples.ts'),
  ...readdirSync(join(root, 'test', 'parser')).map((name) =>
    join(root, 'test', 'parser', name),
  ),
];
const literals = new Set(
  sources.flatMap((path) =>
    [...readFileSync(path, 'utf8').matchAll(/'(https?:\/\/[^'\s]+)'/g)].flatMap(
      ([, url]) => (url === undefined ? [] : [url]),
    ),
  ),
);

function owners(url: string): string[] {
  return platforms
    .filter((parser) => matchWith(parser, url))
    .map((parser) => parser.platform);
}

describe('one parser per URL', () => {
  it('has a corpus', () => {
    expect(literals.size).toBeGreaterThan(200);
  });

  it('no URL in the samples or parser tests matches two platforms', () => {
    const shared = [...literals]
      .map((url) => ({ url, owners: owners(url) }))
      .filter((entry) => entry.owners.length > 1);
    expect(shared).toEqual([]);
  });

  it('every canonical URL matches exactly its own platform', () => {
    const canonical = [
      ...[...literals].map((url) => {
        const parser = platforms.find((entry) => matchWith(entry, url));
        return parser && matchWith(parser, url);
      }),
      ...Object.values(fixtures).map((html) => parseEmbed(html)),
    ].flatMap((embed) => (embed ? [embed] : []));
    expect(canonical.length).toBeGreaterThan(100);
    const wrong = canonical.filter(
      (embed) => owners(embed.url).join() !== embed.platform,
    );
    expect(wrong.map((embed) => embed.url)).toEqual([]);
  });
});
