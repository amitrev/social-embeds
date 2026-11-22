import { describe, expect, it } from 'vitest';
import {
  facebookDriver,
  instagramDriver,
  pinterestDriver,
  threadsDriver,
  xDriver,
} from '../../src/core/drivers';
import { facebookPlan, facebookVideoPlan } from '../../src/core/plans/facebook';
import { instagramPlan } from '../../src/core/plans/instagram';
import { pinterestPlan } from '../../src/core/plans/pinterest';
import { threadsPlan } from '../../src/core/plans/threads';
import { xPlan } from '../../src/core/plans/x';
import { resolveEmbed } from '../../src/core/resolve';
import { parserFor } from '../../src/parser/platforms';
import { parseEmbed, type ParsedEmbed, type Platform } from '../../src/parser';
import postIframe from '../fixtures/facebook/post-iframe.html?raw';
import videoIframe from '../fixtures/facebook/video-iframe-reel.html?raw';
import videoSdk from '../fixtures/facebook/video-sdk-docs.html?raw';
import instagramCode from '../fixtures/instagram/post-captioned.html?raw';
import pinterestIframe from '../fixtures/pinterest/oembed-iframe.html?raw';
import threadsCode from '../fixtures/threads/embed-dialog.html?raw';
import xOptions from '../fixtures/x/oembed-options.html?raw';

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

const reel = encodeURIComponent(
  'https://www.facebook.com/reel/1523911562856332',
);
const FACEBOOK_ALLOW =
  'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';

describe('xPlan', () => {
  it('builds the status link for a URL', () => {
    const markup =
      '<blockquote><a href="https://x.com/jack/status/20"></a></blockquote>';
    expect(
      xPlan(fromUrl('https://twitter.com/jack/status/20', 'x'), {}),
    ).toEqual({
      kind: 'script',
      key: markup,
      markup,
      driver: xDriver,
      minHeight: 250,
      label: 'X',
      hasFallback: false,
      maxWidth: 550,
    });
  });

  it('uses the driver and keeps the embed code options and fallback', () => {
    const embed = fromCode(xOptions, 'x');
    const plan = xPlan(embed, {});
    const markup = `<blockquote data-theme="dark" data-cards="hidden" data-align="center" data-lang="es" data-dnt="true" data-width="400">${embed.fallbackHtml ?? ''}</blockquote>`;
    expect(plan).toEqual({
      kind: 'script',
      key: markup,
      markup,
      driver: xDriver,
      minHeight: 250,
      label: 'X',
      hasFallback: true,
      maxWidth: 550,
    });
    if (plan.kind === 'script') expect(plan.driver).toBe(xDriver);
  });

  it('lets an option replace the embed code one', () => {
    const embed = fromCode(xOptions, 'x');
    const plan = xPlan(embed, { theme: 'light', conversation: 'none' });
    expect(plan).toMatchObject({
      kind: 'script',
      markup: expect.stringMatching(
        /^<blockquote data-theme="light" data-conversation="none" data-cards="hidden" /,
      ) as string,
    });
  });
});

describe('instagramPlan', () => {
  it('builds the permalink blockquote for a URL', () => {
    const markup =
      '<blockquote data-instgrm-permalink="https://www.instagram.com/p/Df75lxnmIrF/" style="width:calc(100% - 2px)"></blockquote>';
    expect(
      instagramPlan(
        fromUrl('https://www.instagram.com/p/Df75lxnmIrF/', 'instagram'),
        {},
      ),
    ).toEqual({
      kind: 'script',
      key: markup,
      markup,
      driver: instagramDriver,
      minHeight: 680,
      label: 'Instagram',
      hasFallback: false,
      maxWidth: 540,
    });
  });

  it('keeps the embed code version, caption and fallback', () => {
    const embed = fromCode(instagramCode, 'instagram');
    const markup = `<blockquote data-instgrm-permalink="https://www.instagram.com/p/Df75lxnmIrF/" data-instgrm-version="14" data-instgrm-captioned style="width:calc(100% - 2px)">${embed.fallbackHtml ?? ''}</blockquote>`;
    expect(instagramPlan(embed, {})).toEqual({
      kind: 'script',
      key: markup,
      markup,
      driver: instagramDriver,
      minHeight: 680,
      label: 'Instagram',
      hasFallback: true,
      maxWidth: 540,
    });
  });

  it('lets captioned replace the embed code one', () => {
    const embed = fromCode(instagramCode, 'instagram');
    const plan = instagramPlan(embed, { captioned: false });
    expect(plan.kind === 'script' && plan.markup).not.toContain('captioned');
    expect(
      instagramPlan(
        fromUrl('https://www.instagram.com/p/Df75lxnmIrF/', 'instagram'),
        { captioned: true },
      ),
    ).toMatchObject({
      markup:
        '<blockquote data-instgrm-permalink="https://www.instagram.com/p/Df75lxnmIrF/" data-instgrm-captioned style="width:calc(100% - 2px)"></blockquote>',
    });
  });
});

