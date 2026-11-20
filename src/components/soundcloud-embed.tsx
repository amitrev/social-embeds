import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import {
  type EmbedSource,
  type FrameProps,
  optionsWithout,
  query,
  resolveEmbed,
} from './shared';

/** SoundCloud's player parameters, in camelCase. */
export type SoundCloudOptions = {
  /** The large-artwork player; `false` for the classic one. */
  visual?: boolean;
  /** Accent colour, such as `'#ff5500'`. */
  color?: string;
  autoPlay?: boolean;
  hideRelated?: boolean;
  showComments?: boolean;
  showUser?: boolean;
  showReposts?: boolean;
  showTeaser?: boolean;
  showArtwork?: boolean;
};

export type SoundCloudEmbedProps = EmbedSource &
  Omit<FrameProps, keyof SoundCloudOptions> &
  SoundCloudOptions;

const PARAMS: Record<keyof SoundCloudOptions, string> = {
  visual: 'visual',
  color: 'color',
  autoPlay: 'auto_play',
  hideRelated: 'hide_related',
  showComments: 'show_comments',
  showUser: 'show_user',
  showReposts: 'show_reposts',
  showTeaser: 'show_teaser',
  showArtwork: 'show_artwork',
};

// The value in SoundCloud's own embed code.
const ALLOW = 'autoplay; encrypted-media';
// A URL gets the visual player at oEmbed's height (docs/decisions.md D71).
const URL_HEIGHT = 400;

/** A fixed height: the `height` prop, else the embed code's, else 400px for the visual player. */
export function SoundCloudEmbed(props: SoundCloudEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    height,
    visual,
    color,
    autoPlay,
    hideRelated,
    showComments,
    showUser,
    showReposts,
    showTeaser,
    showArtwork,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'soundcloud');
  useReportError(error, onError);
  if (!embed) return null;

  const values = {
    visual,
    color,
    autoPlay,
    hideRelated,
    showComments,
    showUser,
    showReposts,
    showTeaser,
    showArtwork,
  };
  const fromProps: [string, string | boolean][] = [];
  for (const [prop, name] of Object.entries(PARAMS)) {
    const value = values[prop as keyof SoundCloudOptions];
    if (value !== undefined) fromProps.push([name, value]);
  }
  const fromUrl = embed.size === undefined;

  return (
    <IframeEmbed
      {...frame}
      onError={onError}
      height={height ?? embed.size?.height ?? URL_HEIGHT}
      src={`https://w.soundcloud.com/player/${query(
        [['url', embed.url]],
        fromUrl ? [['visual', true]] : undefined,
        optionsWithout(embed.options, ['url', 'secret_token']),
        fromProps,
      )}`}
      title="SoundCloud player"
      allow={ALLOW}
      scrolling="no"
      ratio={{ width: 16, height: 9 }}
    />
  );
}
