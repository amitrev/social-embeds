import { SocialEmbed } from 'social-embeds';

const YOUTUBE = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
const TIKTOK = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
const FACEBOOK_VIDEO =
  'https://www.facebook.com/facebook/videos/10153231379946729/';
// Removed since; Facebook renders its "no longer available" notice in its place.
const FACEBOOK_POST =
  'https://www.facebook.com/20531316728/posts/10154009990506729/';
const THREADS = 'https://www.threads.com/@instagram/post/DfQSavwEs5C';
const INSTAGRAM = 'https://www.instagram.com/p/DfPQchkG1tg/';
const X_1 = 'https://x.com/jack/status/20';
const X_2 = 'https://x.com/BarackObama/status/266031293945503744';
const X_3 = 'https://x.com/TheEllenShow/status/440322224407314432';

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
        in the bar only after you scroll to them.
      </p>
      {EMBEDS.map((url, index) => (
        <article key={index}>
          <h3>
            {index + 1}. <code>{url}</code>
          </h3>
          <SocialEmbed url={url} />
        </article>
      ))}
    </>
  );
}
