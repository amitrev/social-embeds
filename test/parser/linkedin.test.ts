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
      ...post('share', '7527261037016817664'),
      options: {},
      size: { width: 504, height: 879 },
    });
  });

  it('keeps collapsed from the "less text" option', () => {
    expect(parseEmbed(collapsed)).toEqual({
      ...post('share', '7508448197254705153'),
      options: { collapsed: 1 },
      size: { width: 504, height: 670 },
    });
  });

  it('accepts ugcPost and activity URNs', () => {
    expect(
      parseEmbed(full.replace('urn:li:share:', 'urn:li:ugcPost:'))?.id,
    ).toBe('urn:li:ugcPost:7527261037016817664');
    expect(
      parseEmbed(full.replace('urn:li:share:', 'urn:li:activity:'))?.id,
    ).toBe('urn:li:activity:7527261037016817664');
  });

  it.each([
    ['another path', full.replace('/embed/feed/update/', '/feed/update/')],
    ['another URN type', full.replace('urn:li:share:', 'urn:li:member:')],
    ['another host', full.replace('www.linkedin.com', 'example.com')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('LinkedIn URLs', () => {
  it.each([
    [
      'https://www.linkedin.com/feed/update/urn:li:activity:7527261038006697984/',
      post('activity', '7527261038006697984'),
    ],
    [
      'https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7527261037016817664',
      post('share', '7527261037016817664'),
    ],
    [
      'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7527261037016817664?collapsed=1',
      post('ugcPost', '7527261037016817664'),
    ],
    [
      'https://www.linkedin.com/posts/pavlin-dobrev_robotics-activity-7527261038006697984-Ab1c?utm_source=share',
      post('activity', '7527261038006697984'),
    ],
    [
      'https://bg.linkedin.com/posts/someone_title-ugcPost-7527261037016817664-xY_z/',
      post('ugcPost', '7527261037016817664'),
    ],
  ])('%s', (input, expected) => {
    expect(matchUrl(input)).toEqual({ ...expected, options: {} });
  });

  it.each([
    'https://www.linkedin.com/in/someone/',
    'https://www.linkedin.com/feed/update/urn:li:member:7527261037016817664/',
    'https://www.linkedin.com/posts/someone_title-7527261038006697984',
    'https://lnkd.in/abcdef',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
