import {
  type FrameLayout,
  frameStyle,
  srcWithSize,
  watchWidth,
} from '../core/layout';
import type { IframePlan } from '../core/plan';
import { FRAME_TIMEOUT_MS, MAX_REPORTED_HEIGHT } from '../core/timing';
import {
  applyStyle,
  type Mounted,
  type MountOptions,
  restyle,
  skeleton,
} from './dom';
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

/** Appends `wrapper` to `host`; `cleanup` removes it. */
export function mountIframe(
  host: HTMLElement,
  plan: IframePlan,
  options: MountOptions,
): Mounted {
  const { eager, placeholder, onLoad, onError } = options;
  const { messageHeight } = plan;
  const wrapper = document.createElement('div');
  let height: number | undefined;
  const style = (layout: FrameLayout) => {
    restyle(wrapper, frameStyle(plan, layout, height));
  };
  style(options);
  const frame = fill(document.createElement('div'));
  const layer = fill(document.createElement('div'));
  const content: readonly Node[] =
    placeholder.length > 0
      ? placeholder
      : [
          plan.fallbackHtml === undefined
            ? skeleton()
            : fallback(plan.fallbackHtml, plan.fallbackImage === true),
        ];
  layer.append(...content);
  frame.append(layer);
  wrapper.append(frame);
  host.append(wrapper);

  let iframe: HTMLIFrameElement | undefined;
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
    height = Math.ceil(value);
    applyStyle(wrapper, { height });
    report();
  };

  const failure = messageHeight ? 'did not report its height' : 'did not load';
  const startTimer = () => {
    timer = setTimeout(() => {
      if (reported) return;
      layer.remove();
      onError(new Error(`social-embeds: ${plan.title} ${failure}`));
    }, FRAME_TIMEOUT_MS);
  };

  const create = (src: string) => {
    const element = document.createElement('iframe');
    element.src = plan.hostParam ? withHost(src, plan.hostParam) : src;
    element.title = plan.title;
    element.setAttribute('allow', plan.allow);
    if (plan.allowFullscreen !== false)
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
    // A new src on a loaded frame would add a history entry; a new frame adds none.
    if (iframe) iframe.replaceWith(element);
    else frame.prepend(element);
    iframe = element;
    if (messageHeight) window.addEventListener('message', listen);
  };

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    if (!plan.sizeInSrc) {
      create(plan.src);
      return;
    }
    cancels.push(
      watchWidth(frame, (width) => {
        create(srcWithSize(plan, width));
      }),
    );
  };

  if (eager) start();
  cancels.push(
    whenNear(frame, false, () => {
      start();
      startTimer();
    }),
  );

  const cleanup = () => {
    for (const cancel of cancels) cancel();
    clearTimeout(timer);
    window.removeEventListener('message', listen);
    wrapper.remove();
  };
  return {
    wrapper,
    cleanup,
    update(layout, eager) {
      style(layout);
      if (eager) start();
    },
  };
}

function fallback(html: string, image: boolean): HTMLElement {
  const element = document.createElement(image ? 'div' : 'blockquote');
  if (image) element.style.height = '100%';
  element.innerHTML = html;
  return element;
}
