import type { FrameLayout } from '../core/layout';

export type Source = { html: string } | { url: string };

export type Input = {
  source: Source | null;
  layout: FrameLayout;
  eager: boolean;
};

function number(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

/** A number, or a number with `px`. */
function pixels(value: string | null): number | undefined {
  return value === null ? undefined : number(value.trim().replace(/px$/i, ''));
}

function template(element: Element): HTMLTemplateElement | undefined {
  for (const child of element.children)
    if (child instanceof HTMLTemplateElement) return child;
  return undefined;
}

/** A boolean attribute, except that `"false"`, as Vue and Svelte write it before define, is off. */
export function isEager(element: Element): boolean {
  const value = element.getAttribute('eager');
  return value !== null && value !== 'false';
}

/** The `html` property, else the `html` attribute, else the first `<template>` child, else the `url` attribute. */
export function readInput(element: Element, html: string | null): Input {
  const content =
    html ?? element.getAttribute('html') ?? template(element)?.innerHTML;
  const url = element.getAttribute('url');
  const width = element.getAttribute('width');
  return {
    source:
      content !== undefined ? { html: content } : url === null ? null : { url },
    layout: {
      width: number(width) ?? (width?.trim() ? width : undefined),
      maxWidth: pixels(element.getAttribute('max-width')),
      height: pixels(element.getAttribute('height')),
      maxHeight: pixels(element.getAttribute('max-height')),
    },
    eager: isEager(element),
  };
}
