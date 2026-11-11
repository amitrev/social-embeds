export type Platform =
  'x' | 'instagram' | 'facebook' | 'threads' | 'tiktok' | 'youtube';

export type ParsedEmbed = {
  platform: Platform;
  kind: 'post' | 'video'; // only Facebook has both; others are fixed
  url: string; // canonical post URL
  id: string;
  variant: 'sdk' | 'iframe';
  options: Record<string, string | number | boolean>;
  size?: { width?: number; height?: number };
  fallbackHtml?: string; // whitelisted blockquote inner content for SSR; only from html input
};
