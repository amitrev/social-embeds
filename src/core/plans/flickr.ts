import type { ParsedEmbed } from '../../parser';
import type { Plan, PlanError } from '../plan';

/** The display options of Flickr's embed code that the frame keeps (docs/decisions.md D98). */
export type FlickrOptions = {
  header?: boolean;
  footer?: boolean;
  /** The embed dialog's Slideshow setting. */
  context?: boolean;
};

const OPTIONS = ['header', 'footer', 'context'] as const;
const ALBUM = /\/albums\/\d+$/;
const IMAGE_STYLE = 'display:block;width:100%;height:100%;object-fit:cover';

/** Embed code keeps its image's ratio and is at most as wide as the image; a URL renders at 4:3 (docs/decisions.md D98). */
export function flickrPlan(
  embed: ParsedEmbed,
  options: FlickrOptions,
): Plan | PlanError {
  const album = ALBUM.test(embed.url);
  const kept = OPTIONS.filter(
    (name) => options[name] ?? embed.options[name] === true,
  );
  const { width, height } = embed.size ?? {};
  const size =
    width !== undefined && height !== undefined ? { width, height } : undefined;
  return {
    kind: 'iframe',
    src: `https://embedr.flickr.com/${album ? 'photosets' : 'photos'}/${embed.id}${
      kept.length > 0 ? `?${kept.map((name) => `${name}=true`).join('&')}` : ''
    }`,
    title: album ? 'Flickr album' : 'Flickr photo',
    allow: '',
    scrolling: 'no',
    ratio: { width: 4, height: 3 },
    ...(size ? { size, maxWidth: size.width } : {}),
    sizeInSrc: true,
    // Adds a fixed style to the verified markup, so the image fills the box until the frame loads.
    ...(embed.fallbackHtml === undefined
      ? {}
      : {
          fallbackHtml: embed.fallbackHtml.replace(
            /<img(?=[\s>])/g,
            `<img style="${IMAGE_STYLE}"`,
          ),
        }),
    fallbackImage: true,
  };
}
