import { ROOT_MARGIN } from '../core/timing';

/** Calls `callback` once the element is within ROOT_MARGIN, or at once when eager or without IntersectionObserver. */
export function whenNear(
  element: Element,
  eager: boolean,
  callback: () => void,
): () => void {
  if (eager || typeof IntersectionObserver === 'undefined') {
    callback();
    return () => {};
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        callback();
      }
    },
    { rootMargin: ROOT_MARGIN },
  );
  observer.observe(element);
  return () => {
    observer.disconnect();
  };
}
