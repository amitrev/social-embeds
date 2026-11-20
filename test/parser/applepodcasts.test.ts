import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import episode from '../fixtures/applepodcasts/share-episode.html?raw';

const base = {
  platform: 'applepodcasts',
  kind: 'post',
  variant: 'iframe',
} as const;

const EPISODE =
  'https://podcasts.apple.com/us/podcast/id947965068?i=1000430702647';

describe('Apple Podcasts embed code', () => {
  it('parses an episode without its slug', () => {
    expect(parseEmbed(episode)).toEqual({
      ...base,
      url: EPISODE,
      id: '1000430702647',
      options: {},
      size: { width: 640, height: 160 },
    });
  });

  it('accepts a show path without the id prefix', () => {
    expect(
      parseEmbed(
        episode.replace(
          '/monument-valley-meet-the-developer/id947965068?i=1000430702647',
          '/947965068',
        ),
      ),
    ).toMatchObject({
      url: 'https://podcasts.apple.com/us/podcast/id947965068',
      id: '947965068',
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
      'https://podcasts.apple.com/us/podcast/monument-valley-meet-the-developer/id947965068?i=1000430702647&uo=4',
      EPISODE,
      '1000430702647',
    ],
    [
      'https://podcasts.apple.com/us/podcast/monument-valley-meet-the-developer/id947965068',
      'https://podcasts.apple.com/us/podcast/id947965068',
      '947965068',
    ],
  ])('matches %s', (url, canonical, id) => {
    expect(matchUrl(url)).toEqual({ ...base, url: canonical, id, options: {} });
  });

  it.each([
    'https://podcasts.apple.com/us/channel/a-channel/id1000000001',
    'https://podcasts.apple.com/us/podcast/monument-valley-meet-the-developer/idabc',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
