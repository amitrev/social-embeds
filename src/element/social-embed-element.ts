import type { Plan, PlanError } from '../core/plan';
import { planEmbed } from '../core/plan-embed';
import { genericPlan } from '../core/plans/generic';
import { resolveEmbed, sourceError } from '../core/resolve';
import { matchUrl, parseEmbed, parseIframe } from '../parser';
import { parserFor } from '../parser/platforms';
import type { Mounted, MountOptions } from './dom';
import { type Input, isEager, readInput, type Source } from './input';
import { mountIframe } from './mount-iframe';
import { mountScript } from './mount-script';

// Node has no HTMLElement; the stub keeps the export importable.
const Base =
  typeof HTMLElement === 'undefined'
    ? // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      (class {} as typeof HTMLElement)
    : HTMLElement;

const SLOT = 'embed';

/** Copies of the children other than `<template>` and blank text, without ids. */
function placeholder(host: Element): Node[] {
  const copies: Node[] = [];
  for (const node of host.childNodes)
    if (
      (node.nodeType === Node.ELEMENT_NODE &&
        !(node instanceof HTMLTemplateElement)) ||
      (node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
    ) {
      const copy = node.cloneNode(true);
      if (copy instanceof Element)
        for (const element of [copy, ...copy.querySelectorAll('[id]')])
          element.removeAttribute('id');
      copies.push(copy);
    }
  return copies;
}

/** The children's HTML when it is embed code, as when a sanitizer removed the `<template>`. */
function childCode(host: Element): string | undefined {
  let html = '';
  for (const child of host.children)
    if (child.slot !== SLOT) html += child.outerHTML;
  return html && (parseEmbed(html) ?? parseIframe(html)) ? html : undefined;
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
  const parser = parserFor(embed.platform);
  if (!parser) return { kind: 'error', message: sourceError(source) };
  const resolved = resolveEmbed(undefined, embed, parser);
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
    'html',
    'url',
    'width',
    'max-width',
    'height',
    'max-height',
    'eager',
  ];

  #html: string | null = null;
  #observer: MutationObserver | undefined;
  #mounted: Mounted | undefined;
  #key: string | undefined;
  #code: string | undefined;
  #token = 0;
  #waiting = false;

  constructor() {
    super();
    // Only the output is slotted; the host's own children stay in place, unrendered (docs/decisions.md D83).
    this.attachShadow({ mode: 'open' }).innerHTML =
      `<slot name="${SLOT}"></slot>`;
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
    return isEager(this);
  }

  set eager(value: boolean | string | null | undefined) {
    // As for a boolean attribute: React 19 sets `''` for `eager=""`.
    this.#reflect(
      'eager',
      value === '' || (value && value !== 'false') ? '' : null,
    );
  }

  connectedCallback(): void {
    // While the parser streams, the children after the open tag do not exist yet.
    if (!this.#observer && document.readyState === 'loading') {
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
      this.#code = undefined;
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
    if (!this.isConnected || !this.#observer) return;
    const output = this.#mounted?.wrapper;
    // A copy of a rendered element (cloneNode, saved HTML) carries an output that is not this one's.
    for (const child of [...this.children])
      if (child !== output && child.slot === SLOT) child.remove();
    // Outside code may remove the output: React setting a text child, a DOM morph.
    const attached = !output || output.parentNode === this;
    const input = readInput(this, this.#html);
    // Kept until the output is removed: a platform script may render the children's own copy.
    this.#code = input.source
      ? undefined
      : (attached && this.#code) || childCode(this);
    input.source ??= this.#code === undefined ? null : { html: this.#code };
    const key = JSON.stringify(input.source);
    if (key === this.#key && attached) {
      this.#mounted?.update(input.layout, input.eager);
      return;
    }
    this.#reset();
    this.#key = key;
    this.#render(input);
  }

  #reset(): void {
    this.#token += 1;
    const mounted = this.#mounted;
    this.#mounted = undefined;
    mounted?.cleanup();
  }

  #render(input: Input): void {
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
      placeholder: this.#code === undefined ? placeholder(this) : [],
      onLoad: () => {
        dispatch(new Event('load'));
      },
      onError,
    };
    this.#mounted =
      plan.kind === 'iframe'
        ? mountIframe(this, plan, options)
        : mountScript(this, plan, options);
    this.#mounted.wrapper.slot = SLOT;
  }
}
