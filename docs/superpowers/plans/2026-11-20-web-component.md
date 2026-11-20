# `<social-embed>` Web Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A React-free `<social-embed>` custom element (`social-embeds/element`, one self-contained `dist/element.js`) that renders every platform `<SocialEmbed>` renders, with the same output, released as 0.6.0.

**Architecture:** Part 1 moves each platform's knowledge out of its `.tsx` component into a plain **plan** function in `src/core/`, which returns what to render (iframe attributes, or script markup and driver, plus default sizing and placeholder rule). The React components call the plans and keep their frame code. Part 2 adds `src/element/`: a custom element that resolves the input, calls the same plans, and mounts them with its own small DOM frame code that uses the same constants.

**Tech Stack:** TypeScript 6, tsdown (ESM, `platform: 'neutral'`), Vitest + happy-dom, React 19 (components only), Next.js 16 playground, Changesets.

**Spec:** [docs/superpowers/specs/2026-11-20-web-component-design.md](../specs/2026-11-20-web-component-design.md)

## Global Constraints

- Node >= 22, ES2022, ESM only; CI's checks stay green: `typecheck`, `lint`, `format:check`, `test`, `build`, `check:directives`, `check:publint`, `check:attw` (`esm-only`), playground build.
- Part 1 changes nothing a user can see. The existing component tests pass with **only import paths changed**; any other edit to an existing test is a finding, not a fix.
- `src/core/**` and `src/element/**` import nothing from `react`, `react-dom` or `src/components/**` (enforced by ESLint, Task 1).
- The element renders into the light DOM. Markup it inserts is built only from a verified embed and escaped values (D68). Unrecognised embed code renders nothing.
- `dist/element.js` is one file with no `import` statements, and under 30 KB gzipped.
- Error messages are byte for byte the ones `<SocialEmbed>` passes to `onError`.
- One branch `feat/web-component`, one PR. Part 1 commits carry no changeset; Task 12 adds a `minor` changeset → 0.6.0.
- Comments: rare, one-line gotchas (house style). Commits: Conventional Commits, no AI attribution.
- Every task ends with `pnpm test && pnpm typecheck && pnpm lint` green.

## Review Focus

1. **Reset during load:** `url` changes while a script platform's driver or an iframe's height timeout is pending. Expected: the old attempt's timers, listeners and render signal are inert, and only the new embed fires `load` or `error`. Test in Task 9 and Task 10.
2. **Move in the DOM** (disconnect then reconnect in the same task, as Vue and React keyed lists do). Expected: one iframe, one `message` listener, one `load` event. Test in Task 10.
3. **Upgrade after parse:** the HTML has `<social-embed url="…">` or a `<template>` child before the module loads. Expected: it renders once `customElements.define` runs. Test in Task 10.
4. **Property set before upgrade:** a framework sets `el.html = '…'` on an element not yet defined. Expected: the value is picked up on upgrade, not shadowed by an own property. Test in Task 10.
5. **Two elements, one script platform:** two X posts on a page. Expected: the platform script loads once and both render and fire `load`. Test in Task 9.

---

## Part 1 — platform logic out of React

### Task 0: Branch

- [ ] `git switch -c feat/web-component` from `main`. Commit the spec and this plan: `docs: add the web component design and plan`.

### Task 1: The core module

**Files:**

- Create: `src/core/plan.ts`, `src/core/resolve.ts`, `src/core/params.ts`, `src/core/timing.ts`
- Move (git mv): `src/components/markup.ts` → `src/core/markup.ts`, `src/components/drivers.ts` → `src/core/drivers.ts`
- Modify: `src/components/shared.ts`, `src/components/iframe-embed.tsx`, `src/components/script-embed.tsx`, `src/components/hooks.ts`, every importer of the moved helpers, `eslint.config.js`
- Test: `test/components/drivers.test.ts` (import path only)

**Interfaces — Produces:**

