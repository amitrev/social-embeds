import type { Plan, PlanError } from '../core/plan';
import { planEmbed } from '../core/plan-embed';
import { genericPlan } from '../core/plans/generic';
import { resolveEmbed, sourceError } from '../core/resolve';
import { matchUrl, parseEmbed, parseIframe } from '../parser';
import type { MountOptions } from './dom';
import { type Input, readInput, type Source } from './input';
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

/** Named platforms first, then a generic iframe for `html`; a URL never goes generic. */
function planSource(source: Source): Plan | PlanError {
  const embed =
    'html' in source ? parseEmbed(source.html) : matchUrl(source.url);
  if (!embed) {
    const iframe = 'html' in source ? parseIframe(source.html) : null;
    return iframe
      ? genericPlan(iframe)
      : { kind: 'error', message: sourceError(source) };
  }
  // Verifies the embed, so markup such as Bluesky's fallback is safe to insert (D68).
  const resolved = resolveEmbed(undefined, embed, embed.platform);
  if (resolved.error !== undefined)
    return { kind: 'error', message: resolved.error };
  return planEmbed(resolved.embed);
}

const UPGRADED = [
  'html',
  'url',
  'width',
  'maxWidth',
  'height',
  'maxHeight',
  'eager',
] as const;

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
    for (const name of UPGRADED) {
      if (!Object.hasOwn(this, name)) continue;
      const value: unknown = this[name];
      Reflect.deleteProperty(this, name);
      Reflect.set(this, name, value);
    }
  }

  get html(): string | null {
    return this.#html;
  }

  set html(value: string | null) {
    this.#html = typeof value === 'string' ? value : null;
    this.#update();
  }

  get url(): string | null {
    return this.getAttribute('url');
  }

  set url(value: string | null) {
    this.#reflect('url', value);
  }

  get width(): string | null {
    return this.getAttribute('width');
  }

  set width(value: string | null) {
    this.#reflect('width', value);
  }

  get maxWidth(): string | null {
    return this.getAttribute('max-width');
  }

  set maxWidth(value: string | null) {
    this.#reflect('max-width', value);
  }

  get height(): string | null {
    return this.getAttribute('height');
  }

  set height(value: string | null) {
    this.#reflect('height', value);
  }

  get maxHeight(): string | null {
    return this.getAttribute('max-height');
  }

  set maxHeight(value: string | null) {
    this.#reflect('max-height', value);
  }

  get eager(): boolean {
    return this.hasAttribute('eager');
  }

  set eager(value: boolean | null | undefined) {
    // An undefined force would toggle the attribute instead of removing it.
    this.toggleAttribute('eager', Boolean(value));
  }

  connectedCallback(): void {
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
      this.#observe();
      this.#update();
    });
    this.#observe();
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

  // Setting a template's innerHTML (as React does) changes only its content fragment.
  #observe(): void {
    const observer = this.#observer;
    if (!observer) return;
    observer.disconnect();
    observer.observe(this, { childList: true });
    for (const child of this.children)
      if (child instanceof HTMLTemplateElement)
        observer.observe(child.content, {
          childList: true,
          subtree: true,
          characterData: true,
        });
  }

  #reflect(name: string, value: string | null | undefined): void {
    if (value === null || value === undefined) this.removeAttribute(name);
    else this.setAttribute(name, value);
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

    const plan = planSource(source);
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
