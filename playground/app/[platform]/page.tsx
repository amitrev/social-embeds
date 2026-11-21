import { notFound } from 'next/navigation';
import {
  AppleMusicEmbed,
  ApplePodcastsEmbed,
  BlueskyEmbed,
  DailymotionEmbed,
  FacebookEmbed,
  FlickrEmbed,
  GiphyEmbed,
  ImgurEmbed,
  InstagramEmbed,
  KickEmbed,
  LinkedInEmbed,
  PinterestEmbed,
  RedditEmbed,
  RumbleEmbed,
  SnapchatEmbed,
  SoundCloudEmbed,
  SpotifyEmbed,
  StravaEmbed,
  StreamableEmbed,
  TelegramEmbed,
  TenorEmbed,
  ThreadsEmbed,
  TikTokEmbed,
  TruthSocialEmbed,
  TumblrEmbed,
  TwitchEmbed,
  VimeoEmbed,
  XEmbed,
  YouTubeEmbed,
} from 'social-embeds';
import { type ParsedEmbed, parseEmbed } from 'social-embeds/parser';
import { ReportedEmbed } from '../../components/reported-embed';
import { TryEmbed } from '../../components/try-embed';
import {
  DAILYMOTION_DOCS_PLAYER,
  DAILYMOTION_VIDEO,
  embedCodes,
  facebookReel,
  PLATFORMS,
  type PlatformKey,
  URLS,
} from '../../samples';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PLATFORMS).map((platform) => ({ platform }));
}

function isPlatform(value: string): value is PlatformKey {
  return Object.hasOwn(PLATFORMS, value);
}

function ParsedOnServer({ embed }: { embed: ParsedEmbed }) {
  switch (embed.platform) {
    case 'x':
      return <XEmbed embed={embed} />;
    case 'instagram':
      return <InstagramEmbed embed={embed} />;
    case 'threads':
      return <ThreadsEmbed embed={embed} />;
    case 'facebook':
      return <FacebookEmbed embed={embed} />;
    case 'tiktok':
      return <TikTokEmbed embed={embed} />;
    case 'youtube':
      return <YouTubeEmbed embed={embed} />;
    case 'telegram':
      return <TelegramEmbed embed={embed} />;
    case 'snapchat':
      return <SnapchatEmbed embed={embed} />;
    case 'linkedin':
      return <LinkedInEmbed embed={embed} />;
    case 'reddit':
      return <RedditEmbed embed={embed} />;
    case 'pinterest':
      return <PinterestEmbed embed={embed} />;
    case 'spotify':
      return <SpotifyEmbed embed={embed} />;
    case 'vimeo':
      return <VimeoEmbed embed={embed} />;
    case 'twitch':
      return <TwitchEmbed embed={embed} />;
    case 'dailymotion':
      return <DailymotionEmbed embed={embed} />;
    case 'bluesky':
      return <BlueskyEmbed embed={embed} />;
    case 'soundcloud':
      return <SoundCloudEmbed embed={embed} />;
    case 'applemusic':
      return <AppleMusicEmbed embed={embed} />;
    case 'applepodcasts':
      return <ApplePodcastsEmbed embed={embed} />;
    case 'tumblr':
      return <TumblrEmbed embed={embed} />;
    case 'kick':
      return <KickEmbed embed={embed} />;
    case 'giphy':
      return <GiphyEmbed embed={embed} />;
    case 'truthsocial':
      return <TruthSocialEmbed embed={embed} />;
    case 'imgur':
      return <ImgurEmbed embed={embed} />;
    case 'tenor':
      return <TenorEmbed embed={embed} />;
    case 'streamable':
      return <StreamableEmbed embed={embed} />;
    case 'strava':
      return <StravaEmbed embed={embed} />;
    case 'flickr':
      return <FlickrEmbed embed={embed} />;
    case 'rumble':
      return <RumbleEmbed embed={embed} />;
  }
}

function DailymotionWithPlayerId() {
  return (
    <section>
      <h2>URL with a Player ID</h2>
      <p>
        <code>DailymotionEmbed</code> with{' '}
        <code>playerId=&quot;{DAILYMOTION_DOCS_PLAYER}&quot;</code>, the Player
        ID in Dailymotion’s docs. Its stream may be refused after a few plays,
        which shows as “Playback error” (docs/decisions.md D69). A site passes
        its own Player ID, from Dailymotion Studio. <code>SocialEmbed</code>{' '}
        takes none, so it renders Dailymotion only from embed code that carries
        one.
      </p>
      <DailymotionEmbed
        url={DAILYMOTION_VIDEO}
        playerId={DAILYMOTION_DOCS_PLAYER}
      />
    </section>
  );
}

function ReelWithoutText() {
  const embed = parseEmbed(facebookReel());
  if (!embed) return null;
  return (
    <section>
      <h2>Video without the post text</h2>
      <p>
        The reel embed code above, with <code>showText={'{false}'}</code> and{' '}
        <code>maxHeight={'{640}'}</code> on <code>FacebookEmbed</code>: the
        plain iframe in a box of the player’s aspect ratio, at most 640 px tall.
        No SDK.
      </p>
      <FacebookEmbed embed={embed} showText={false} maxHeight={640} />
    </section>
  );
}

export default async function PlatformPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform } = await params;
  if (!isPlatform(platform)) notFound();
  const codes = embedCodes(platform);
  const parsed = codes[0] ? parseEmbed(codes[0].value) : null;

  return (
    <>
      <h1>{PLATFORMS[platform]}</h1>

      <section>
        <h2>Embed code</h2>
        {codes.map((sample) => (
          <article key={sample.label}>
            <h3>{sample.label}</h3>
            <ReportedEmbed html={sample.value} />
            <details>
              <summary>Embed code and parseEmbed result</summary>
              <pre>{sample.value}</pre>
              <pre>{JSON.stringify(parseEmbed(sample.value), null, 2)}</pre>
            </details>
          </article>
        ))}
      </section>

      <section>
        <h2>Post URL</h2>
        {URLS[platform].map((sample) => (
          <article key={sample.value}>
            <h3>
              {sample.label}: <code>{sample.value}</code>
            </h3>
            <ReportedEmbed url={sample.value} />
          </article>
        ))}
      </section>

      {parsed && (
        <section>
          <h2>Parsed on the server</h2>
          <p>
            <code>parseEmbed</code> from <code>social-embeds/parser</code> ran
            in this Server Component on the first embed code above. Its result
            is passed to the platform component as <code>embed</code>.
          </p>
          <ParsedOnServer embed={parsed} />
        </section>
      )}

      {platform === 'facebook' && <ReelWithoutText />}
      {platform === 'dailymotion' && <DailymotionWithPlayerId />}

      <section>
        <h2>Your own embed code or URL</h2>
        <TryEmbed />
      </section>
    </>
  );
}
