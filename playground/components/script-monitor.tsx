'use client';

import { useEffect, useState } from 'react';

/**
 * The loader script of each platform. The Facebook SDK loads its main file as a second
 * `sdk.js?hash=…` script, so only the loader URL is counted.
 */
const SCRIPTS = [
  ['X', /^https:\/\/platform\.(?:twitter|x)\.com\/widgets\.js(?:[?#]|$)/],
  ['Instagram', /^https:\/\/www\.instagram\.com\/embed\.js(?:[?#]|$)/],
  ['Threads', /^https:\/\/www\.threads\.(?:com|net)\/embed\.js(?:[?#]|$)/],
  ['Facebook', /^https:\/\/connect\.facebook\.net\/[^/]+\/sdk\.js(?:#|$)/],
  ['TikTok', /^https:\/\/www\.tiktok\.com\/embed\.js(?:[?#]|$)/],
] as const;

function countScripts(): string {
  const sources = Array.from(document.scripts, (script) => script.src);
  return SCRIPTS.map(
    ([name, pattern]) =>
      `${name} ${String(sources.filter((src) => pattern.test(src)).length)}`,
  ).join(' · ');
}

/** Counts platform scripts on the page; it lives in the layout, so it survives navigation. */
export function ScriptMonitor() {
  const [counts, setCounts] = useState('');

  useEffect(() => {
    const update = () => {
      setCounts(countScripts());
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="monitor" data-testid="script-monitor">
      Platform scripts on this page: {counts}
    </div>
  );
}
