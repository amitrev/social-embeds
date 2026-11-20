# `<social-embed>` web component — design

2026-11-20. Adds a custom element so the package works without React.

## Intent

Today only React apps can use social-embeds. The goal set in wave 4 is a package "used by everyone". So the same embeds should work on a plain HTML page, in WordPress and other CMS templates, and in Vue, Svelte or Angular apps. The parser has no React in it, so a framework-free element is the step that reaches those users (maintainer, 2026-11-20).

## Who it serves (maintainer, 2026-11-20)

Both kinds of user, from **one React-free ES module**:

- A page that adds one script tag from a CDN:
  ```html
  <script
    type="module"
    src="https://cdn.jsdelivr.net/npm/social-embeds@0.6.0/dist/element.js"
  ></script>
  <social-embed
    url="https://www.youtube.com/watch?v=jNQXAC9IVRw"
  ></social-embed>
  ```
- An app that installs from npm and runs `import 'social-embeds/element'`.

## Goals

- `<social-embed>` renders every platform that `<SocialEmbed>` renders, from a post URL or embed code, with the same output: the same iframe `src` and attributes, the same script markup, the same error messages.
- The element's module and everything it imports contain no React.
- The React components keep their exact behaviour and public API.
- A platform fix is made once, in code that both the element and the React components use.

## Non-goals

- Per-platform elements (`<youtube-embed>`) or per-platform option attributes. The element mirrors `<SocialEmbed>`, which takes its options only from the embed code.
- Wrappers for Vue, Svelte or Angular. Those frameworks use custom elements directly.
- Server rendering of the element, or declarative shadow DOM.
- A UMD or classic-script build. Modern browsers load ES modules from a CDN.

## Anti-goals

- The element renders a visitor's or author's HTML as HTML. Like the components, it inserts only markup built from a verified embed and escaped values (D68). Unrecognised embed code renders nothing.
- Any change in what the React components render, or in when they call `onLoad` or `onError`.
- React, or anything from `src/components/`, in the element's bundle.

## Constraints

- Node >= 22, ES2022, ESM only, tsdown with `platform: 'neutral'`. Same CI checks: publint and attw (`esm-only`).
- `package.json` has `"sideEffects": false`. The element module registers the tag when it is imported, so it must be listed as having side effects.
- In Node, importing the module must not throw. Nuxt and SvelteKit import it on the server, where `HTMLElement` and `customElements` don't exist.
- The platform scripts (X, Instagram, Threads, Facebook, Pinterest) scan the page's document for their markup. So the element renders into the light DOM, not a shadow root (my call).

## Approaches

The 22 platform files split into two kinds of code:

- **What each platform needs:** about 1,800 lines. This is the iframe URL, allowed features, aspect ratio, height messages, options, and the script markup and driver. It changes when a platform changes.
- **How a frame behaves:** about 380 lines in `iframe-embed.tsx`, `script-embed.tsx` and `hooks.ts`. This is lazy loading, height messages, the 15 s timeouts and the retries. It is stable, and it is where the hard bugs were (D28, D81).

The approaches considered:

1. **Share the platform logic, and keep frame behaviour separate in each. Chosen (maintainer, 2026-11-20).** Each platform's knowledge moves into plain functions that the React components and the element both call. The element gets its own small frame code built on DOM APIs. The React hooks stay as they are. A platform fix happens once. The cost is that the frame timing exists twice, so the numbers it uses live in one shared module.
2. Share everything: framework-free frame controllers that React drives from effects. Nothing is duplicated, but it rewrites the React code that hydration and timeouts depend on (D28, D81). Rejected as the riskiest change to code in production.
3. A separate element built only on the parser, loader and drivers. Every platform fix would be made twice, and the two would drift. Rejected.
4. Wrapping the React components in a custom element. This ships React (about 45 KB gzipped) to every page. Rejected: the element must not need React.

## How it is built

### Part 1: move the platform logic out of React (no behaviour change)

- Each platform gets a **plan** function in plain TypeScript. It takes a verified embed and the merged options, and returns a description of what to render:
  - for an iframe platform: `src`, `title`, `allow`, `ratio`, and where used `size`, `messageHeight`, `startHeight`, `sandbox`, `hostParam`, `referrerPolicy`, `scrolling`. These are the props `IframeEmbed` takes today, minus the React ones.
  - for a script platform: `markup`, `driver`, `minHeight`, `label`, `hasFallback`.
  - for both, the platform's look when the host sets nothing (my call, so the element is sized like React): its default `maxWidth` (X 550, Instagram 540, Threads 658, Facebook post 750 from D33, TikTok 325, Bluesky 600, Tumblr 540, and any others in the components), and its placeholder rule. That rule covers Bluesky showing the verified `fallbackHtml` as its placeholder, and embed code with fallback content getting no skeleton (D34).
