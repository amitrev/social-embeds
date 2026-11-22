// Every script plan writes the verified post URL to one of these attributes.
const URL_ATTRIBUTES = [
  'href',
  'data-href',
  'data-instgrm-permalink',
  'data-text-post-permalink',
];

/** Read it before the platform script runs, which replaces the markup. */
export function postUrl(container: Element): string | undefined {
  const element = container.querySelector(
    URL_ATTRIBUTES.map((name) => `[${name}]`).join(),
  );
  for (const name of URL_ATTRIBUTES) {
    const value = element?.getAttribute(name);
    if (value) return value;
  }
  return undefined;
}

export function postLinkText(label: string): string {
  return `View this post on ${label}`;
}
