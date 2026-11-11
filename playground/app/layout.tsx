import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ScriptMonitor } from '../components/script-monitor';
import { PLATFORMS } from '../samples';
import './globals.css';

export const metadata: Metadata = {
  title: 'social-embeds playground',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">Home</Link>
          {Object.entries(PLATFORMS).map(([key, name]) => (
            <Link key={key} href={`/${key}`}>
              {name}
            </Link>
          ))}
          <Link href="/many">Many embeds</Link>
          <Link href="/eager">All at once</Link>
        </nav>
        <main>{children}</main>
        <ScriptMonitor />
      </body>
    </html>
  );
}
