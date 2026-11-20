import { planEmbed } from '../core/plan-embed';
import { resolveEmbed, sourceError } from '../core/resolve';
import { matchUrl, parseEmbed } from '../parser';
import type { MountOptions } from './dom';
import { type Input, readInput } from './input';
import { mountIframe } from './mount-iframe';
import { mountScript } from './mount-script';

// Node has no HTMLElement; the stub keeps the export importable.
const Base =
  typeof HTMLElement === 'undefined'
    ? // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      (class {} as typeof HTMLElement)
    : HTMLElement;

/** Detaches the children other than `<template>`; the non-blank ones are the placeholder. */
function capture(host: Element): Node[] {
  const kept: Node[] = [];
  for (const node of [...host.childNodes]) {
    if (node instanceof HTMLTemplateElement) continue;
    host.removeChild(node);
    if (
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
    )
      kept.push(node);
  }
  return kept;
}

export class SocialEmbedElement extends Base {
  static observedAttributes = [
    'url',
    'width',
    'max-width',
    'height',
    'max-height',
    'eager',
  ];

  #html: string | null = null;
  #placeholder: readonly Node[] | undefined;
  #observer: MutationObserver | undefined;
  #key: string | undefined;
  #cleanup = () => {};
  #token = 0;
  #waiting = false;

  constructor() {
    super();
    // A value set before the upgrade is an own property that hides the setter.
    if (Object.hasOwn(this, 'html')) {
      const value = (this as { html?: string | null }).html ?? null;
      Reflect.deleteProperty(this, 'html');
      this.html = value;
    }
  }

  get html(): string | null {
    return this.#html;
  }

  set html(value: string | null) {
    this.#html = value ?? null;
    this.#update();
  }

  connectedCallback(): void {
    if (this.style.display === '') this.style.display = 'block';
    // While the parser streams, the children after the open tag do not exist yet.
    if (this.#placeholder === undefined && document.readyState === 'loading') {
      if (!this.#waiting) {
        this.#waiting = true;
        document.addEventListener(
          'DOMContentLoaded',
          () => {
            this.#waiting = false;
            if (this.isConnected) this.connectedCallback();
          },
          { once: true },
        );
      }
      return;
    }
    this.#placeholder ??= capture(this);
    this.#observer ??= new MutationObserver(() => {
      this.#update();
    });
    this.#observer.observe(this, { childList: true });
    this.#update();
  }

  // A move (disconnect, then connect in the same task) keeps the embed.
  disconnectedCallback(): void {
    queueMicrotask(() => {
      if (this.isConnected) return;
      this.#observer?.disconnect();
      this.#reset();
      this.#key = undefined;
    });
  }

  attributeChangedCallback(): void {
    this.#update();
  }

  #update(): void {
    if (!this.isConnected || this.#placeholder === undefined) return;
    const input = readInput(this, this.#html);
    const key = JSON.stringify(input);
    if (key === this.#key) return;
    this.#reset();
    this.#key = key;
    this.#render(input, this.#placeholder);
  }

  #reset(): void {
    this.#token += 1;
    const cleanup = this.#cleanup;
    this.#cleanup = () => {};
    cleanup();
  }

  #render(input: Input, placeholder: readonly Node[]): void {
    const { source, layout, eager } = input;
    if (!source) return;
    const token = this.#token;
    const dispatch = (event: Event) => {
      queueMicrotask(() => {
        // Runs before a same-task removal's cleanup microtask, so the token alone is not enough.
        if (token === this.#token && this.isConnected)
          this.dispatchEvent(event);
      });
    };
    const onError = (error: Error) => {
      dispatch(new ErrorEvent('error', { error, message: error.message }));
    };

    const embed =
      'html' in source ? parseEmbed(source.html) : matchUrl(source.url);
    if (!embed) {
      onError(new Error(sourceError(source)));
      return;
    }
    // Verifies the embed, so markup such as Bluesky's fallback is safe to insert (D68).
    const resolved = resolveEmbed(undefined, embed, embed.platform);
    if (resolved.error !== undefined) {
      onError(new Error(resolved.error));
      return;
    }
    const plan = planEmbed(resolved.embed);
    if (plan.kind === 'error') {
      onError(new Error(plan.message));
      return;
    }
    const options: MountOptions = {
      ...layout,
      eager,
      placeholder: placeholder.map((node) => node.cloneNode(true)),
      onLoad: () => {
        dispatch(new Event('load'));
      },
      onError,
    };
    this.#cleanup =
      plan.kind === 'iframe'
        ? mountIframe(this, plan, options)
        : mountScript(this, plan, options);
  }
}
