import type { ScriptPlan } from '../core/plan';
import {
  RENDER_ATTEMPTS,
  RENDER_TIMEOUT_MS,
  RETRY_DELAY_MS,
} from '../core/timing';
import { applyStyle, type MountOptions, skeleton } from './dom';
import { whenNear } from './near';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Renders into `host` and returns the cleanup. */
export function mountScript(
  host: HTMLElement,
  plan: ScriptPlan,
  options: MountOptions,
): () => void {
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
  const content: readonly Node[] =
    placeholder.length > 0 ? placeholder : [skeleton(plan.minHeight)];
  if (!plan.hasFallback) box.append(...content);
  wrapper.append(box);
  host.append(wrapper);

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
    for (const node of content) node.parentNode?.removeChild(node);
    onLoad();
  };
  const retryOrFail = (number: number, error: Error) => {
    if (cancelled || done) return;
    stop();
    stop = () => {};
    if (number >= RENDER_ATTEMPTS) {
      onError(error);
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
        if (!cancelled) onError(toError(error));
      },
    );
  });

  // Platforms offer no API to tear an embed down; removing the wrapper is the cleanup.
  return () => {
    cancelled = true;
    cancelNear();
    clearTimeout(timer);
    stop();
    wrapper.remove();
  };
}
