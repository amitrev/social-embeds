import { SocialEmbed } from 'social-embeds';

// Facebook first: its SDK is what Instagram's and Threads' scripts must not run beside
// unmarked (docs/decisions.md D38 and D46).
const EMBEDS = [
  'https://www.facebook.com/facebook/videos/10153231379946729/',
  'https://www.instagram.com/p/Df75lxnmIrF/',
  'https://www.threads.com/@threads/post/Df7kSgBJVNz',
  'https://x.com/jack/status/20',
  'https://www.pinterest.com/pin/424605071145752542/',
];

export default function EagerEmbeds() {
  return (
    <>
      <h1>All at once</h1>
      <p>
        One embed per script-based platform, all with <code>lazy</code> off, so
        the five platform scripts are added in the same moment. Open this page
        from a link in the navigation as well as directly: the order in which
        the scripts arrive differs.
      </p>
      {EMBEDS.map((url) => (
        <article key={url}>
          <h3>
            <code>{url}</code>
          </h3>
          <SocialEmbed url={url} lazy={false} />
        </article>
      ))}
    </>
  );
}
