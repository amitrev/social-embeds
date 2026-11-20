import { frameStyle } from '../core/layout';
import type { IframePlan } from '../core/plan';
import { HEIGHT_TIMEOUT_MS, MAX_REPORTED_HEIGHT } from '../core/timing';
import { applyStyle, type MountOptions, skeleton } from './dom';
import { whenNear } from './near';

function withHost(src: string, name: string): string {
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}${encodeURIComponent(name)}=${encodeURIComponent(window.location.hostname)}`;
}

function fill(element: HTMLElement): HTMLElement {
  element.style.position = 'absolute';
  element.style.setProperty('inset', '0');
  return element;
}

/** Renders into `host` and returns the cleanup. */
export function mountIframe(
  host: HTMLElement,
  plan: IframePlan,
  options: MountOptions,
): () => void {
  const { eager, placeholder, onLoad, onError, ...layout } = options;
  const { messageHeight } = plan;
  const wrapper = document.createElement('div');
  applyStyle(wrapper, frameStyle(plan, layout));
  const frame = fill(document.createElement('div'));
  const layer = fill(document.createElement('div'));
  const content: readonly Node[] =
    placeholder.length > 0
      ? placeholder
      : [
          plan.fallbackHtml === undefined
            ? skeleton()
            : fallback(plan.fallbackHtml),
        ];
  layer.append(...content);
  frame.append(layer);
  wrapper.append(frame);
  host.append(wrapper);

  let iframe: HTMLIFrameElement | undefined;
  let heard = false;
  let reported = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancels: (() => void)[] = [];

  const report = () => {
    layer.remove();
    if (reported) return;
    reported = true;
    onLoad();
  };

  const listen = (event: MessageEvent) => {
    if (!messageHeight || event.origin !== messageHeight.origin) return;
    if (!iframe || event.source !== iframe.contentWindow) return;
    let value: number | undefined;
    try {
      value = messageHeight.read(event.data);
    } catch {
      return;
    }
    if (
      typeof value !== 'number' ||
      !(value > 0 && value <= MAX_REPORTED_HEIGHT)
    )
      return;
    heard = true;
    applyStyle(wrapper, { height: Math.ceil(value) });
    report();
  };

  const startTimer = () => {
    timer = setTimeout(() => {
      if (heard) return;
      layer.remove();
      onError(
        new Error(`social-embeds: ${plan.title} did not report its height`),
      );
    }, HEIGHT_TIMEOUT_MS);
  };

  const create = () => {
    const element = document.createElement('iframe');
    element.src = plan.hostParam
      ? withHost(plan.src, plan.hostParam)
      : plan.src;
    element.title = plan.title;
    element.setAttribute('allow', plan.allow);
    element.setAttribute('allowfullscreen', '');
    if (plan.referrerPolicy) element.referrerPolicy = plan.referrerPolicy;
    if (plan.scrolling) element.setAttribute('scrolling', plan.scrolling);
    if (plan.sandbox !== undefined)
      element.setAttribute('sandbox', plan.sandbox);
    applyStyle(element, {
      display: 'block',
      width: '100%',
      height: '100%',
      border: 0,
    });
    element.addEventListener('load', () => {
      if (!messageHeight) report();
    });
    iframe = element;
    frame.insertBefore(element, layer);
    if (messageHeight) window.addEventListener('message', listen);
  };

  if (eager) {
    create();
    if (messageHeight) cancels.push(whenNear(frame, false, startTimer));
  } else {
    cancels.push(
      whenNear(frame, false, () => {
        create();
        if (messageHeight) startTimer();
      }),
    );
  }

  return () => {
    for (const cancel of cancels) cancel();
    clearTimeout(timer);
    window.removeEventListener('message', listen);
    wrapper.remove();
  };
}

function fallback(html: string): HTMLElement {
  const quote = document.createElement('blockquote');
  quote.innerHTML = html;
  return quote;
}
