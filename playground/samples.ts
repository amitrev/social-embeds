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
  bluesky: 'Bluesky',
  soundcloud: 'SoundCloud',
  applemusic: 'Apple Music',
  applepodcasts: 'Apple Podcasts',
  tumblr: 'Tumblr',
  kick: 'Kick',
  giphy: 'Giphy',
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
  'https://www.facebook.com/facebook/posts/1710463914458955';

const SNAPCHAT_SPOTLIGHT =
  'https://www.snapchat.com/@specsdevs/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYbXB4dmdmdG9pAZ9IUkWUAZ9IUOjXAAAAAQ';
const PINTEREST_PIN = '424605071145752542';
export const BLUESKY_POST =
  'https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3mxu3hsnebc2v';
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
            '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@tiktok/video/7704834703446117662" data-video-id="7704834703446117662" style="max-width: 605px;min-width: 325px;"><section><a target="_blank" href="https://www.tiktok.com/@tiktok">@tiktok</a></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>',
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
          label: 'Widget code from the docs, with Pinterest’s pin (derived)',
          value: fixture('pinterest/widget-docs.html'),
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
          label: 'Twitch’s channel, in the docs’ code (parent replaced)',
          value: fixture('twitch/docs-channel.html'),
        },
        {
          label: 'Twitch’s video, in the docs’ code (parent replaced)',
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
    case 'bluesky':
      return [{ label: 'oEmbed', value: fixture('bluesky/oembed.html') }];
    case 'soundcloud':
      return [
        {
          label: 'Share, visual player',
          value: fixture('soundcloud/share-visual.html'),
        },
        {
          label: 'Share, classic player',
          value: fixture('soundcloud/share-classic.html'),
        },
        {
          label: 'oEmbed, playlist',
          value: fixture('soundcloud/oembed-playlist.html'),
        },
      ];
    case 'applemusic':
      return [
        { label: 'Album', value: fixture('applemusic/share-album.html') },
        { label: 'Song', value: fixture('applemusic/share-song.html') },
      ];
    case 'applepodcasts':
      return [
        {
          label: 'Episode',
          value: fixture('applepodcasts/share-episode.html'),
        },
      ];
    case 'tumblr':
      return [{ label: 'oEmbed', value: fixture('tumblr/oembed.html') }];
    case 'kick':
      return [
        {
          label: 'Player URL in an iframe',
          value: fixture('kick/player-channel.html'),
        },
      ];
    case 'giphy':
      return [
        { label: 'Fixed', value: fixture('giphy/embed-fixed.html') },
        { label: 'Responsive', value: fixture('giphy/embed-responsive.html') },
      ];
  }
}

export const URLS: Record<PlatformKey, Sample[]> = {
  x: [
    { label: 'x.com', value: 'https://x.com/jack/status/20' },
    {
      label: 'twitter.com',
      value: 'https://twitter.com/XDevelopers/status/1460323737035677698',
    },
  ],
  instagram: [
    { label: 'Post', value: 'https://www.instagram.com/p/Df75lxnmIrF/' },
    { label: 'Reel', value: 'https://www.instagram.com/reel/DfkYarGBOtk/' },
  ],
  threads: [
    {
      label: 'Post',
      value: 'https://www.threads.com/@threads/post/Df7kSgBJVNz',
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
      value: 'https://www.tiktok.com/@tiktok/video/7704834703446117662',
    },
  ],
  youtube: [
    { label: 'Watch', value: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' },
    {
      label: 'Short link, start at 0:11',
      value: 'https://youtu.be/jNQXAC9IVRw?t=11',
    },
  ],
  telegram: [
    { label: 'Post', value: 'https://t.me/telegram/83' },
    { label: 'Post, single', value: 'https://t.me/designers/278?single' },
  ],
  snapchat: [
    { label: 'Spotlight video', value: SNAPCHAT_SPOTLIGHT },
    { label: 'Profile', value: 'https://www.snapchat.com/add/teamsnapchat' },
    {
      label: 'Saved story',
      value:
        'https://www.snapchat.com/@snapgames/highlight/88d1bbae-f29c-4c27-ac5c-f2afe670d8fe',
    },
  ],
  linkedin: [
    {
      label: 'Post (activity URN), default height',
      value:
        'https://www.linkedin.com/feed/update/urn:li:ugcPost:7528828146767409153/',
    },
  ],
  reddit: [
    {
      label: 'Post',
      value: 'https://www.reddit.com/r/reddit/comments/11zso11/',
    },
    {
      label: 'Comment',
      value:
        'https://www.reddit.com/r/reddit/comments/11zso11/comment/jde89cx/',
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
      value: 'https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS',
    },
    {
      label: 'Album',
      value: 'https://open.spotify.com/intl-de/album/4JFX70cq4K7PGohmm5OoNe',
    },
  ],
  vimeo: [
    { label: 'Video', value: 'https://vimeo.com/76979871' },
    {
      label: 'Video, start at 0:30',
      value: 'https://vimeo.com/76979871#t=30s',
    },
  ],
  twitch: [
    { label: 'Channel', value: 'https://www.twitch.tv/twitch' },
    {
      label: 'Clip',
      value:
        'https://www.twitch.tv/twitch/clip/LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu',
    },
  ],
  dailymotion: [
    {
      label: 'Video, no Player ID: reports an error',
      value: DAILYMOTION_VIDEO,
    },
  ],
  bluesky: [
    { label: 'Post, by DID', value: BLUESKY_POST },
    {
      label: 'Post, by handle: reports a lookup error',
      value: 'https://bsky.app/profile/bsky.app/post/3mxu3hsnebc2v',
    },
  ],
  soundcloud: [
    { label: 'Track', value: 'https://soundcloud.com/forss/flickermood' },
    { label: 'Playlist', value: 'https://soundcloud.com/forss/sets/soulhack' },
  ],
  applemusic: [
    {
      label: 'Song on its album',
      value:
        'https://music.apple.com/us/album/birds-of-oaks-bottom-piano-solos/1357820591?i=1357820597',
    },
    {
      label: 'Album',
      value:
        'https://music.apple.com/us/album/birds-of-oaks-bottom-piano-solos/1357820591',
    },
  ],
  applepodcasts: [
    {
      label: 'Show',
      value:
        'https://podcasts.apple.com/us/podcast/monument-valley-meet-the-developer/id947965068',
    },
  ],
  tumblr: [
    {
      label: 'Post',
      value: 'https://staff.tumblr.com/post/828009069026721792',
    },
  ],
  kick: [{ label: 'Channel', value: 'https://kick.com/kick' }],
  giphy: [
    {
      label: 'GIF',
      value:
        'https://giphy.com/gifs/originals-animation-kitten-logo-l41YlHs99JsSptZf2',
    },
  ],
};
