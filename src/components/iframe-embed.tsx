import { type CSSProperties, useRef, useState } from 'react';
import { useNearViewport } from './hooks';
import type { FrameProps } from './shared';

type IframeEmbedProps = Omit<FrameProps, 'onError'> & {
  src: string;
  title: string;
  allow: string;
  referrerPolicy?: 'strict-origin-when-cross-origin';
  scrolling?: 'no';
  /** Aspect ratio when the input carries no size (brief §6.1). */
  ratio: { width: number; height: number };
  size?: { width?: number; height?: number };
};

const FILL: CSSProperties = { position: 'absolute', inset: 0 };

/**
 * Group B: a responsive wrapper whose aspect ratio comes from the input, with the
 * iframe filling it. The iframe is created on the client only, so its load event is
 * never missed before hydration; the placeholder covers the box until then.
 */
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
            // Deprecated in HTML, but Facebook's own embed code sets it; browsers honour it.
            // eslint-disable-next-line @typescript-eslint/no-deprecated
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

/** The default placeholder: a neutral box, readable on light and dark pages. */
export function Skeleton({ minHeight }: { minHeight?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        minHeight,
        background: 'rgba(128, 128, 128, 0.12)',
      }}
    />
  );
}
