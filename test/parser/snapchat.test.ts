import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import lens from '../fixtures/snapchat/lens-share.html?raw';
import profile from '../fixtures/snapchat/profile-share.html?raw';

const SPOTLIGHT_ID =
  'W7_EDlXWTBiXAEEniNoMPwAAYaGxkaHh3Y2xiAZ0qvNuuAZ0qvBmIAAAAAQ';

describe('Snapchat embed code', () => {
  it('parses a profile', () => {
    expect(parseEmbed(profile)).toEqual({
      platform: 'snapchat',
      kind: 'post',
      url: 'https://www.snapchat.com/@teamsnapchat',
      id: 'teamsnapchat',
      variant: 'iframe',
      options: { title: 'Team Snapchat' },
      size: { width: 416, height: 692 },
    });
  });

  it('parses a Lens', () => {
    expect(parseEmbed(lens)).toEqual({
      platform: 'snapchat',
      kind: 'post',
      url: 'https://www.snapchat.com/lens/41b1e6372aa44fb89f903ecd48a4ab8b',
      id: '41b1e6372aa44fb89f903ecd48a4ab8b',
      variant: 'iframe',
      options: { title: 'Dog Lens' },
      size: { width: 416, height: 692 },
    });
  });

  // No real fixture: the Embed dialog of a Spotlight video shows an app prompt
  // (docs/decisions.md D50).
  it('parses a Spotlight video built from the same markup', () => {
    const html = profile.replaceAll(
      'https://www.snapchat.com/@teamsnapchat',
      `https://www.snapchat.com/@yang_sixiang/spotlight/${SPOTLIGHT_ID}`,
    );
    expect(parseEmbed(html)).toMatchObject({
      kind: 'video',
      url: `https://www.snapchat.com/@yang_sixiang/spotlight/${SPOTLIGHT_ID}`,
      id: SPOTLIGHT_ID,
    });
  });

  it('rejects an embed URL without /embed', () => {
    expect(
      parseEmbed(profile.replace('@teamsnapchat/embed', '@teamsnapchat')),
    ).toBeNull();
  });

  it('rejects links to another account', () => {
    expect(
      parseEmbed(
        profile.replace(
          'href="https://www.snapchat.com/@teamsnapchat"',
          'href="https://www.snapchat.com/@someoneelse"',
        ),
      ),
    ).toBeNull();
  });

  it('rejects another host', () => {
    expect(
      parseEmbed(
        profile.replace(
          'data-snapchat-embed-url="https://www.snapchat.com/',
          'data-snapchat-embed-url="https://example.com/',
        ),
      ),
    ).toBeNull();
  });
});

describe('Snapchat URLs', () => {
  it.each([
    [
      `https://www.snapchat.com/spotlight/${SPOTLIGHT_ID}`,
      'video',
      SPOTLIGHT_ID,
      `https://www.snapchat.com/spotlight/${SPOTLIGHT_ID}`,
    ],
    [
      `https://snapchat.com/@yang_sixiang/spotlight/${SPOTLIGHT_ID}?share_id=x&locale=bg-BG`,
      'video',
      SPOTLIGHT_ID,
      `https://www.snapchat.com/@yang_sixiang/spotlight/${SPOTLIGHT_ID}`,
    ],
    [
      'https://www.snapchat.com/@teamsnapchat',
      'post',
      'teamsnapchat',
      'https://www.snapchat.com/@teamsnapchat',
    ],
    [
      'https://www.snapchat.com/add/teamsnapchat',
      'post',
      'teamsnapchat',
      'https://www.snapchat.com/@teamsnapchat',
    ],
    [
      'https://www.snapchat.com/lens/61141491143',
      'post',
      '61141491143',
      'https://www.snapchat.com/lens/61141491143',
    ],
    [
      'https://www.snapchat.com/@erling.haaland/highlight/2312d242-718d-41be-aa25-36f70b5169fb',
      'post',
      '2312d242-718d-41be-aa25-36f70b5169fb',
      'https://www.snapchat.com/@erling.haaland/highlight/2312d242-718d-41be-aa25-36f70b5169fb',
    ],
  ])('%s', (input, kind, id, url) => {
    expect(matchUrl(input)).toEqual({
      platform: 'snapchat',
      kind,
      url,
      id,
      variant: 'iframe',
      options: {},
    });
  });

  // These have no /embed page (docs/decisions.md D50).
  it.each([
    'https://www.snapchat.com/@erling.haaland/_okTjPWBROGWHUK3mnmVIwAAgdXhkYWd6cXNmAaHsDXXqAaHsDXFnAAAAAA',
    'https://www.snapchat.com/p/9d647766-d450-45e9-b2a9-6b656b92c808',
    'https://t.snapchat.com/abcdef',
    'https://www.snapchat.com/spotlight',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
