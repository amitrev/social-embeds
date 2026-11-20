import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import collapsed from '../fixtures/linkedin/post-collapsed.html?raw';
import full from '../fixtures/linkedin/post-full.html?raw';

const post = (type: string, id: string) =>
  ({
    platform: 'linkedin',
    kind: 'post',
    url: `https://www.linkedin.com/feed/update/urn:li:${type}:${id}/`,
    id: `urn:li:${type}:${id}`,
    variant: 'iframe',
  }) as const;

describe('LinkedIn embed code', () => {
  it('parses the full post', () => {
    expect(parseEmbed(full)).toEqual({
      ...post('ugcPost', '7528828146767409153'),
      options: {},
      size: { width: 504, height: 525 },
    });
  });

  it('keeps collapsed from the "less text" option', () => {
    expect(parseEmbed(collapsed)).toEqual({
      ...post('ugcPost', '7528828146767409153'),
      options: { collapsed: 1 },
      size: { width: 504, height: 525 },
    });
  });

  it('accepts share and activity URNs', () => {
    expect(
      parseEmbed(full.replace('urn:li:ugcPost:', 'urn:li:share:'))?.id,
    ).toBe('urn:li:share:7528828146767409153');
    expect(
      parseEmbed(full.replace('urn:li:ugcPost:', 'urn:li:activity:'))?.id,
    ).toBe('urn:li:activity:7528828146767409153');
  });

  it.each([
    ['another path', full.replace('/embed/feed/update/', '/feed/update/')],
    ['another URN type', full.replace('urn:li:ugcPost:', 'urn:li:member:')],
    ['another host', full.replace('www.linkedin.com', 'example.com')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('LinkedIn URLs', () => {
  it.each([
    [
      'https://www.linkedin.com/feed/update/urn:li:activity:7528828146767409153/',
      post('activity', '7528828146767409153'),
    ],
    [
      'https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7528828146767409153',
      post('share', '7528828146767409153'),
    ],
    [
      'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7528828146767409153?collapsed=1',
      post('ugcPost', '7528828146767409153'),
    ],
    [
      'https://www.linkedin.com/posts/linkedin_new-features-activity-7528828146767409153-Ab1c?utm_source=share',
      post('activity', '7528828146767409153'),
    ],
    [
      'https://bg.linkedin.com/posts/someone_title-ugcPost-7528828146767409153-xY_z/',
      post('ugcPost', '7528828146767409153'),
    ],
  ])('%s', (input, expected) => {
    expect(matchUrl(input)).toEqual({ ...expected, options: {} });
  });

  it.each([
    'https://www.linkedin.com/in/someone/',
    'https://www.linkedin.com/feed/update/urn:li:member:7528828146767409153/',
    'https://www.linkedin.com/posts/someone_title-7528828146767409153',
    'https://lnkd.in/abcdef',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
