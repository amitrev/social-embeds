import { ReportedEmbed } from '../../components/reported-embed';

const YOUTUBE = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
const TIKTOK = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
const FACEBOOK_VIDEO =
  'https://www.facebook.com/facebook/videos/10153231379946729/';
const FACEBOOK_POST =
  'https://www.facebook.com/vasil.popov.98/posts/pfbid0r3hJSv19StgY9tsUXoENzXsNzNaPtjm27KZSyJFxk1p16pZxmY5LVdM2jAgZmPnel';
const THREADS = 'https://www.threads.com/@instagram/post/DfQSavwEs5C';
const INSTAGRAM = 'https://www.instagram.com/p/DfPQchkG1tg/';
const X_1 = 'https://x.com/jack/status/20';
const X_2 = 'https://x.com/BarackObama/status/266031293945503744';
const X_3 = 'https://x.com/TheEllenShow/status/440322224407314432';
const TELEGRAM = 'https://t.me/telegram/83';
const SNAPCHAT = 'https://www.snapchat.com/add/teamsnapchat';
const LINKEDIN =
  'https://www.linkedin.com/feed/update/urn:li:activity:7527261038006697984/';
const REDDIT = 'https://www.reddit.com/r/bulgaria/comments/1xz8iq4/';
const PINTEREST = 'https://www.pinterest.com/pin/99360735500167749/';
const SPOTIFY = 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC';
const VIMEO = 'https://vimeo.com/76979871';
const TWITCH = 'https://www.twitch.tv/twitch';
const BLUESKY =
  'https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3n2mkgfb4tk2d';
const SOUNDCLOUD = 'https://soundcloud.com/forss/flickermood';
const APPLE_MUSIC =
  'https://music.apple.com/us/album/better-together/1440857781?i=1440857786';
const APPLE_PODCASTS =
  'https://podcasts.apple.com/us/podcast/the-daily/id1200361736';
const TUMBLR = 'https://staff.tumblr.com/post/832577330595643392';
const KICK = 'https://kick.com/xqc';
const GIPHY = 'https://giphy.com/gifs/cat-funny-JIX9t2j0ZTN9S';

// X comes last, so its script loads only once you scroll down to it.
const EMBEDS = [
  YOUTUBE,
  TIKTOK,
  FACEBOOK_VIDEO,
  'https://youtu.be/jNQXAC9IVRw?t=90',
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
