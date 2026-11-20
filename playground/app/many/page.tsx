import { ReportedEmbed } from '../../components/reported-embed';

const YOUTUBE = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
const TIKTOK = 'https://www.tiktok.com/@tiktok/video/7704834703446117662';
const FACEBOOK_VIDEO =
  'https://www.facebook.com/facebook/videos/10153231379946729/';
const FACEBOOK_POST =
  'https://www.facebook.com/facebook/posts/1710463914458955';
const THREADS = 'https://www.threads.com/@threads/post/Df7kSgBJVNz';
const INSTAGRAM = 'https://www.instagram.com/p/Df75lxnmIrF/';
const X_1 = 'https://x.com/jack/status/20';
const X_2 = 'https://x.com/XDevelopers/status/1460323737035677698';
const X_3 = 'https://x.com/XDevelopers/status/1293593516040269825';
const TELEGRAM = 'https://t.me/telegram/83';
const SNAPCHAT = 'https://www.snapchat.com/add/teamsnapchat';
const LINKEDIN =
  'https://www.linkedin.com/feed/update/urn:li:ugcPost:7528828146767409153/';
const REDDIT = 'https://www.reddit.com/r/reddit/comments/11zso11/';
const PINTEREST = 'https://www.pinterest.com/pin/424605071145752542/';
const SPOTIFY = 'https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS';
const VIMEO = 'https://vimeo.com/76979871';
const TWITCH = 'https://www.twitch.tv/twitch';
const BLUESKY =
  'https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3mxu3hsnebc2v';
const SOUNDCLOUD = 'https://soundcloud.com/forss/flickermood';
const APPLE_MUSIC =
  'https://music.apple.com/us/album/birds-of-oaks-bottom-piano-solos/1357820591?i=1357820597';
const APPLE_PODCASTS =
  'https://podcasts.apple.com/us/podcast/monument-valley-meet-the-developer/id947965068';
const TUMBLR = 'https://staff.tumblr.com/post/828009069026721792';
const KICK = 'https://kick.com/kick';
const GIPHY =
  'https://giphy.com/gifs/originals-animation-kitten-logo-l41YlHs99JsSptZf2';

// X comes last, so its script loads only once you scroll down to it.
const EMBEDS = [
  YOUTUBE,
  TIKTOK,
  FACEBOOK_VIDEO,
  'https://youtu.be/jNQXAC9IVRw?t=11',
  THREADS,
  INSTAGRAM,
  FACEBOOK_POST,
  INSTAGRAM,
  TIKTOK,
  THREADS,
  FACEBOOK_VIDEO,
  INSTAGRAM,
  TELEGRAM,
  REDDIT,
  PINTEREST,
  SNAPCHAT,
  LINKEDIN,
  TELEGRAM,
  PINTEREST,
  REDDIT,
  SPOTIFY,
  VIMEO,
  TWITCH,
  BLUESKY,
  SOUNDCLOUD,
  APPLE_MUSIC,
  APPLE_PODCASTS,
  TUMBLR,
  KICK,
  GIPHY,
  X_1,
  X_2,
  X_3,
  YOUTUBE,
  FACEBOOK_POST,
  X_1,
  INSTAGRAM,
  X_2,
];

export default function ManyEmbeds() {
  return (
    <>
      <h1>Many embeds</h1>
      <p>
        {EMBEDS.length} embeds from post URLs, some repeated, all with the
        default <code>lazy</code> loading. An embed loads when it comes within
        200 px of the viewport, and each platform script loads once, with the
        first embed that needs it. The X posts are last, so the X script appears
        in the bar only after you scroll to them. An embed that fails shows its{' '}
        <code>onError</code> message below it.
      </p>
      {EMBEDS.map((url, index) => (
        <article key={index}>
          <h3>
            {index + 1}. <code>{url}</code>
          </h3>
          <ReportedEmbed url={url} />
        </article>
      ))}
    </>
  );
}
