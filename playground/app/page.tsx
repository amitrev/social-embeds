import Link from 'next/link';
import { PLATFORMS } from '../samples';

export default function Home() {
  return (
    <>
      <h1>social-embeds playground</h1>
      <p>
        On GitHub Pages, this is the live demo of the released{' '}
        <a href="https://www.npmjs.com/package/social-embeds">social-embeds</a>{' '}
        package: every supported platform from embed code and post URLs, and a
        box for your own. Source and docs are on{' '}
        <a href="https://github.com/amitrev/social-embeds">GitHub</a>.
      </p>
      <p>
        Every page is a Server Component that renders the package’s built
        output, so each embed crosses the RSC/client boundary through the{' '}
        <code>&apos;use client&apos;</code> directive in{' '}
        <code>dist/index.js</code>. Run <code>pnpm build</code> in the
        repository root after changing the package.
      </p>
      <ul>
        {Object.entries(PLATFORMS).map(([key, name]) => (
          <li key={key}>
            <Link href={`/${key}`}>{name}</Link>: embed code, post URLs, a post
            parsed on the server, and a box for your own input.
          </li>
        ))}
        <li>
          <Link href="/many">Many embeds</Link>: lazy loading and one script per
          platform.
        </li>
        <li>
          <Link href="/element">Web component</Link>: every post URL and two
          embed codes as <code>&lt;social-embed&gt;</code>, with its{' '}
          <code>load</code> and <code>error</code> events.
        </li>
      </ul>
      <p>
        The bar at the bottom counts the platform scripts on the page. It stays
        mounted during client navigation, so each count must stay at 0 or 1 as
        you move between pages.
      </p>
    </>
  );
}
