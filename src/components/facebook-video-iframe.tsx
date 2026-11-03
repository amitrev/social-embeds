import type { ParsedEmbed } from '../parser';
import { IframeEmbed } from './iframe-embed';
import { type FrameProps, query } from './shared';

// The embed dialog's own iframe attributes (test/fixtures/facebook/post-iframe.html).
const ALLOW =
  'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';

/**
 * Facebook video from embed code: the iframe that came in (brief §5.4), rebuilt from the
 * parsed href and parameters. Its content fills the iframe at any width, whatever its
 * `width` parameter says (docs/decisions.md D29). `FacebookEmbed` routes here.
 */
export function FacebookVideoIframe({
  embed,
  ...frame
}: Omit<FrameProps, 'onError'> & { embed: ParsedEmbed }) {
  return (
    <IframeEmbed
      {...frame}
      src={`https://www.facebook.com/plugins/video.php${query([['href', embed.url]], Object.entries(embed.options))}`}
      title="Facebook video player"
      allow={ALLOW}
      scrolling="no"
      ratio={{ width: 16, height: 9 }}
      size={embed.size}
    />
  );
}
