import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type Driver, FinalError } from '../core/drivers';
import type { ScriptPlan } from '../core/plan';
import { postLinkText, postUrl } from '../core/post-link';
import {
  RENDER_ATTEMPTS,
  RENDER_TIMEOUT_MS,
  RETRY_DELAY_MS,
} from '../core/timing';
import { useNearViewport } from './hooks';
import { Skeleton } from './iframe-embed';
import type { FrameProps, SharedProps } from './shared';

type ScriptEmbedProps = SharedProps & {
  driver: Driver;
  /** Reaches `dangerouslySetInnerHTML`: built only from a verified embed and escaped values. */
  markup: string;
  /** Fallback content stands in for the placeholder (docs/decisions.md D34). */
  hasFallback: boolean;
  /** Height of the default skeleton, to limit layout shift. */
  minHeight: number;
  label: string;
};

const LAYER: CSSProperties = { width: '100%' };

/** A platform component's script embed: it sizes itself, so `height` and `maxHeight` are dropped. */
export function scriptOf(plan: ScriptPlan, props: FrameProps): ReactNode {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { maxWidth, height, maxHeight, ...rest } = props;
  return (
    <ScriptEmbed
      key={plan.key}
      {...rest}
      maxWidth={maxWidth ?? plan.maxWidth}
      driver={plan.driver}
      markup={plan.markup}
      hasFallback={plan.hasFallback}
      minHeight={plan.minHeight}
      label={plan.label}
    />
  );
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

// React never updates the container after the first render, so the platform script can
// replace its content: callers key this component by `markup` (docs/decisions.md D35).
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
  const [failure, setFailure] = useState<{ href: string | undefined }>();
  const done = useRef(false);
  const callbacks = useRef({ onLoad, onError });
  useEffect(() => {
    callbacks.current = { onLoad, onError };
  });

  useEffect(() => {
    const element = container.current;
    // <Activity> runs this again on show, with the rendered embed still in the container.
    if (!near || !element || done.current) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stop = () => {};
    const href = postUrl(element);

    // Any attempt's render signal counts, even one that arrives after a retry began.
    const finish = () => {
      if (cancelled || done.current) return;
      done.current = true;
      clearTimeout(timer);
      stop();
      setRendered(true);
      callbacks.current.onLoad?.();
    };
    const fail = (error: Error) => {
      setFailure({ href });
      callbacks.current.onError?.(error);
    };
    const retryOrFail = (number: number, error: Error) => {
      if (cancelled || done.current) return;
      stop();
      stop = () => {};
      if (number >= RENDER_ATTEMPTS || error instanceof FinalError) {
        fail(error);
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
      if (cancelled || done.current) return;
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
        if (!cancelled) fail(toError(error));
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
  // Script-based embeds size themselves: the wrapper only limits the width.
  return (
    <div {...rest} style={wrapper}>
      {/* Keeps the host's layout classes off the container, which the scripts measure (docs/decisions.md D90). */}
      <div style={LAYER}>
        <div
          ref={container}
          // The platform script rewrites this subtree after hydration.
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: markup }}
        />
        {!hasFallback &&
          !rendered &&
          (failure
            ? failure.href !== undefined && (
                <a href={failure.href}>{postLinkText(label)}</a>
              )
            : (placeholder ?? <Skeleton minHeight={minHeight} />))}
      </div>
    </div>
  );
}
