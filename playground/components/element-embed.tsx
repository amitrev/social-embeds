'use client';

import {
  useEffect,
  useRef,
  useState,
  type DetailedHTMLProps,
  type HTMLAttributes,
} from 'react';
import type {} from 'social-embeds/element';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'social-embed': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & { url?: string; eager?: boolean },
        HTMLElement
      >;
    }
  }
}

interface Props {
  url?: string;
  code?: string;
}

/** A `<social-embed>` that shows the last `load` or `error` event it fired. */
export function ElementEmbed({ url, code }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [event, setEvent] = useState('waiting');

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onLoad = () => {
      setEvent('load');
    };
    const onError = (error: Event) => {
      setEvent(`error: ${(error as ErrorEvent).error?.message ?? 'unknown'}`);
    };
    element.addEventListener('load', onLoad);
    element.addEventListener('error', onError);
    void import('social-embeds/element');
    return () => {
      element.removeEventListener('load', onLoad);
      element.removeEventListener('error', onError);
    };
  }, []);

  return (
    <>
      <social-embed ref={ref} url={url}>
        {code && <template dangerouslySetInnerHTML={{ __html: code }} />}
      </social-embed>
      <p role="status">Last event: {event}</p>
    </>
  );
}
