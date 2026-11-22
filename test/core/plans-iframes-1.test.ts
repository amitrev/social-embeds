import { describe, expect, it } from 'vitest';
import { linkedinPlan } from '../../src/core/plans/linkedin';
import { redditPlan } from '../../src/core/plans/reddit';
import { snapchatPlan } from '../../src/core/plans/snapchat';
import { telegramPlan } from '../../src/core/plans/telegram';
import { tiktokPlan } from '../../src/core/plans/tiktok';
import { youtubePlan } from '../../src/core/plans/youtube';
import { resolveEmbed } from '../../src/core/resolve';
import { parserFor } from '../../src/parser/platforms';
import { parseEmbed, type ParsedEmbed, type Platform } from '../../src/parser';
import linkedinCollapsed from '../fixtures/linkedin/post-collapsed.html?raw';
import redditComment from '../fixtures/reddit/comment-share.html?raw';
import snapchatLens from '../fixtures/snapchat/lens-share.html?raw';
import telegramOptions from '../fixtures/telegram/widget-configurator-options.html?raw';
import tiktokPlayer from '../fixtures/tiktok/oembed-player.html?raw';
import youtubeNocookie from '../fixtures/youtube/share-nocookie-controls-start.html?raw';

function parser(platform: Platform) {
  const found = parserFor(platform);
  if (!found) throw new Error(`no parser for ${platform}`);
  return found;
}
function fromUrl(url: string, platform: Platform): ParsedEmbed {
  const { embed } = resolveEmbed(url, undefined, parser(platform));
  if (!embed) throw new Error('url did not resolve');
  return embed;
}

function fromCode(html: string, platform: Platform): ParsedEmbed {
  const parsed = parseEmbed(html);
  if (!parsed) throw new Error('fixture did not parse');
  const { embed } = resolveEmbed(undefined, parsed, parser(platform));
  if (!embed) throw new Error('fixture did not verify');
  return embed;
}

const TIKTOK_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share';
const YOUTUBE_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

describe('tiktokPlan', () => {
  it('builds the Embed Player for a post URL', () => {
    const embed = fromUrl(
      'https://www.tiktok.com/@tiktok/video/7704834703446117662',
      'tiktok',
    );
    expect(tiktokPlan(embed, {})).toEqual({
      kind: 'iframe',
      src: 'https://www.tiktok.com/player/v1/7704834703446117662',
      title: 'TikTok video player',
      allow: TIKTOK_ALLOW,
      ratio: { width: 9, height: 16 },
      size: undefined,
      maxWidth: 325,
    });
  });

  it('keeps the embed code options and size', () => {
    expect(tiktokPlan(fromCode(tiktokPlayer, 'tiktok'), {})).toEqual({
      kind: 'iframe',
      src: 'https://www.tiktok.com/player/v1/7704834703446117662?embed_from=oembed&music_info=1&description=1&autoplay=1&muted=1',
      title: 'TikTok video player',
      allow: TIKTOK_ALLOW,
      ratio: { width: 9, height: 16 },
      size: { width: 325, height: 578 },
      maxWidth: 325,
    });
  });

  it('lets an option replace the embed code value', () => {
    const embed = fromUrl(
      'https://www.tiktok.com/@tiktok/video/7704834703446117662',
      'tiktok',
    );
    expect(
      tiktokPlan(embed, { loop: true, progressBar: false, musicInfo: true }),
    ).toMatchObject({
      src: 'https://www.tiktok.com/player/v1/7704834703446117662?progress_bar=0&loop=1&music_info=1',
    });
  });
});

describe('youtubePlan', () => {
  const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

  it('builds the player for a watch URL', () => {
    expect(youtubePlan(fromUrl(url, 'youtube'), {})).toEqual({
      kind: 'iframe',
      src: 'https://www.youtube.com/embed/jNQXAC9IVRw',
      title: 'YouTube video player',
      allow: YOUTUBE_ALLOW,
      referrerPolicy: 'strict-origin-when-cross-origin',
      ratio: { width: 16, height: 9 },
      size: undefined,
    });
  });

  it('is vertical for a Shorts URL', () => {
    const embed = fromUrl(
      'https://www.youtube.com/shorts/jNQXAC9IVRw',
      'youtube',
    );
    expect(youtubePlan(embed, {})).toMatchObject({
      ratio: { width: 9, height: 16 },
    });
  });

  it('adds an option to the query', () => {
    expect(youtubePlan(fromUrl(url, 'youtube'), { start: 30 })).toMatchObject({
      src: 'https://www.youtube.com/embed/jNQXAC9IVRw?start=30',
    });
  });

  it('plays from youtube-nocookie.com when the embed code does', () => {
    const embed = fromCode(youtubeNocookie, 'youtube');
    const plan = youtubePlan(embed, {});
    expect(plan).toMatchObject({ kind: 'iframe', size: embed.size });
    expect((plan as { src: string }).src).toMatch(
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/jNQXAC9IVRw/,
    );
    expect((plan as { src: string }).src).not.toContain('nocookie=');
  });

  it('lets the nocookie option replace the embed code', () => {
    const embed = fromCode(youtubeNocookie, 'youtube');
    expect(youtubePlan(embed, { nocookie: false })).toMatchObject({
      src: expect.stringMatching(
        /^https:\/\/www\.youtube\.com\/embed\//,
      ) as unknown,
    });
  });
});

