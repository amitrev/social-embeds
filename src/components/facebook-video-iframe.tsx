import type { ParsedEmbed } from '../parser';
import { IframeEmbed } from './iframe-embed';
import { type FrameProps, query } from './shared';

// The value in Facebook's own embed code.
const ALLOW =
  'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';

// Its content fills the iframe at any width, whatever `width` says (docs/decisions.md D29).
export function FacebookVideoIframe({
  embed,
  ...frame
}: Omit<FrameProps, 'onError'> & { embed: ParsedEmbed }) {
  // The verified URL is the only href; an `href` option must not replace it.
  const params = Object.entries(embed.options).filter(
    ([key]) => key !== 'href',
  );
  return (
    <IframeEmbed
      {...frame}
      src={`https://www.facebook.com/plugins/video.php${query([['href', embed.url]], params)}`}
      title="Facebook video player"
      allow={ALLOW}
      scrolling="no"
      ratio={{ width: 16, height: 9 }}
      size={embed.size}
    />
  );
}
