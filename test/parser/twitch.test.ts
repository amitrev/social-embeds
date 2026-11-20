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
      url: 'https://www.twitch.tv/twitch',
      id: 'twitch',
      options: { muted: true },
      size,
    });
  });

  it('parses a past broadcast and a collection', () => {
    expect(parseEmbed(video)).toEqual({
      ...base,
      url: 'https://www.twitch.tv/videos/1816688726',
      id: '1816688726',
      options: { autoplay: false },
      size,
    });
    expect(parseEmbed(collection)).toMatchObject({
      url: 'https://www.twitch.tv/collections/ryMlWIJaBxf2aQ',
      id: 'ryMlWIJaBxf2aQ',
    });
  });

  it('parses a clip', () => {
    expect(
      parseEmbed(
        '<iframe src="https://clips.twitch.tv/embed?clip=LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu&parent=streamernews.example.com&autoplay=true" height="360" width="640" allowfullscreen></iframe>',
      ),
    ).toEqual({
      ...base,
      url: 'https://clips.twitch.tv/LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      id: 'LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      options: { autoplay: true },
      size: { width: 640, height: 360 },
    });
  });

  it('follows the player: channel wins over video', () => {
    expect(
      parseEmbed(channel.replace('channel=twitch', 'channel=twitch&video=v1')),
    ).toMatchObject({ id: 'twitch' });
  });

  it.each([
    ['another host', channel.replace('player.twitch.tv', 'example.com')],
    ['no channel, video or collection', channel.replace('channel=twitch&', '')],
    ['a bad channel name', channel.replace('channel=twitch', 'channel=a!b')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Twitch URLs', () => {
  it.each([
    [
      'https://www.twitch.tv/Twitch',
      'https://www.twitch.tv/twitch',
      'twitch',
      {},
    ],
    [
      'https://m.twitch.tv/twitch/',
      'https://www.twitch.tv/twitch',
      'twitch',
      {},
    ],
    [
      'https://www.twitch.tv/videos/1816688726?t=1h2m3s',
      'https://www.twitch.tv/videos/1816688726',
      '1816688726',
      { time: '1h2m3s' },
    ],
    [
      'https://www.twitch.tv/collections/ryMlWIJaBxf2aQ',
      'https://www.twitch.tv/collections/ryMlWIJaBxf2aQ',
      'ryMlWIJaBxf2aQ',
      {},
    ],
    [
      'https://www.twitch.tv/twitch/clip/LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      'https://clips.twitch.tv/LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      'LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      {},
    ],
    [
      'https://clips.twitch.tv/LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      'https://clips.twitch.tv/LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      'LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
      {},
    ],
  ])('%s', (input, url, id, options) => {
    expect(matchUrl(input)).toEqual({ ...base, url, id, options });
  });

  it.each([
    'https://www.twitch.tv/directory',
    'https://www.twitch.tv/videos',
    'https://www.twitch.tv/twitch/videos',
    'https://example.com/twitch',
  ])('rejects %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
