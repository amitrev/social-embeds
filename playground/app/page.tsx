import Link from 'next/link';
import { PLATFORMS } from '../samples';

export default function Home() {
  return (
    <>
      <h1>social-embeds playground</h1>
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
      </ul>
      <p>
        The bar at the bottom counts the platform scripts on the page. It stays
        mounted during client navigation, so each count must stay at 0 or 1 as
        you move between pages.
      </p>
    </>
  );
}
