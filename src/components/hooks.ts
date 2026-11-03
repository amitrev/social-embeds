import { type RefObject, useEffect, useRef, useState } from 'react';

// Starts loading a little before the embed scrolls into view, so it is not seen blank.
const ROOT_MARGIN = '200px 0px';

/**
 * Whether the element has come near the viewport. Always false on the server and in the
 * first client render, so server and client markup match; true right after mount when
 * `lazy` is off or IntersectionObserver is unavailable.
 */
export function useNearViewport(
  ref: RefObject<Element | null>,
  lazy: boolean,
): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!lazy || !element || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref, lazy]);
  return near;
}

/** Calls `onError` from an effect, once per distinct message. */
export function useReportError(
  message: string | undefined,
  onError: ((error: Error) => void) | undefined,
): void {
  const latest = useRef(onError);
  useEffect(() => {
    latest.current = onError;
  });
  useEffect(() => {
    if (message !== undefined) latest.current?.(new Error(message));
  }, [message]);
}
