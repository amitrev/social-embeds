import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import channel from '../fixtures/twitch/docs-channel.html?raw';
import collection from '../fixtures/twitch/docs-collection.html?raw';
import video from '../fixtures/twitch/docs-video.html?raw';

const base = { platform: 'twitch', kind: 'video', variant: 'iframe' } as const;
const size = { width: 1280, height: 720 };

describe('Twitch embed code', () => {
  it('parses a live channel, dropping parent', () => {
    expect(parseEmbed(channel)).toEqual({
      ...base,
      url: 'https://www.twitch.tv/dallas',
      id: 'dallas',
      options: { muted: true },
      size,
    });
  });

  it('parses a past broadcast and a collection', () => {
    expect(parseEmbed(video)).toEqual({
      ...base,
      url: 'https://www.twitch.tv/videos/40464143',
      id: '40464143',
      options: { autoplay: false },
      size,
    });
    expect(parseEmbed(collection)).toMatchObject({
      url: 'https://www.twitch.tv/collections/abcDeF1ghIJ2kL',
      id: 'abcDeF1ghIJ2kL',
    });
  });

  it('parses a clip', () => {
    expect(
      parseEmbed(
        '<iframe src="https://clips.twitch.tv/embed?clip=AwkwardHelplessSalamanderSwiftRage&parent=streamernews.example.com&autoplay=true" height="360" width="640" allowfullscreen></iframe>',
      ),
    ).toEqual({
      ...base,
      url: 'https://clips.twitch.tv/AwkwardHelplessSalamanderSwiftRage',
      id: 'AwkwardHelplessSalamanderSwiftRage',
      options: { autoplay: true },
      size: { width: 640, height: 360 },
    });
  });

  it('follows the player: channel wins over video', () => {
    expect(
      parseEmbed(channel.replace('channel=dallas', 'channel=dallas&video=v1')),
    ).toMatchObject({ id: 'dallas' });
  });

  it.each([
    ['another host', channel.replace('player.twitch.tv', 'example.com')],
    ['no channel, video or collection', channel.replace('channel=dallas&', '')],
    ['a bad channel name', channel.replace('channel=dallas', 'channel=a!b')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Twitch URLs', () => {
  it.each([
    [
      'https://www.twitch.tv/Dallas',
      'https://www.twitch.tv/dallas',
      'dallas',
      {},
    ],
    [
      'https://m.twitch.tv/dallas/',
      'https://www.twitch.tv/dallas',
      'dallas',
      {},
    ],
    [
      'https://www.twitch.tv/videos/40464143?t=1h2m3s',
      'https://www.twitch.tv/videos/40464143',
      '40464143',
      { time: '1h2m3s' },
    ],
    [
      'https://www.twitch.tv/collections/abcDeF1ghIJ2kL',
      'https://www.twitch.tv/collections/abcDeF1ghIJ2kL',
      'abcDeF1ghIJ2kL',
      {},
    ],
    [
      'https://www.twitch.tv/dallas/clip/AwkwardHelplessSalamanderSwiftRage',
      'https://clips.twitch.tv/AwkwardHelplessSalamanderSwiftRage',
      'AwkwardHelplessSalamanderSwiftRage',
      {},
    ],
    [
      'https://clips.twitch.tv/AwkwardHelplessSalamanderSwiftRage',
      'https://clips.twitch.tv/AwkwardHelplessSalamanderSwiftRage',
      'AwkwardHelplessSalamanderSwiftRage',
      {},
    ],
  ])('%s', (input, url, id, options) => {
    expect(matchUrl(input)).toEqual({ ...base, url, id, options });
  });

  it.each([
    'https://www.twitch.tv/directory',
    'https://www.twitch.tv/videos',
    'https://www.twitch.tv/dallas/videos',
    'https://example.com/dallas',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
