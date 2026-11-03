import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { Driver } from './drivers';
import { useNearViewport } from './hooks';
import { Skeleton } from './iframe-embed';
import type { SharedProps } from './shared';

// Fixed policy (brief §6.2): three attempts to render, 15 s each, 1 s and 2 s apart.
const ATTEMPTS = 3;
const RENDER_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 1000;

type ScriptEmbedProps = SharedProps & {
  driver: Driver;
  /** The platform's embed element, with fallback content when the input had some. */
  markup: string;
  /** Html input with fallback content shows that instead of a placeholder (§4.3, §6.3). */
  hasFallback: boolean;
  /** Height of the default skeleton, to limit layout shift. */
  minHeight: number;
  label: string;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Group A: the platform markup is written once into a container React never updates
 * again, so the platform script can replace it in place (brief §6.3). Callers key this
 * component by `markup`, so different markup gets a fresh container.
 */
export function ScriptEmbed({
  driver,
  markup,
  hasFallback,
  minHeight,
  label,
  width = '100%',
  maxWidth,
  placeholder,
  lazy = true,
  onLoad,
  onError,
  style,
  ...rest
}: ScriptEmbedProps) {
  const container = useRef<HTMLDivElement>(null);
  const near = useNearViewport(container, lazy);
  const [rendered, setRendered] = useState(false);
  const callbacks = useRef({ onLoad, onError });
  useEffect(() => {
    callbacks.current = { onLoad, onError };
  });

  useEffect(() => {
    const element = container.current;
    if (!near || !element) return;
    let cancelled = false;
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stop = () => {};

    // Any attempt's render signal counts, even one that arrives after a retry began.
    const finish = () => {
      if (cancelled || done) return;
      done = true;
      clearTimeout(timer);
      stop();
      setRendered(true);
      callbacks.current.onLoad?.();
    };
    const retryOrFail = (number: number, error: Error) => {
      if (cancelled || done) return;
      stop();
      stop = () => {};
      if (number >= ATTEMPTS) {
        callbacks.current.onError?.(error);
        return;
      }
      timer = setTimeout(
        () => {
          attempt(number + 1);
        },
        RETRY_DELAY_MS * 2 ** (number - 1),
      );
    };
    const attempt = (number: number) => {
      if (cancelled || done) return;
      try {
        stop = driver.render(element, finish);
      } catch (error) {
        retryOrFail(number, toError(error));
        return;
      }
      // finish() may already have run inside render(); retryOrFail() then does nothing.
      timer = setTimeout(() => {
        retryOrFail(
          number,
          new Error(`social-embeds: the ${label} embed did not render`),
        );
      }, RENDER_TIMEOUT_MS);
    };

    driver.load().then(
      () => {
        attempt(1);
      },
      (error: unknown) => {
        if (!cancelled) callbacks.current.onError?.(toError(error));
      },
    );
    // Platforms offer no API to tear an embed down; removing the container is the cleanup.
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stop();
    };
  }, [near, driver, label]);

  const wrapper: CSSProperties = { width, maxWidth, ...style };
  // Group A embeds size themselves (brief §6.1): the wrapper only sets width limits.
  return (
    <div {...rest} style={wrapper}>
      <div
        ref={container}
        // The platform script rewrites this subtree after hydration.
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      {!hasFallback &&
        !rendered &&
        (placeholder ?? <Skeleton minHeight={minHeight} />)}
    </div>
  );
}
