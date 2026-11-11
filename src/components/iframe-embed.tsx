import { type CSSProperties, useRef, useState } from 'react';
import { useNearViewport } from './hooks';
import type { FrameProps } from './shared';

type IframeEmbedProps = Omit<FrameProps, 'onError'> & {
  src: string;
  title: string;
  allow: string;
  referrerPolicy?: 'strict-origin-when-cross-origin';
  scrolling?: 'no';
  /** Used when the input carries no size. */
  ratio: { width: number; height: number };
  size?: { width?: number; height?: number };
};

const FILL: CSSProperties = { position: 'absolute', inset: 0 };

// The iframe is created on the client only: one in the server HTML can load before
// hydration, and React then never sees its load event (docs/decisions.md D28).
export function IframeEmbed({
  src,
  title,
  allow,
  referrerPolicy,
  scrolling,
  ratio,
  size,
  width = '100%',
  maxWidth,
  height,
  maxHeight,
  placeholder,
  lazy = true,
  onLoad,
  style,
  ...rest
}: IframeEmbedProps) {
  const frame = useRef<HTMLDivElement>(null);
  const near = useNearViewport(frame, lazy);
  const [loaded, setLoaded] = useState(false);
  const reported = useRef(false);

  const aspectWidth = size?.width ?? ratio.width;
  const aspectHeight = size?.height ?? ratio.height;
  // With an aspect ratio, a height limit is a width limit: the widest box that fits it.
  const widest =
    maxHeight === undefined || height !== undefined
      ? undefined
      : Math.floor((maxHeight * aspectWidth) / aspectHeight);
  const wrapper: CSSProperties = {
    position: 'relative',
    width,
    maxWidth:
      widest === undefined || (maxWidth !== undefined && maxWidth < widest)
        ? maxWidth
        : widest,
    ...(height === undefined
      ? { aspectRatio: `${String(aspectWidth)} / ${String(aspectHeight)}` }
      : { height, maxHeight }),
    ...style,
  };

  return (
    <div {...rest} style={wrapper}>
      <div ref={frame} style={FILL}>
        {near && (
          <iframe
            src={src}
            title={title}
            allow={allow}
            allowFullScreen
            referrerPolicy={referrerPolicy}
            // eslint-disable-next-line @typescript-eslint/no-deprecated -- Facebook's own embed code sets it
            scrolling={scrolling}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              border: 0,
            }}
            onLoad={() => {
              setLoaded(true);
              if (reported.current) return;
              reported.current = true;
              onLoad?.();
            }}
          />
        )}
        {!loaded && <div style={FILL}>{placeholder ?? <Skeleton />}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ minHeight }: { minHeight?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        minHeight,
        background: 'rgba(128, 128, 128, 0.12)', // visible on light and dark pages
      }}
    />
  );
}