describe('threadsPlan', () => {
  it('builds the permalink blockquote for a URL', () => {
    const markup =
      '<blockquote data-text-post-permalink="https://www.threads.com/t/Df5MmLBm0O7" data-text-post-version="0" id="ig-tp-Df5MmLBm0O7"></blockquote>';
    expect(
      threadsPlan(
        fromUrl(
          'https://www.threads.com/@instagram/post/Df5MmLBm0O7',
          'threads',
        ),
        {},
      ),
    ).toEqual({
      kind: 'script',
      key: markup,
      markup,
      driver: threadsDriver,
      minHeight: 240,
      label: 'Threads',
      hasFallback: false,
      maxWidth: 658,
    });
  });

  it('keeps the embed code fallback', () => {
    const embed = fromCode(threadsCode, 'threads');
    const markup = `<blockquote data-text-post-permalink="https://www.threads.com/t/Df5MmLBm0O7" data-text-post-version="0" id="ig-tp-Df5MmLBm0O7">${embed.fallbackHtml ?? ''}</blockquote>`;
    expect(threadsPlan(embed, {})).toEqual({
      kind: 'script',
      key: markup,
      markup,
      driver: threadsDriver,
      minHeight: 240,
      label: 'Threads',
      hasFallback: true,
      maxWidth: 658,
    });
  });

  it('adds the theme option', () => {
    const plan = threadsPlan(
      fromUrl('https://www.threads.com/@instagram/post/Df5MmLBm0O7', 'threads'),
      { theme: 'dark' },
    );
    expect(plan).toMatchObject({
      markup:
        '<blockquote data-text-post-permalink="https://www.threads.com/t/Df5MmLBm0O7" data-text-post-version="0" id="ig-tp-Df5MmLBm0O7" data-theme="dark"></blockquote>',
    });
  });
});

describe('pinterestPlan', () => {
  const pin = 'https://www.pinterest.com/pin/424605071145752542/';

  it('builds the pin link at the default width for a URL', () => {
    const markup = `<a href="${pin}"></a>`;
    expect(pinterestPlan(fromUrl(pin, 'pinterest'), {})).toEqual({
      kind: 'script',
      key: markup,
      markup,
      driver: pinterestDriver,
      minHeight: 270,
      label: 'Pinterest',
      hasFallback: false,
      maxWidth: 236,
    });
  });

  it('takes maxWidth from pinWidth', () => {
    const markup = `<a href="${pin}" data-pin-width="large"></a>`;
    expect(
      pinterestPlan(fromCode(pinterestIframe, 'pinterest'), {
        pinWidth: 'large',
      }),
    ).toEqual({
      kind: 'script',
      key: markup,
      markup,
      driver: pinterestDriver,
      minHeight: 270,
      label: 'Pinterest',
      hasFallback: false,
      maxWidth: 600,
    });
    expect(
      pinterestPlan(fromUrl(pin, 'pinterest'), { pinWidth: 'medium' }),
    ).toMatchObject({ maxWidth: 345 });
  });
});

