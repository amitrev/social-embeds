import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNearViewport } from './hooks';
import type { FrameProps } from './shared';

/** A frame that posts its own height (docs/decisions.md D55). */
export type MessageHeight = {
  /** The frame's origin; messages from any other origin are ignored. */
  origin: string;
  /** The height in a message's `data`, or `undefined` for any other message. May throw. */
  read: (data: unknown) => number | undefined;
};

type IframeEmbedProps = FrameProps & {
  src: string;
  title: string;
  allow: string;
  referrerPolicy?: 'strict-origin-when-cross-origin';
  scrolling?: 'no';
  /** Used when the input carries no size. */
  ratio: { width: number; height: number };
  size?: { width?: number; height?: number };
  /** Height from the frame's messages instead of an aspect ratio. */
  messageHeight?: MessageHeight;
  /** With `messageHeight`: the height until the first message. */
  startHeight?: number;
};

const FILL: CSSProperties = { position: 'absolute', inset: 0 };
const HEIGHT_TIMEOUT_MS = 15_000;
const MAX_REPORTED_HEIGHT = 50_000; // px

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
  messageHeight,
  startHeight,
  width = '100%',
  maxWidth,
  height,
  maxHeight,
  placeholder,
  lazy = true,
  onLoad,
  onError,
  style,
  ...rest
}: IframeEmbedProps) {
  const frame = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const near = useNearViewport(frame, lazy);
  const [loaded, setLoaded] = useState(false);
  const [reportedHeight, setReportedHeight] = useState<number>();
  const reported = useRef(false);
  const callbacks = useRef({ onLoad, onError });
  useEffect(() => {
    callbacks.current = { onLoad, onError };
  });

  const report = useCallback(() => {
    setLoaded(true);
    if (reported.current) return;
    reported.current = true;
    callbacks.current.onLoad?.();
  }, []);

  useEffect(() => {
    if (!near || !messageHeight) return;
    const { origin, read } = messageHeight;
    let heard = false;
    const listen = (event: MessageEvent) => {
      // Security: only the frame itself, from the platform's own origin.
      if (event.origin !== origin) return;
      if (!iframe.current || event.source !== iframe.current.contentWindow)
        return;
      let value: number | undefined;
      try {
        value = read(event.data);
      } catch {
        return;
      }
      if (
        typeof value !== 'number' ||
        !(value > 0 && value <= MAX_REPORTED_HEIGHT)
      )
        return;
      heard = true;
      setReportedHeight(Math.ceil(value));
      report();
    };
    window.addEventListener('message', listen);
    const timer = setTimeout(() => {
      if (heard) return;
      setLoaded(true);
      callbacks.current.onError?.(
        new Error(`social-embeds: ${title} did not report its height`),
      );
    }, HEIGHT_TIMEOUT_MS);
    return () => {
      window.removeEventListener('message', listen);
      clearTimeout(timer);
    };
  }, [near, messageHeight, title, report]);

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
    ...(messageHeight
      ? { height: reportedHeight ?? startHeight }
      : height === undefined
        ? { aspectRatio: `${String(aspectWidth)} / ${String(aspectHeight)}` }
        : { height, maxHeight }),
    ...style,
  };

  return (
    <div {...rest} style={wrapper}>
      <div ref={frame} style={FILL}>
        {near && (
          <iframe
            ref={iframe}
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
              // A frame sized by messages has rendered only once it reports a height.
              if (!messageHeight) report();
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