- Each React component becomes: resolve the embed, call its plan, and render `IframeEmbed` or `ScriptEmbed` with the result. Prop typing and option names stay in the component. A prop the host passes still replaces the plan's default.
- The non-React helpers move next to the plans. These are `resolveEmbed`, `lookupMessage`, `optionsWithout`, `query`, `playerParams`, `markup.ts` and `drivers.ts`. React-only types stay in `shared.ts`.
- Frame constants move into one module that both sides import: the near-viewport root margin, `HEIGHT_TIMEOUT_MS`, `MAX_REPORTED_HEIGHT`, the script render attempts, timeout and retry delay.
- **Proof:** the existing component tests pass with only their import paths changed. Each plan function also gets direct tests of its output for the fixtures that its component tests already use.
- **Release:** this ships with no changeset, since it changes nothing a user can see (my call).

### Part 2: the element

- **Entry:** `src/element/index.ts` builds to `dist/element.js`. Export `social-embeds/element` with types. Add `"sideEffects": ["./dist/element.js"]`. `element.js` is one self-contained file, with no chunks shared with the other entries. Subresource Integrity checks only the file the script tag names, not the modules it imports, so one `integrity` hash then covers all the code (my call).
- **Registration:** importing the entry defines `social-embed` if it isn't already defined, and only where `customElements` exists. The class is exported as `SocialEmbedElement`. A `HTMLElementTagNameMap` declaration types `document.createElement('social-embed')`.
- **Input** (my calls, mirroring `<SocialEmbed>`):
  - `url` attribute: a post URL.
  - Embed code in a `<template>` child. The template keeps it inert, so the platform's own script tag in the code never runs and the blockquote is never shown raw. A JS `html` property is set from code. When both are present, `html` wins over the template, and the template wins over `url`.
  - Layout: `width`, `max-width`, `height`, `max-height`. Numbers mean pixels. `width` also accepts any CSS length. These have the same meaning as the React props, and `height` and `max-height` reach only iframe platforms.
  - `eager`, a boolean attribute: load at once instead of when near the viewport. It is the inverse of React's `lazy`, because HTML boolean attributes default to off.
- **Output** (my calls):
  - The element renders its own wrapper and frame or markup inside itself. Other child elements are the placeholder until the embed loads, and without any the element shows the same neutral skeleton as React.
  - The element dispatches a `load` event when the platform has rendered.
  - It dispatches an `error` event as an `ErrorEvent` whose `error` is the same `Error`, with the same message, that React's `onError` receives. Neither event bubbles, like `<img>` and `<iframe>` events.
- **Lifecycle:** it renders on connect, starting when near the viewport unless `eager` is set. A change to `url`, `html`, the template or the layout attributes resets it. Disconnecting stops observers, message listeners and timers. A platform script's rendered content is never patched: a reset replaces the container, as React's `key` does (D35).
- **Frame behaviour:** the same rules as React, in DOM code.
  - The iframe is created only on the client, when near.
  - Height messages are read only from the plan's origin and capped at `MAX_REPORTED_HEIGHT`.
  - The height timeout starts when near, including with `eager` (D81).
  - The Twitch `parent` is set from `location.hostname`.
  - Script platforms load through the shared loader with the same attempts, retry delay and per-attempt timeout.
- **Size:** `element.js` with its chunks is under 30 KB gzipped, against about 45 KB for React alone. A test or check script fails the build if the element's output imports `react`.

### Tests

- **Element tests** in happy-dom, written to the same cases as the component tests, for each kind of platform: iframe, iframe with height messages, and script. They also cover attribute changes, disconnecting, `eager`, the placeholder, the error event and its messages, the Bluesky handle URL lookup message, and Dailymotion without a Player ID (D63).
- **Parity test:** for every fixture in `test/fixtures/`, the element and `<SocialEmbed>` produce the same iframe attributes or script markup, the same wrapper sizing (width, max width, aspect ratio or height), and the same placeholder kind (skeleton, fallback content, or none). This guards the "same output" goal across all 22 platforms.
- **Node import test:** importing `dist/element.js` in Node does not throw, and does not define anything.

### Docs and demo

- README: a "Without React" section with the CDN snippet (version pinned, with `integrity` and `crossorigin="anonymous"`, and a line on getting the hash from jsDelivr), the npm import, the attributes, events and template input, and a note on telling Vue and Angular that `social-embed` is a custom element.
- `docs/decisions.md`: new entries from D82 for light DOM, input precedence, events, `eager`, and sharing plans but not frame code.
- Playground, which is also the live demo: a `/element` page that renders the samples with `<social-embed>`, from URLs and from template embed code, and shows the load and error events.
- Changeset: `minor`, "Adds the `<social-embed>` custom element (`social-embeds/element`)". It ships as 0.6.0.

## Left to the builder

- File and function names for the plans and the shared constants, and the plan type's exact shape.
- How the element's frame code is split into files.
- Whether the size check is a Vitest test or a script in CI.
- The `/element` page's layout.
