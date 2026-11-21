import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FRAME_TIMEOUT_MS, MAX_REPORTED_HEIGHT } from '../core/timing';
import { frameStyle, srcWithSize, watchWidth } from '../core/layout';
import type { IframePlan, MessageHeight } from '../core/plan';
import { useNearViewport } from './hooks';
import type { FrameProps } from './shared';

export type { MessageHeight };

type IframeEmbedProps = FrameProps & {
  src: string;
  title: string;
  allow: string;
  allowFullscreen?: boolean;
  referrerPolicy?: Exclude<ReferrerPolicy, ''>;
  scrolling?: 'no';
  sandbox?: string;
  /** Used when the input carries no size. */
  ratio: { width: number; height: number };
  size?: { width?: number; height?: number };
  /** Height from the frame's messages instead of an aspect ratio. */
  messageHeight?: MessageHeight;
  /** With `messageHeight`: the height until the first message. */
  startHeight?: number;
  /** Query parameter that gets the page's host when the iframe is created (Twitch's `parent`). */
  hostParam?: string;
  borderRadius?: number;
  /** `src` gets the box's pixel size, rebuilt when the box's width changes (Flickr). */
  sizeInSrc?: boolean;
};

/** The plan's fields as `IframeEmbed` props. */
export function planProps(
  plan: IframePlan,
): Omit<IframePlan, 'kind' | 'fallbackHtml' | 'fallbackImage'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { kind, fallbackHtml, fallbackImage, ...props } = plan;
  return props;
}

/** The plan's verified fallback content as the placeholder, if it has any. */
export function fallbackPlaceholder(plan: IframePlan): ReactNode {
  const { fallbackHtml, fallbackImage } = plan;
  if (fallbackHtml === undefined) return undefined;
  // Verified by resolveEmbed: only what the parser's whitelist rebuilds.
  return fallbackImage ? (
    <div
      style={{ height: '100%' }}
      dangerouslySetInnerHTML={{ __html: fallbackHtml }}
    />
  ) : (
    <blockquote dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
  );
}

const FILL: CSSProperties = { position: 'absolute', inset: 0 };

// The iframe is created on the client only: one in the server HTML can load before
// hydration, and React then never sees its load event (docs/decisions.md D28).
export function IframeEmbed({
  src,
  title,
  allow,
  allowFullscreen = true,
  referrerPolicy,
  scrolling,
  sandbox,
  ratio,
  size,
  messageHeight,
  startHeight,
  hostParam,
  borderRadius,
  sizeInSrc,
  width,
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
  // With lazy off the timeout still waits for the frame to be near (docs/decisions.md D81, D91).
  const inView = useNearViewport(frame, !lazy);
  const [loaded, setLoaded] = useState(false);
  const [reportedHeight, setReportedHeight] = useState<number>();
  const [boxWidth, setBoxWidth] = useState<number>();
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
      setReportedHeight(Math.ceil(value));
      report();
    };
    window.addEventListener('message', listen);
    return () => {
      window.removeEventListener('message', listen);
    };
  }, [near, messageHeight, report]);

  useEffect(() => {
    const element = frame.current;
    if (!near || !sizeInSrc || !element) return;
    return watchWidth(element, setBoxWidth);
  }, [near, sizeInSrc]);

  useEffect(() => {
    if (!near || !inView) return;
    const failure = messageHeight
      ? 'did not report its height'
      : 'did not load';
    const timer = setTimeout(() => {
      if (reported.current) return;
      setLoaded(true);
      callbacks.current.onError?.(
        new Error(`social-embeds: ${title} ${failure}`),
      );
    }, FRAME_TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [near, inView, messageHeight, title]);

  const wrapper: CSSProperties = {
    ...frameStyle(
      {
        kind: 'iframe',
        src,
        title,
        allow,
        ratio,
        size,
        messageHeight,
        startHeight,
        borderRadius,
      },
      { width, maxWidth, height, maxHeight },
      reportedHeight,
    ),
    ...style,
  };
  const frameSrc = !sizeInSrc
    ? src
    : boxWidth === undefined
      ? undefined
      : srcWithSize({ src, ratio, size }, boxWidth);

  return (
    <div {...rest} style={wrapper}>
      <div ref={frame} style={FILL}>
        {near && frameSrc !== undefined && (
          <iframe
            ref={iframe}
            src={hostParam ? withHost(frameSrc, hostParam) : frameSrc}
            title={title}
            allow={allow}
            allowFullScreen={allowFullscreen}
            referrerPolicy={referrerPolicy}
            // eslint-disable-next-line @typescript-eslint/no-deprecated -- Facebook's own embed code sets it
            scrolling={scrolling}
            sandbox={sandbox}
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

// Runs only once the iframe is created, which is never on the server (docs/decisions.md D28).
function withHost(src: string, name: string): string {
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}${encodeURIComponent(name)}=${encodeURIComponent(window.location.hostname)}`;
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