```ts
// src/core/plan.ts
export type MessageHeight = { origin: string; read: (data: unknown) => number | undefined }; // moved from iframe-embed.tsx, re-exported there
export type IframePlan = {
  kind: 'iframe';
  src: string; title: string; allow: string;
  referrerPolicy?: 'strict-origin-when-cross-origin';
  scrolling?: 'no';
  sandbox?: string;
  ratio: { width: number; height: number };
  size?: { width?: number; height?: number };
  messageHeight?: MessageHeight;
  startHeight?: number;
  hostParam?: string;
  /** The platform's default; a host `maxWidth` replaces it. */
  maxWidth?: number;
  /** Verified fallback content shown as the placeholder (Bluesky). */
  fallbackHtml?: string;
};
export type ScriptPlan = {
  kind: 'script';
  /** Changes whenever the platform script must render from scratch (D35). */
  key: string;
  markup: string; driver: Driver; minHeight: number; label: string;
  hasFallback: boolean;
  maxWidth?: number;
};
export type PlanError = { kind: 'error'; message: string };
export type Plan = IframePlan | ScriptPlan;

// src/core/resolve.ts — moved from shared.ts unchanged
export const NAMES: Record<Platform, string>;
export function lookupMessage(platform: Platform): string;
export function resolveEmbed(url: string | undefined, given: ParsedEmbed | undefined, platform: Platform): { embed: ParsedEmbed; error?: never } | { embed?: never; error: string };
/** The message `<SocialEmbed>` reports when its input matches no platform. */
export function sourceError(source: { html: string } | { url: string }): string;

// src/core/params.ts — moved from shared.ts unchanged
export function optionsWithout(...): ...; export function query(...): string; export function playerParams(...): ...;

// src/core/timing.ts
export const ROOT_MARGIN = '200px 0px';
export const HEIGHT_TIMEOUT_MS = 15_000;
export const MAX_REPORTED_HEIGHT = 50_000;
export const RENDER_ATTEMPTS = 3;
export const RENDER_TIMEOUT_MS = 15_000;
export const RETRY_DELAY_MS = 1000;
```

