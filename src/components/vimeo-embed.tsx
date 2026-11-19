import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import {
  type EmbedSource,
  type FrameProps,
  optionsWithout,
  playerParams,
  query,
  resolveEmbed,
} from './shared';

/** The player parameters Vimeo documents (help.vimeo.com, "Using player parameters"). */
export type VimeoOptions = {
  autopause?: boolean;
  autoplay?: boolean;
  background?: boolean;
  byline?: boolean;
  /** Hex colour without `#`. */
  color?: string;
  controls?: boolean;
  dnt?: boolean;
  keyboard?: boolean;
  loop?: boolean;
  muted?: boolean;
  pip?: boolean;
  playsinline?: boolean;
  portrait?: boolean;
  quality?: string;
  speed?: boolean;
  title?: boolean;
  transparent?: boolean;
  /** Start time: seconds, or `1m2s`. */
  t?: number | string;
};

const PARAMS: Record<Exclude<keyof VimeoOptions, 't'>, string> = {
  autopause: 'autopause',
  autoplay: 'autoplay',
  background: 'background',
  byline: 'byline',
  color: 'color',
  controls: 'controls',
  dnt: 'dnt',
  keyboard: 'keyboard',
  loop: 'loop',
  muted: 'muted',
  pip: 'pip',
  playsinline: 'playsinline',
  portrait: 'portrait',
  quality: 'quality',
  speed: 'speed',
  title: 'title',
  transparent: 'transparent',
};

export type VimeoEmbedProps = EmbedSource &
  Omit<FrameProps, keyof VimeoOptions> &
  VimeoOptions;

// The value in Vimeo's own embed code.
const ALLOW =
  'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share';

export function VimeoEmbed(props: VimeoEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    autopause,
    autoplay,
    background,
    byline,
    color,
    controls,
    dnt,
    keyboard,
    loop,
    muted,
    pip,
    playsinline,
    portrait,
    quality,
    speed,
    title,
    transparent,
    t,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'vimeo');
  useReportError(error, onError);
  if (!embed) return null;

  const { t: parsedStart, ...parsed } = embed.options;
  // An unlisted video's hash is the URL's second segment (docs/decisions.md D64).
  const hash = new URL(embed.url).pathname.split('/')[2];
  const params = playerParams(
    {
      autopause,
      autoplay,
      background,
      byline,
      color,
      controls,
      dnt,
      keyboard,
      loop,
      muted,
      pip,
      playsinline,
      portrait,
      quality,
      speed,
      title,
      transparent,
    },
    PARAMS,
  );
  const start = t ?? parsedStart;

  return (
    <IframeEmbed
      {...frame}
      src={`https://player.vimeo.com/video/${embed.id}${query(
        hash ? [['h', hash]] : undefined,
        optionsWithout(parsed, ['h']),
        params,
      )}${start === undefined ? '' : `#t=${encodeURIComponent(String(start))}`}`}
      title="Vimeo video player"
      allow={ALLOW}
      referrerPolicy="strict-origin-when-cross-origin"
      ratio={{ width: 16, height: 9 }}
      size={embed.size}
    />
  );
}
