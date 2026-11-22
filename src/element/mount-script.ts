import type { ScriptPlan } from '../core/plan';
import { postLinkText, postUrl } from '../core/post-link';
import {
  RENDER_ATTEMPTS,
  RENDER_TIMEOUT_MS,
  RETRY_DELAY_MS,
} from '../core/timing';
import { applyStyle, type Mounted, type MountOptions, skeleton } from './dom';
import { whenNear } from './near';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Appends `wrapper` to `host`; `cleanup` removes it. */
export function mountScript(
  host: HTMLElement,
  plan: ScriptPlan,
  options: MountOptions,
): Mounted {
  const { driver, label } = plan;
  const { eager, placeholder, onLoad, onError } = options;
  const wrapper = document.createElement('div');
  applyStyle(wrapper, {
    width: options.width ?? '100%',
    maxWidth: options.maxWidth ?? plan.maxWidth,
  });
  // docs/decisions.md D90
  const box = document.createElement('div');
  applyStyle(box, { width: '100%' });
  const container = document.createElement('div');
  container.innerHTML = plan.markup;
  box.append(container);
  const href = postUrl(container);
  let shown: readonly Node[] = plan.hasFallback
    ? []
    : placeholder.length > 0
      ? placeholder
      : [skeleton(plan.minHeight)];
  box.append(...shown);
  wrapper.append(box);
  host.append(wrapper);

  const show = (nodes: readonly Node[]) => {
    for (const node of shown) node.parentNode?.removeChild(node);
    shown = nodes;
    box.append(...nodes);
  };

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
    show([]);
    onLoad();
  };
  const fail = (error: Error) => {
    if (plan.hasFallback || href === undefined) show([]);
    else {
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = postLinkText(label);
      show([link]);
    }
    onError(error);
  };
  const retryOrFail = (number: number, error: Error) => {
    if (cancelled || done) return;
    stop();
    stop = () => {};
    if (number >= RENDER_ATTEMPTS) {
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
    if (cancelled || done) return;
    try {
      stop = driver.render(container, finish);
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

  const cancelNear = whenNear(container, eager, () => {
    driver.load().then(
      () => {
        attempt(1);
      },
      (error: unknown) => {
        if (!cancelled) fail(toError(error));
      },
    );
  });

  // Platforms offer no API to tear an embed down; removing the wrapper is the cleanup.
  const cleanup = () => {
    cancelled = true;
    cancelNear();
    clearTimeout(timer);
    stop();
    wrapper.remove();
  };
  return { wrapper, cleanup };
}