`shared.ts` keeps `EmbedSource`, `SharedProps`, `FrameProps` and re-exports the moved functions only if a component still needs a single import site (builder's choice). `social-embed.tsx` uses `sourceError` for its unrecognised-input message.

- [ ] **Step 1:** Move the files and functions; update imports. Add the `no-restricted-imports` ESLint block for `src/core/**/*.ts` and `src/element/**/*.ts`: patterns `react`, `react-dom`, `react/*`, `**/components/**`.
- [ ] **Step 2: Prove the lint rule.** Temporarily add `import 'react';` to `src/core/timing.ts`; run `pnpm lint`. Expected: FAIL naming `no-restricted-imports`. Remove the line.
- [ ] **Step 3: Run** `pnpm test && pnpm typecheck && pnpm lint`. Expected: PASS, with `git diff --stat test/` showing only import-path changes.
- [ ] **Step 4: Commit** `refactor: move React-free helpers into src/core`.

### Task 2: Shared frame sizing

**Files:** Create `src/core/layout.ts`; modify `src/components/iframe-embed.tsx`; test `test/core/layout.test.ts` (new; add `test/core/**/*.test.ts` to the `parser` Vitest project, environment `node`).

**Interfaces — Produces:**

```ts
export type FrameLayout = {
  width?: number | string;
  maxWidth?: number;
  height?: number;
  maxHeight?: number;
};
/** The iframe wrapper's style, without the host's `style`. Numbers are pixels. */
export function frameStyle(
  plan: IframePlan,
  layout: FrameLayout,
  reportedHeight?: number,
): Record<string, string | number>;
```

Layout defaults: `width` `'100%'`; `maxWidth` is `layout.maxWidth ?? plan.maxWidth`.

- [ ] **Step 1: Write the failing tests** in `test/core/layout.test.ts`, values taken from today's `IframeEmbed`:
  - `ratio 16/9, no layout` → `{ position: 'relative', width: '100%', maxWidth: undefined, aspectRatio: '16 / 9' }`
  - `size {width: 560, height: 315}` overrides the ratio → `aspectRatio: '560 / 315'`
  - `height: 400, maxHeight: 600` → `{ height: 400, maxHeight: 600 }`, no `aspectRatio`
  - `maxHeight: 360` on 16/9 → `maxWidth: 640`; with `maxWidth: 500` too → `maxWidth: 500`
  - `messageHeight` with `startHeight: 300` → `height: 300`; with `reportedHeight: 812` → `height: 812`
  - `plan.maxWidth: 325`, no layout → `maxWidth: 325`; `layout.maxWidth: 400` → `400`
- [ ] **Step 2: Run** `pnpm exec vitest run test/core/layout.test.ts`. Expected: FAIL, `frameStyle` not exported.
- [ ] **Step 3:** Implement `frameStyle` from the wrapper computation in `IframeEmbed`; make `IframeEmbed` call it and spread `...style` after.
- [ ] **Step 4: Run** `pnpm test`. Expected: PASS, existing iframe tests untouched.
- [ ] **Step 5: Commit** `refactor: share the iframe wrapper sizing`.

### Tasks 3–5: Plans per platform

Same steps for each group. **Per platform:** `src/core/plans/{platform}.ts` exports the options type (moved from the component; the component re-exports it, so the public types don't change) and

```ts
export function {platform}Plan(embed: ParsedEmbed, options: {Platform}Options): Plan | PlanError;
```

`embed` is already verified (`resolveEmbed`). `options` are the component's option props; the plan merges them over the embed code's options exactly as the component does today. Names: `xPlan`, `instagramPlan`, `threadsPlan`, `facebookPlan`, `tiktokPlan`, `youtubePlan`, `telegramPlan`, `snapchatPlan`, `linkedinPlan`, `redditPlan`, `pinterestPlan`, `spotifyPlan`, `vimeoPlan`, `twitchPlan`, `dailymotionPlan`, `blueskyPlan`, `soundcloudPlan`, `appleMusicPlan`, `applePodcastsPlan`, `tumblrPlan`, `kickPlan`, `giphyPlan`. Only `dailymotionPlan` returns a `PlanError` (no Player ID, D63).

The component becomes: destructure its option props and the host's `maxWidth`/`placeholder`; `resolveEmbed`; call the plan; report a `PlanError` through `useReportError`; render `IframeEmbed` (spreading the plan's fields, `maxWidth={maxWidth ?? plan.maxWidth}`, and for `fallbackHtml` the existing `<blockquote dangerouslySetInnerHTML>` placeholder) or `ScriptEmbed` with `key={plan.key}`. A test that fails after rewiring means the plan differs from the old component: fix the plan.

- [ ] **Step 1: Write the failing plan tests** in `test/core/plans-{group}.test.ts` (`parser` project), one `describe` per platform, using the fixtures its component tests already import. Each asserts the full plan with `toEqual` (for script plans, `driver` with `toBe` on the exported driver), including `maxWidth` and the placeholder fields. At least: one URL-built embed and one embed-code embed per platform, plus an option override (for example `youtubePlan(embed, { start: 30 })` adds `start=30`).
- [ ] **Step 2: Run** `pnpm exec vitest run test/core`. Expected: FAIL, missing modules.
- [ ] **Step 3:** Write the plans, moving each component's logic; rewire each component.
- [ ] **Step 4: Run** `pnpm test && pnpm typecheck && pnpm lint`. Expected: PASS; `git diff --stat test/components` shows only import-path changes.
- [ ] **Step 5: Commit** `refactor: move {group} platform logic into plans`.

| Task | Group            | Platforms                                                                                                | Notes                                                                                                                                                                                                                                                       |
| ---- | ---------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3    | wave 1–2 iframes | tiktok, youtube, telegram, snapchat, linkedin, reddit                                                    | LinkedIn `maxWidth` = `embed.size?.width ?? DEFAULT_WIDTH`; Reddit `startHeight` = `embed.size?.height ?? START_HEIGHT`                                                                                                                                     |
| 4    | wave 3–4 iframes | spotify, vimeo, twitch, dailymotion, bluesky, soundcloud, applemusic, applepodcasts, tumblr, kick, giphy | Bluesky sets `fallbackHtml`; Twitch sets `hostParam`; Dailymotion's `PlanError` message is today's `onError` text                                                                                                                                           |
| 5    | script platforms | x, instagram, threads, pinterest, facebook                                                               | `facebookPlan` returns the video `IframePlan` (both the `iframe` variant and D45's `showText: false` case, absorbing `facebook-video-iframe.tsx`) or the SDK `ScriptPlan` with `key` = `` `${sdkLocale} ${markup}` ``; Pinterest `maxWidth` from `pinWidth` |

### Task 6: One plan per embed

**Files:** Create `src/core/plan-embed.ts`; test `test/core/plan-embed.test.ts`.

**Interfaces — Produces:** `export function planEmbed(embed: ParsedEmbed): Plan | PlanError` — routes on `embed.platform` to the plan with `{}` options, the same options `<SocialEmbed>` passes (none).

- [ ] **Step 1: Write the failing test:** for one fixture per platform (the `social-embed.test.tsx` table's fixtures), `planEmbed(parseEmbed(fixture)!)` equals `{platform}Plan(embed, {})`; and a `satisfies Record<Platform, …>` table so a new platform without a case fails `typecheck`.
- [ ] **Step 2: Run** it. Expected: FAIL, missing module.
- [ ] **Step 3:** Implement with an exhaustive `switch` (`never` check).
- [ ] **Step 4: Run** `pnpm test && pnpm typecheck && pnpm lint`. Expected: PASS.
- [ ] **Step 5: Commit** `refactor: route a parsed embed to its plan`.

## Part 2 — the element

### Task 7: Entry, registration and build

**Files:** Create `src/element/index.ts`, `src/element/social-embed-element.ts` (a class with empty `connectedCallback` for now), `scripts/check-element.mjs`; modify `tsdown.config.ts`, `package.json`, `.github/workflows/ci.yml`, `scripts/check-directives.mjs` if needed; test `test/element/registration.test.ts` (new Vitest project `element`, happy-dom, same `environmentOptions` as `dom`) and `test/element/node-import.test.ts` (in the `parser` project, environment `node`).

**Interfaces — Produces:**

```ts
// src/element/index.ts
export { SocialEmbedElement } from './social-embed-element';
// defines 'social-embed' when customElements exists and the name is free
declare global {
  interface HTMLElementTagNameMap {
    'social-embed': SocialEmbedElement;
  }
}
```

`SocialEmbedElement` extends `HTMLElement` only where `HTMLElement` exists: in Node the module exports a class that is never defined. (Pattern: `const Base = typeof HTMLElement === 'undefined' ? (class {} as typeof HTMLElement) : HTMLElement;`.)

Build: `tsdown.config.ts` exports two configs. The second has `entry: { element: 'src/element/index.ts' }`, `clean: false`, `dts: true`, and no shared chunks with the first. `package.json`: `"./element": { "types": "./dist/element.d.ts", "default": "./dist/element.js" }`, `"sideEffects": ["./dist/element.js"]`. `scripts/check-element.mjs` (script `check:element`, run in CI after `check:attw`) fails when `dist/element.js` contains an `import` or `export … from` of another module, a `react` string in an import position, or exceeds 30 720 bytes gzipped (`node:zlib` `gzipSync`).

- [ ] **Step 1: Write the failing tests:**
  - `registration`: after `import '../../src/element'`, `customElements.get('social-embed') === SocialEmbedElement` and `document.createElement('social-embed') instanceof SocialEmbedElement`; importing a second copy (`vi.resetModules()` then import again) does not throw.
  - `node-import`: `await import('../../src/element')` resolves in Node and `globalThis.customElements` stays `undefined`.
- [ ] **Step 2: Run** `pnpm exec vitest run test/element test/core`. Expected: FAIL, missing module.
- [ ] **Step 3:** Implement entry, registration, build config, exports and the check script.
- [ ] **Step 4: Run** `pnpm build && pnpm check:element && pnpm check:directives && pnpm check:publint && pnpm check:attw`. Expected: all pass; `ls dist` lists `element.js` and `element.d.ts`; `check:element` prints the gzipped size.
- [ ] **Step 5: Prove the check.** Temporarily add `import 'react';` to `src/element/index.ts` with the ESLint rule disabled on that line, build, run `pnpm check:element`. Expected: FAIL. Revert.
- [ ] **Step 6: Commit** `feat(element): register <social-embed> and build element.js`.

### Task 8: Iframe mounting

**Files:** Create `src/element/near.ts`, `src/element/dom.ts`, `src/element/mount-iframe.ts`; test `test/element/mount-iframe.test.ts` (uses `test/components/helpers.ts`'s `installObserver`/`lastObserver`; the `enter()` `act` wrapper is harmless outside React).

**Interfaces — Produces:**

```ts
// near.ts — calls `callback` once the element is within ROOT_MARGIN, or at once when eager or without IntersectionObserver
export function whenNear(
  element: Element,
  eager: boolean,
  callback: () => void,
): () => void;
// dom.ts
export type MountOptions = FrameLayout & {
  eager: boolean;
  placeholder: readonly Node[];
  onLoad: () => void;
  onError: (error: Error) => void;
};
/** Writes a style record; numbers get `px` for length properties. */
export function applyStyle(
  element: HTMLElement,
  style: Record<string, string | number | undefined>,
): void;
/** The same element and inline styles as React's `<Skeleton>`. */
export function skeleton(minHeight?: number): HTMLElement;
// mount-iframe.ts — renders into `host`, returns the cleanup
export function mountIframe(
  host: HTMLElement,
  plan: IframePlan,
  options: MountOptions,
): () => void;
```

Behaviour to match `IframeEmbed`: wrapper `div` styled by `frameStyle`; inner `div` with `position:absolute;inset:0`; iframe created only when near, attributes `src` (with `hostParam` set from `location.hostname`, same encoding as `withHost`), `title`, `allow`, `allowfullscreen`, `referrerpolicy`, `scrolling`, `sandbox`, style `display:block;width:100%;height:100%;border:0`; placeholder layer (the host's nodes, else `fallbackHtml` in a `<blockquote>`, else `skeleton()`) removed on load; `load` once.

- [ ] **Step 1: Write the failing tests**, mirroring the `iframe-embed.test.tsx` cases:
  - no iframe before `enter()`; iframe with the plan's attributes after; `eager` creates it at once
  - iframe `load` event → placeholder removed, `onLoad` once (twice `load` → once)
  - `messageHeight`: message from another origin or another window ignored; valid height → wrapper `height` updated, `onLoad` once; height `0` or `> MAX_REPORTED_HEIGHT` ignored; `read` throwing ignored
  - no height in `HEIGHT_TIMEOUT_MS` after near → `onError` with `social-embeds: {title} did not report its height`; with `eager`, the timer starts only after `enter()` (D81)
  - `hostParam: 'parent'` → `src` ends `&parent=localhost` (or `?parent=`)
  - cleanup removes the `message` listener (a later message changes nothing) and clears the timer
- [ ] **Step 2: Run** `pnpm exec vitest run test/element/mount-iframe.test.ts`. Expected: FAIL, missing module.
- [ ] **Step 3:** Implement with `ROOT_MARGIN`, `HEIGHT_TIMEOUT_MS`, `MAX_REPORTED_HEIGHT` from `src/core/timing.ts`.
- [ ] **Step 4: Run** `pnpm test && pnpm typecheck && pnpm lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(element): mount iframe embeds`.

### Task 9: Script mounting

**Files:** Create `src/element/mount-script.ts`; test `test/element/mount-script.test.ts` (fake drivers, `vi.useFakeTimers()`).

**Interfaces — Produces:** `export function mountScript(host: HTMLElement, plan: ScriptPlan, options: MountOptions): () => void;`

Behaviour to match `ScriptEmbed`: wrapper `div` with `width` (default `'100%'`) and `maxWidth` (`options.maxWidth ?? plan.maxWidth`); container `div` with `innerHTML = plan.markup`; skeleton with `plan.minHeight` (or the host's nodes) after the container unless `plan.hasFallback`, removed on render; when near: `driver.load()`, then up to `RENDER_ATTEMPTS` `render` calls, `RENDER_TIMEOUT_MS` each, `RETRY_DELAY_MS * 2 ** (n - 1)` between; a render signal from any attempt counts.

- [ ] **Step 1: Write the failing tests**, mirroring `script-embeds.test.tsx`:
  - markup in the container before near; `load` not called before near
  - `render` calls `done` → skeleton removed, `onLoad` once
  - `render` throws twice then succeeds → three attempts, delays 1000 then 2000 ms
  - never renders → `onError` `social-embeds: the {label} embed did not render` after three timeouts
  - `driver.load()` rejects → `onError` with that error, no `render`
  - `hasFallback` → no skeleton
  - cleanup during a pending attempt → a late `done` and the timers do nothing (Review Focus 1)
  - two hosts with drivers sharing one `load` promise both call `onLoad` (Review Focus 5)
- [ ] **Step 2: Run** it. Expected: FAIL, missing module.
- [ ] **Step 3:** Implement.
- [ ] **Step 4: Run** `pnpm test && pnpm typecheck && pnpm lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(element): mount script embeds`.

### Task 10: The element

**Files:** Modify `src/element/social-embed-element.ts`; test `test/element/social-embed-element.test.ts`.

**Interfaces — Consumes:** `parseEmbed`, `matchUrl`, `needsLookup`; `resolveEmbed`, `sourceError` (Task 1); `planEmbed` (Task 6); `mountIframe`, `mountScript`, `MountOptions` (Tasks 8–9).
**Produces:** `class SocialEmbedElement` with `static observedAttributes = ['url', 'width', 'max-width', 'height', 'max-height', 'eager']` and property `html: string | null` (get/set; setting re-renders).

Rules:

- **Source:** `html` property, else the first `<template>` child's `innerHTML`, else the `url` attribute. Template changes are watched with a `MutationObserver` on child list and the template's content is read when rendering.
- **Resolve:** html → `parseEmbed`; url → `matchUrl`. No match → `error` with `sourceError(...)` and nothing rendered. Then `resolveEmbed(undefined, embed, embed.platform)` → its error, if any. Then `planEmbed` → a `PlanError` becomes an `error`.
- **Layout:** `width` (number → px, else the string), `max-width`, `height`, `max-height` as numbers; non-numbers are ignored. `eager` present → `eager: true`.
- **Placeholder:** child nodes other than `<template>` at first connect, kept for every render.
- **Events:** `load` → `new Event('load')`; `error` → `new ErrorEvent('error', { error, message: error.message })`; neither bubbles. Dispatched in a microtask, so a listener added right after `append` hears it.
- **Lifecycle:** `connectedCallback` renders unless already rendered for the same source and layout; `disconnectedCallback` schedules cleanup in a microtask and skips it if the element is connected again by then (Review Focus 2); any input change runs the cleanup and renders afresh, and callbacks from a cleaned-up mount are ignored. The host gets `display: block` when its own `style.display` is empty.
- **Upgrade:** in the constructor, an own `html` property set before upgrade is deleted and re-applied through the setter (Review Focus 4).

- [ ] **Step 1: Write the failing tests:**
  - `url` of the YouTube sample with `eager` → one iframe whose `src` equals `youtubePlan(...)`’s
  - `<template>` holding the X fixture → `.twitter-tweet` markup inside the element; the fixture's `<script>` is not in the light DOM
  - `html` property wins over the template; template wins over `url`
  - unknown URL → `error` event, message `social-embeds: not a supported post URL: https://example.com/`; nothing rendered
  - unrecognised embed code → `social-embeds: unrecognised embed code`
  - Bluesky handle URL → `error` with `lookupMessage('bluesky')`'s text
  - Dailymotion URL without Player ID → the `PlanError` message (D63)
  - `max-width="400"` → wrapper `max-width: 400px`; `width="50%"` → `width: 50%`
  - setting `url` again → old iframe gone, one new iframe, one `load` after its `load` event (Review Focus 1)
  - remove and re-append in the same task → one iframe, one `message` listener (spy on `addEventListener`) (Review Focus 2)
  - element in `document.body.innerHTML` before `customElements.define` (use a fresh tag name for this test, e.g. `social-embed-upgrade`) → renders after define (Review Focus 3)
  - `el.html = fixture` before define → renders after define (Review Focus 4)
  - a `<p>` child is the placeholder until `load`
- [ ] **Step 2: Run** it. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4: Run** `pnpm test && pnpm typecheck && pnpm lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(element): render <social-embed> from a URL or embed code`.

### Task 11: Parity with `<SocialEmbed>`

**Files:** Test `test/element/parity.test.tsx` (in the `element` project, which also includes `.tsx`).

- [ ] **Step 1: Write the test.** `import.meta.glob('../fixtures/**/*.html', { query: '?raw', import: 'default', eager: true })`; skip fixtures `parseEmbed` returns `null` for (assert the skip list is exactly today's known non-embeds, if any). Mock `src/loader/platform-scripts` as `social-embed.test.tsx` does, so drivers never render. For each fixture, render `<SocialEmbed html={fixture} lazy={false} />` and a `<social-embed eager>` with the fixture in its `html` property, then compare:
  - iframe: every attribute (`src`, `title`, `allow`, `allowfullscreen`, `referrerpolicy`, `scrolling`, `sandbox`)
  - script: the container's `innerHTML`
  - wrapper: `style` `width`, `max-width`, `aspect-ratio`, `height`, `max-height`
  - placeholder kind: skeleton (with its `min-height`), blockquote fallback, or none
  - error message, when React's `onError` fires
    Also one URL per platform from `playground/samples.ts` `URLS`, compared the same way.
- [ ] **Step 2: Run** `pnpm exec vitest run test/element/parity.test.tsx`. Expected: PASS. A mismatch is a bug in Tasks 8–10 (or a plan field the element ignores): fix the element, not the test.
- [ ] **Step 3: Prove it bites.** Temporarily make `mountIframe` drop `allow`; run. Expected: FAIL on every iframe fixture. Revert.
- [ ] **Step 4: Commit** `test(element): check the element renders what <SocialEmbed> renders`.

### Task 12: Demo, docs, release

**Files:** Create `playground/app/element/page.tsx`, `playground/components/element-embed.tsx` (client component), `.changeset/web-component.md`; modify `playground/app/page.tsx` (link), `README.md`, `docs/decisions.md`.

- [ ] **Step 1: Playground `/element`:** every sample from `URLS` as `<social-embed url=…>`, plus the X and Instagram fixtures' embed code in `<template>`, each showing its `load`/`error` events as text. The client component imports `social-embeds/element` and declares `'social-embed'` in React's `JSX.IntrinsicElements`. Home page links it. Samples follow the sample post rules (no new posts needed).
- [ ] **Step 2: README** "Without React" section: CDN snippet with a pinned version, `integrity` and `crossorigin="anonymous"`, and where to copy the hash (jsDelivr's package page, "Copy HTML + SRI"); `import 'social-embeds/element'`; attributes, `html` property, `<template>` input, events with their messages; Vue `compilerOptions.isCustomElement` and Angular `CUSTOM_ELEMENTS_SCHEMA` one-liners.
- [ ] **Step 3: `docs/decisions.md`** section "Web component (2026-11-20)": D82 shared plans, separate frame code; D83 light DOM; D84 input precedence and `<template>`; D85 events and microtask dispatch; D86 `eager`; D87 one self-contained `element.js` for SRI, 30 KB budget.
- [ ] **Step 4: Changeset** `'social-embeds': minor` — "Adds the `<social-embed>` custom element (`social-embeds/element`): every platform, without React."
- [ ] **Step 5: Browser check** of `pnpm build && pnpm --dir playground build && pnpm --dir playground start` (`.claude/launch.json` `playground-prod`): `/element` and `/many`, each section scrolled into view; every embed renders as on its React page; the only errors are the documented Bluesky handle and Dailymotion Player ID ones. Then the Pages export: `PAGES_BASE_PATH=/social-embeds pnpm --dir playground build`, serve `playground/out` under `/social-embeds/`, open `/social-embeds/element/`.
- [ ] **Step 6: Run** `pnpm test && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && pnpm check:element && pnpm check:publint && pnpm check:attw`. Expected: PASS. Commit `docs: demo and document <social-embed>`.
- [ ] **Step 7:** Whole-branch review, then hand back for push and PR. After merge: Version Packages PR → 0.6.0 → maintainer approves on npm and publishes the GitHub release (deploys the demo) → check `/social-embeds/element/` live and the jsDelivr URL serves `element.js`.
