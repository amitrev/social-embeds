import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import episode from '../fixtures/applepodcasts/share-episode.html?raw';

const base = {
  platform: 'applepodcasts',
  kind: 'post',
  variant: 'iframe',
} as const;

const EPISODE =
  'https://podcasts.apple.com/us/podcast/id1200361736?i=1000802907981';

describe('Apple Podcasts embed code', () => {
  it('parses an episode without its slug', () => {
    expect(parseEmbed(episode)).toEqual({
      ...base,
      url: EPISODE,
      id: '1000802907981',
      options: {},
      size: { width: 640, height: 160 },
    });
  });

  it('accepts a show path without the id prefix', () => {
    expect(
      parseEmbed(
        episode.replace(
          '/did-a-i-break-the-internet-and-other-things/id1200361736?i=1000802907981',
          '/1200361736',
        ),
      ),
    ).toMatchObject({
      url: 'https://podcasts.apple.com/us/podcast/id1200361736',
      id: '1200361736',
    });
  });

  it('rejects another host', () => {
    expect(
      parseEmbed(episode.replace('embed.podcasts.apple.com', 'example.com')),
    ).toBeNull();
  });
});

describe('Apple Podcasts URLs', () => {
  it.each([
    [
      'https://podcasts.apple.com/us/podcast/did-a-i-break-the-internet-and-other-things/id1200361736?i=1000802907981&uo=4',
      EPISODE,
      '1000802907981',
    ],
    [
      'https://podcasts.apple.com/us/podcast/the-daily/id1200361736',
      'https://podcasts.apple.com/us/podcast/id1200361736',
      '1200361736',
    ],
  ])('matches %s', (url, canonical, id) => {
    expect(matchUrl(url)).toEqual({ ...base, url: canonical, id, options: {} });
  });

  it.each([
    'https://podcasts.apple.com/us/channel/the-new-york-times/id6442505455',
    'https://podcasts.apple.com/us/podcast/the-daily/idabc',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