describe('facebookPlan', () => {
  const video = 'https://www.facebook.com/facebook/videos/10153231379946729/';

  it('builds an SDK post at most 750px wide', () => {
    const embed = fromUrl(
      'https://m.facebook.com/facebook/posts/1710463914458955',
      'facebook',
    );
    const markup =
      '<div class="fb-post" data-href="https://www.facebook.com/facebook/posts/1710463914458955"></div>';
    const plan = facebookPlan(embed, { locale: 'bg_BG' });
    expect(plan).toEqual({
      kind: 'script',
      key: `bg_BG ${markup}`,
      markup,
      driver: facebookDriver('bg_BG'),
      minHeight: 300,
      label: 'Facebook',
      hasFallback: false,
      maxWidth: 750,
    });
    // facebookDriver returns the one driver per locale, so identity holds.
    if (plan.kind === 'script') {
      expect(plan.driver).toBe(facebookDriver('bg_BG'));
      expect(plan.driver).not.toBe(facebookDriver('en_US'));
    }
  });

  it('keeps the post embed code options and defaults the locale', () => {
    const markup =
      '<div class="fb-post" data-href="https://www.facebook.com/facebook/posts/pfbid0LNzRz67SN7wHoVMbZnhzwU3Cu7RwipTFrJw8jqo88cP3Ay3uezQjjA5n4XeSLRvAl" data-width="500" data-show-text="true"></div>';
    expect(facebookPlan(fromCode(postIframe, 'facebook'), {})).toMatchObject({
      kind: 'script',
      key: `en_US ${markup}`,
      markup,
      minHeight: 300,
      maxWidth: 750,
    });
  });

  it('builds an SDK video with no width limit and keeps its fallback', () => {
    const embed = fromCode(videoSdk, 'facebook');
    const markup = `<div class="fb-video" data-href="${video}" data-width="500" data-show-text="false">${embed.fallbackHtml ?? ''}</div>`;
    const plan = facebookPlan(embed, {});
    expect(plan).toEqual({
      kind: 'script',
      key: `en_US ${markup}`,
      markup,
      driver: facebookDriver('en_US'),
      minHeight: 200,
      label: 'Facebook',
      hasFallback: true,
      maxWidth: undefined,
    });
  });

  it('takes the locale from the embed code unless the option says otherwise', () => {
    const embed = fromUrl(video, 'facebook');
    embed.options.locale = 'de_DE';
    expect(facebookPlan(embed, {})).toMatchObject({
      key: expect.stringMatching(/^de_DE /) as string,
    });
    expect(facebookPlan(embed, { locale: 'fr_FR' })).toMatchObject({
      key: expect.stringMatching(/^fr_FR /) as string,
    });
  });

  it('adds the video options to an SDK video', () => {
    expect(
      facebookPlan(fromUrl(video, 'facebook'), {
        autoplay: true,
        showCaptions: true,
        allowfullscreen: false,
      }),
    ).toMatchObject({
      markup: `<div class="fb-video" data-href="${video}" data-allowfullscreen="false" data-autoplay="true" data-show-captions="true"></div>`,
    });
  });

  it('renders video iframe code with the post text through the SDK', () => {
    expect(facebookPlan(fromCode(videoIframe, 'facebook'), {})).toMatchObject({
      kind: 'script',
      markup: `<div class="fb-video" data-href="${decodeURIComponent(reel)}" data-show-text="true"></div>`,
    });
  });

  it('keeps video iframe code without the post text as the plain iframe', () => {
    const embed = fromCode(
      videoIframe
        .replace('show_text=true', 'show_text=false')
        .replace('height="591"', 'height="476"'),
      'facebook',
    );
    expect(facebookPlan(embed, {})).toEqual({
      kind: 'iframe',
      src: `https://www.facebook.com/plugins/video.php?href=${reel}&height=476&show_text=false&width=267&t=0`,
      title: 'Facebook video player',
      allow: FACEBOOK_ALLOW,
      scrolling: 'no',
      ratio: { width: 16, height: 9 },
      size: { width: 267, height: 476 },
    });
  });

  it('renders a sized video without its post text as the plain iframe', () => {
    const plan = facebookPlan(
      fromCode(videoIframe.replace('&t=0', '&show_captions=true'), 'facebook'),
      {
        showText: false,
        autoplay: true,
      },
    );
    expect(plan).toEqual({
      kind: 'iframe',
      src: `https://www.facebook.com/plugins/video.php?href=${reel}&show_text=false&autoplay=true&show_captions=true&width=267&height=476`,
      title: 'Facebook video player',
      allow: FACEBOOK_ALLOW,
      scrolling: 'no',
      ratio: { width: 16, height: 9 },
      size: { width: 267, height: 476 },
    });
  });

  it('keeps a video URL without a size on the SDK when showText is off', () => {
    expect(
      facebookPlan(fromUrl(video, 'facebook'), { showText: false }),
    ).toMatchObject({
      kind: 'script',
      markup: `<div class="fb-video" data-href="${video}" data-show-text="false"></div>`,
    });
  });
});

describe('facebookVideoPlan', () => {
  it('never lets an href option replace the verified video URL', () => {
    const url = 'https://www.facebook.com/facebook/videos/10153231379946729/';
    const plan = facebookVideoPlan({
      platform: 'facebook',
      kind: 'video',
      url,
      id: '10153231379946729',
      variant: 'iframe',
      options: { href: 'https://www.facebook.com/other/videos/1/', t: 5 },
    });
    expect(plan.src).toBe(
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&t=5`,
    );
  });
});
