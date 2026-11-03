import { notFound } from 'next/navigation';
import {
  FacebookEmbed,
  InstagramEmbed,
  SocialEmbed,
  ThreadsEmbed,
  TikTokEmbed,
  XEmbed,
  YouTubeEmbed,
} from 'social-embeds';
import { type ParsedEmbed, parseEmbed } from 'social-embeds/parser';
import { TryEmbed } from '../../components/try-embed';
import { embedCodes, PLATFORMS, type PlatformKey, URLS } from '../../samples';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PLATFORMS).map((platform) => ({ platform }));
}

function isPlatform(value: string): value is PlatformKey {
  return Object.hasOwn(PLATFORMS, value);
}

/** The platform component for an embed parsed on the server, as a CMS would store it. */
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
  }
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
            <SocialEmbed html={sample.value} />
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
            <SocialEmbed url={sample.value} />
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

      <section>
        <h2>Your own embed code or URL</h2>
        <TryEmbed />
      </section>
    </>
  );
}