describe('telegramPlan', () => {
  it('builds the widget URL for a post URL', () => {
    const embed = fromUrl('https://t.me/telegram/46', 'telegram');
    expect(telegramPlan(embed, {})).toEqual({
      kind: 'iframe',
      src: 'https://t.me/telegram/46?embed=1',
      title: 'Telegram post',
      allow: '',
      scrolling: 'no',
      ratio: { width: 1, height: 1 },
      messageHeight: {
        origin: 'https://t.me',
        read: expect.any(Function) as unknown,
      },
      startHeight: 300,
      maxWidth: 500,
    });
  });

  it('keeps the embed code options and lets an option replace them', () => {
    const embed = fromCode(telegramOptions, 'telegram');
    const base = telegramPlan(embed, {});
    expect(base).toMatchObject({ kind: 'iframe' });
    const plan = telegramPlan(embed, { userpic: false, darkColor: 'ff8800' });
    const src = (plan as { src: string }).src;
    expect(src).toContain('userpic=false');
    expect(src).toContain('dark_color=ff8800');
  });

  it('reads resize messages only', () => {
    const plan = telegramPlan(
      fromUrl('https://t.me/telegram/46', 'telegram'),
      {},
    );
    if (plan.kind !== 'iframe' || !plan.messageHeight) throw new Error('shape');
    const { read } = plan.messageHeight;
    expect(read('{"event":"resize","height":540}')).toBe(540);
    expect(read('{"event":"other","height":540}')).toBeUndefined();
    expect(read(5)).toBeUndefined();
  });
});

describe('snapchatPlan', () => {
  it('builds the /embed page for a URL', () => {
    const embed = fromUrl(
      'https://www.snapchat.com/lens/6451403405463552',
      'snapchat',
    );
    expect(snapchatPlan(embed)).toMatchObject({
      kind: 'iframe',
      src: `${embed.url}/embed`,
      title: 'Snapchat',
      allow: 'autoplay; camera; microphone; clipboard-write;',
      scrolling: 'no',
      ratio: { width: 416, height: 692 },
      maxWidth: 416,
    });
  });

  it('takes the title and size from the embed code', () => {
    const embed = fromCode(snapchatLens, 'snapchat');
    expect(snapchatPlan(embed)).toEqual({
      kind: 'iframe',
      src: `${embed.url}/embed`,
      title:
        typeof embed.options.title === 'string' && embed.options.title !== ''
          ? embed.options.title
          : 'Snapchat',
      allow: 'autoplay; camera; microphone; clipboard-write;',
      scrolling: 'no',
      ratio: { width: 416, height: 692 },
      size: embed.size,
      maxWidth: 416,
    });
  });
});

describe('linkedinPlan', () => {
  it('uses the default size for a URL', () => {
    const embed = fromUrl(
      'https://www.linkedin.com/posts/someone_title-activity-7528828146767409153-Ab1c',
      'linkedin',
    );
    expect(linkedinPlan(embed, {})).toEqual({
      kind: 'iframe',
      src: 'https://www.linkedin.com/embed/feed/update/urn:li:activity:7528828146767409153',
      title: 'LinkedIn post',
      allow: '',
      ratio: { width: 504, height: 670 },
      height: 670,
      maxWidth: 504,
    });
  });

  it('takes the collapsed option and size from the embed code', () => {
    const embed = fromCode(linkedinCollapsed, 'linkedin');
    expect(linkedinPlan(embed, {})).toEqual({
      kind: 'iframe',
      src: 'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7528828146767409153?collapsed=1',
      title: 'LinkedIn post',
      allow: '',
      ratio: { width: 504, height: 670 },
      height: 525,
      maxWidth: 504,
    });
  });

  it('lets collapsed replace the embed code value', () => {
    const embed = fromCode(linkedinCollapsed, 'linkedin');
    expect(linkedinPlan(embed, { collapsed: false })).toMatchObject({
      src: 'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7528828146767409153',
    });
  });
});

describe('redditPlan', () => {
  it('builds the embed.reddit.com URL for a comment embed code', () => {
    const embed = fromCode(redditComment, 'reddit');
    const plan = redditPlan(embed, {});
    expect(plan).toEqual({
      kind: 'iframe',
      src: expect.stringMatching(
        /^https:\/\/embed\.reddit\.com\/r\/.+\?embed=true/,
      ) as unknown,
      title: 'Reddit post',
      allow: 'clipboard-read; clipboard-write',
      sandbox: 'allow-scripts allow-same-origin allow-popups',
      scrolling: 'no',
      ratio: { width: 1, height: 1 },
      messageHeight: {
        origin: 'https://embed.reddit.com',
        read: expect.any(Function) as unknown,
      },
      startHeight: 552,
      maxWidth: 640,
    });
  });

  it('adds options after the embed code ones', () => {
    const embed = fromCode(redditComment, 'reddit');
    const src = (
      redditPlan(embed, { theme: 'dark', depth: 2 }) as { src: string }
    ).src;
    expect(src).toContain('theme=dark');
    expect(src).toContain('depth=2');
  });

  it('reads resize.embed messages only', () => {
    const plan = redditPlan(fromCode(redditComment, 'reddit'), {});
    if (plan.kind !== 'iframe' || !plan.messageHeight) throw new Error('shape');
    const { read } = plan.messageHeight;
    expect(read('{"type":"resize.embed","data":402}')).toBe(402);
    expect(read('{"event":"resize","height":540}')).toBeUndefined();
  });
});
