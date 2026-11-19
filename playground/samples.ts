import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const PLATFORMS = {
  x: 'X',
  instagram: 'Instagram',
  threads: 'Threads',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  telegram: 'Telegram',
  snapchat: 'Snapchat',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  pinterest: 'Pinterest',
  spotify: 'Spotify',
  vimeo: 'Vimeo',
  twitch: 'Twitch',
  dailymotion: 'Dailymotion',
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

export interface Sample {
  label: string;
  value: string;
}

function fixture(file: string): string {
  return readFileSync(
    join(process.cwd(), '..', 'test', 'fixtures', file),
    'utf8',
  );
}

const FACEBOOK_POST =
  'https://www.facebook.com/vasil.popov.98/posts/pfbid0r3hJSv19StgY9tsUXoENzXsNzNaPtjm27KZSyJFxk1p16pZxmY5LVdM2jAgZmPnel';

const SNAPCHAT_SPOTLIGHT =
  'https://www.snapchat.com/@yang_sixiang/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYaGxkaHh3Y2xiAZ0qvNuuAZ0qvBmIAAAAAQ';
const PINTEREST_PIN = '99360735500167749';
export const DAILYMOTION_VIDEO = 'https://www.dailymotion.com/video/x84sh87';
// The Player ID in Dailymotion's own iframe docs (test/fixtures/dailymotion/player-id-docs.html).
export const DAILYMOTION_DOCS_PLAYER = 'x8lr5';

export function facebookReel(): string {
  return fixture('facebook/video-iframe-reel.html');
}

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
          label: 'oEmbed, caption on',
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
          label: 'Post, SDK code from Meta’s docs with a live post (derived)',
          value: fixture('facebook/post-sdk-docs.html').replace(
            'https://www.facebook.com/20531316728/posts/10154009990506729/',
            FACEBOOK_POST,
          ),
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
    case 'telegram':
      return [
        {
          label: 'Widget configurator',
          value: fixture('telegram/widget-configurator.html'),
        },
        {
          label: 'Widget configurator, no photo, red accent, dark theme',
          value: fixture('telegram/widget-configurator-options.html'),
        },
      ];
    case 'snapchat':
      return [
        { label: 'Profile', value: fixture('snapchat/profile-share.html') },
        { label: 'Lens', value: fixture('snapchat/lens-share.html') },
        {
          label: 'Spotlight video (derived: the dialog shows an app prompt)',
          value: fixture('snapchat/profile-share.html').replaceAll(
            'https://www.snapchat.com/@teamsnapchat',
            SNAPCHAT_SPOTLIGHT,
          ),
        },
      ];
    case 'linkedin':
      return [
        { label: 'Full post', value: fixture('linkedin/post-full.html') },
        {
          label: '"Less text"',
          value: fixture('linkedin/post-collapsed.html'),
        },
      ];
    case 'reddit':
      return [
        { label: 'Post', value: fixture('reddit/post-share.html') },
        { label: 'Comment', value: fixture('reddit/comment-share.html') },
      ];
    case 'pinterest':
      return [
        {
          label: 'oEmbed iframe (rendered with the widget)',
          value: fixture('pinterest/oembed-iframe.html'),
        },
        {
          label: 'Widget code from the docs, with a live pin (derived)',
          value: fixture('pinterest/widget-docs.html').replace(
            '1234567890',
            PINTEREST_PIN,
          ),
        },
      ];
    case 'spotify':
      return [
        { label: 'oEmbed, track', value: fixture('spotify/oembed-track.html') },
        {
          label: 'oEmbed, podcast episode',
          value: fixture('spotify/oembed-episode.html'),
        },
        {
          label: 'oEmbed, playlist',
          value: fixture('spotify/oembed-playlist.html'),
        },
        {
          label: 'oEmbed, video show',
          value: fixture('spotify/oembed-show-video.html'),
        },
      ];
    case 'vimeo':
      return [
        { label: 'oEmbed', value: fixture('vimeo/oembed.html') },
        {
          label: 'Responsive snippet from Vimeo’s help center (derived)',
          value: fixture('vimeo/responsive-docs.html'),
        },
      ];
    case 'twitch':
      return [
        {
          label: 'Live channel, from Twitch’s docs (parent replaced)',
          value: fixture('twitch/docs-channel.html'),
        },
        {
          label: 'Past broadcast, from Twitch’s docs (parent replaced)',
          value: fixture('twitch/docs-video.html'),
        },
      ];
    case 'dailymotion':
      return [
        {
          label: 'Responsive snippet with a Player ID, from Dailymotion’s docs',
          value: fixture('dailymotion/player-id-docs.html'),
        },
        {
          label: 'oEmbed, no Player ID: reports an error',
          value: fixture('dailymotion/oembed.html'),
        },
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
    { label: 'Post', value: 'https://www.instagram.com/p/DfPQchkG1tg/' },
    { label: 'Reel', value: 'https://www.instagram.com/reel/DfQCqMnhpsG/' },
  ],
  threads: [
    {
      label: 'Post',
      value: 'https://www.threads.com/@instagram/post/DfQSavwEs5C',
    },
  ],
  facebook: [
    { label: 'Post', value: FACEBOOK_POST },
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
  telegram: [
    { label: 'Post', value: 'https://t.me/telegram/83' },
    { label: 'Post, single', value: 'https://t.me/durov/43?single' },
  ],
  snapchat: [
    { label: 'Spotlight video', value: SNAPCHAT_SPOTLIGHT },
    { label: 'Profile', value: 'https://www.snapchat.com/add/teamsnapchat' },
    {
      label: 'Saved story',
      value:
        'https://www.snapchat.com/@erling.haaland/highlight/2312d242-718d-41be-aa25-36f70b5169fb',
    },
  ],
  linkedin: [
    {
      label: 'Post (activity URN), default height',
      value:
        'https://www.linkedin.com/feed/update/urn:li:activity:7527261038006697984/',
    },
  ],
  reddit: [
    {
      label: 'Post',
      value: 'https://www.reddit.com/r/bulgaria/comments/1xz8iq4/',
    },
    {
      label: 'Comment',
      value:
        'https://www.reddit.com/r/bulgaria/comments/1xz8iq4/comment/19st69pk12h39/',
    },
  ],
  pinterest: [
    {
      label: 'Pin',
      value: `https://www.pinterest.com/pin/${PINTEREST_PIN}/`,
    },
  ],
  spotify: [
    {
      label: 'Track, compact player',
      value: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
    },
    {
      label: 'Album',
      value: 'https://open.spotify.com/intl-de/album/4aawyAB9vmqN3uQ7FjRGTy',
    },
  ],
  vimeo: [
    { label: 'Video', value: 'https://vimeo.com/76979871' },
    {
      label: 'Video, start at 0:30',
      value: 'https://vimeo.com/76979871#t=30s',
    },
  ],
  twitch: [{ label: 'Channel', value: 'https://www.twitch.tv/twitch' }],
  dailymotion: [
    {
      label: 'Video, no Player ID: reports an error',
      value: DAILYMOTION_VIDEO,
    },
  ],
};
