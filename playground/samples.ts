import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const PLATFORMS = {
  x: 'X',
  instagram: 'Instagram',
  threads: 'Threads',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

export interface Sample {
  label: string;
  value: string;
}

/** A real embed code from the package's test fixtures (see test/fixtures/README.md). */
function fixture(file: string): string {
  return readFileSync(
    join(process.cwd(), '..', 'test', 'fixtures', file),
    'utf8',
  );
}

/** A Facebook reel's iframe embed code that shows the post text. */
export function facebookReel(): string {
  return fixture('facebook/video-iframe-reel.html');
}

/** Embed code per platform: the fixtures, plus variants no current source produces. */
export function embedCodes(platform: PlatformKey): Sample[] {
  switch (platform) {
    case 'x':
      return [
        { label: 'oEmbed', value: fixture('x/oembed-basic.html') },
        {
          label: 'oEmbed, dark theme and options',
          value: fixture('x/oembed-options.html'),
        },
        { label: 'oEmbed, photo link', value: fixture('x/oembed-link.html') },
        { label: 'oEmbed, hashtag', value: fixture('x/oembed-hashtag.html') },
      ];
    case 'instagram':
      return [
        {
          label:
            'Embed dialog, caption on (post since removed: onError after the retries)',
          value: fixture('instagram/post-captioned.html'),
        },
      ];
    case 'threads':
      return [
        { label: 'oEmbed', value: fixture('threads/oembed.html') },
        {
          label: 'oEmbed, maxwidth 400',
          value: fixture('threads/oembed-maxwidth.html'),
        },
      ];
    case 'facebook':
      return [
        {
          label: 'Post, iframe from the Embed dialog (rendered with the SDK)',
          value: fixture('facebook/post-iframe.html'),
        },
        {
          label:
            'Post, SDK code from Meta’s docs (post since removed: Facebook shows a notice)',
          value: fixture('facebook/post-sdk-docs.html'),
        },
        {
          label: 'Video, SDK code from Meta’s docs',
          value: fixture('facebook/video-sdk-docs.html'),
        },
        {
          label:
            'Reel, iframe with the post text from the Embed dialog (rendered with the SDK)',
          value: facebookReel(),
        },
        {
          label: 'Video, iframe without the post text (derived)',
          value:
            '<iframe src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Ffacebook%2Fvideos%2F10153231379946729%2F&show_text=false&width=560&t=0" width="560" height="314" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',
        },
      ];
    case 'tiktok':
      return [
        { label: 'oEmbed', value: fixture('tiktok/oembed-player.html') },
        {
          label: 'Share dialog',
          value: fixture('tiktok/webapp-share-player.html'),
        },
        {
          label: 'Legacy blockquote (derived)',
          value:
            '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@scout2015/video/6718335390845095173" data-video-id="6718335390845095173" style="max-width: 605px;min-width: 325px;"><section><a target="_blank" href="https://www.tiktok.com/@scout2015">@scout2015</a></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>',
        },
      ];
    case 'youtube':
      return [
        { label: 'Share dialog', value: fixture('youtube/share.html') },
        {
          label: 'Share dialog, start at 0:11',
          value: fixture('youtube/share-start.html'),
        },
        {
          label: 'Share dialog, privacy-enhanced, no controls, start at 0:11',
          value: fixture('youtube/share-nocookie-controls-start.html'),
        },
        { label: 'oEmbed', value: fixture('youtube/oembed.html') },
      ];
  }
}

export const URLS: Record<PlatformKey, Sample[]> = {
  x: [
    { label: 'x.com', value: 'https://x.com/jack/status/20' },
    {
      label: 'twitter.com',
      value: 'https://twitter.com/BarackObama/status/266031293945503744',
    },
  ],
  instagram: [
    {
      label: 'Post since removed',
      value: 'https://www.instagram.com/p/Dc85J9XNoGN/',
    },
    { label: 'Post', value: 'https://www.instagram.com/p/DfPQchkG1tg/' },
  ],
  threads: [
    {
      label: 'Post',
      value: 'https://www.threads.com/@instagram/post/DfQSavwEs5C',
    },
  ],
  facebook: [
    {
      label: 'Post since removed (Facebook shows a notice)',
      value: 'https://www.facebook.com/20531316728/posts/10154009990506729/',
    },
    {
      label: 'Video',
      value: 'https://www.facebook.com/facebook/videos/10153231379946729/',
    },
  ],
  tiktok: [
    {
      label: 'Video',
      value: 'https://www.tiktok.com/@scout2015/video/6718335390845095173',
    },
  ],
  youtube: [
    { label: 'Watch', value: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' },
    {
      label: 'Short link, start at 1:30',
      value: 'https://youtu.be/jNQXAC9IVRw?t=90',
    },
  ],
};
