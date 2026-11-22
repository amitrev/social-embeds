import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FRAME_TIMEOUT_MS } from '../core/timing';
import { frameStyle } from '../core/layout';
import type { IframePlan, MessageHeight, SizeInSrc } from '../core/plan';
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
  /** Rewrites `src` when the iframe is created (Twitch's `parent`). */
  clientSrc?: (src: string) => string;
  borderRadius?: number;
  /** `src` gets the box's pixel size, rebuilt when the box's width changes (Flickr). */
  sizeInSrc?: SizeInSrc;
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

export function IframeEmbed(props: IframeEmbedProps) {
  // A new post starts over in a new frame: placeholder, height, onLoad and timeout.
  return <Frame key={props.src} {...props} />;
}

// The iframe is created on the client only: one in the server HTML can load before
// hydration, and React then never sees its load event (docs/decisions.md D28).
function Frame({
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
  clientSrc,
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
    return messageHeight.listen(
      () => iframe.current,
      (value) => {
        setReportedHeight(value);
        report();
      },
    );
  }, [near, messageHeight, report]);

  // The plan, and so `sizeInSrc`, is rebuilt on every render: watch once per frame.
  const sizing = useRef(sizeInSrc);
  useEffect(() => {
    sizing.current = sizeInSrc;
  });
  const sized = sizeInSrc !== undefined;
  useEffect(() => {
    const element = frame.current;
    if (!near || !sized || !element) return;
    return sizing.current?.watch(element, setBoxWidth);
  }, [near, sized]);

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
      : sizeInSrc.src(boxWidth);

  return (
    <div {...rest} style={wrapper}>
      <div ref={frame} style={FILL}>
        {near && frameSrc !== undefined && (
          <iframe
            // A new src on a loaded frame would add a history entry; a new frame adds none.
            key={sizeInSrc ? frameSrc : undefined}
            ref={iframe}
            src={clientSrc ? clientSrc(frameSrc) : frameSrc}
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
