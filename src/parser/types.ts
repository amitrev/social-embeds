export type Platform =
  'x' | 'instagram' | 'facebook' | 'threads' | 'tiktok' | 'youtube';

export type ParsedEmbed = {
  platform: Platform;
  kind: 'post' | 'video'; // only Facebook has both; others are fixed
  url: string; // canonical post URL
  id: string; // platform post/video id
  variant: 'sdk' | 'iframe'; // which rendering path applies
  options: Record<string, string | number | boolean>; // platform options extracted from the input
  size?: { width?: number; height?: number }; // from iframe/data attributes when present
  fallbackHtml?: string; // whitelisted blockquote inner content for SSR; only from html input
};
