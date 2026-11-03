# social-embeds — Project Brief

This document is the starting point for building `social-embeds`, a new npm package. Read it fully before writing any code. Every design decision below has already been made; do not re-open them. Where something is explicitly marked **VERIFY**, investigate before deciding and report what you found.

## 1. What this package is

A React 19+ library that turns social media embeds into working React elements. The input is either the **raw embed code** that a platform generates for a post (the HTML an editor pastes into a CMS) or the **post URL**. The output is a React component that renders the post correctly in React and Next.js (App Router, Server Components, client navigation).

The problem it solves: pasting platform embed code into `dangerouslySetInnerHTML` does not work in React. `<script>` tags do not execute, each embed on a page re-injects the same platform script, and nothing re-initialises after client-side navigation. This package recognises the platform, extracts the post identity and options, discards the `<script>` tag, loads each platform script once per page, and triggers the platform's initialisation — or, for iframe-based embeds, renders a controlled, responsive `<iframe>`.

Guiding principle: **the package converts, it does not decide.** Options come from the embed code or from props. The package imposes no styling, no defaults the host did not ask for, and no policy.

The package will live in a public GitHub repository and be published to npm as `social-embeds` (name verified available on the npm registry).

## 2. Non-goals (do not build these)

- **No server-side oEmbed fetching.** All embedding is client-side. Meta's oEmbed endpoints require tokens; the package has no network calls of its own.
- **No consent / GDPR gating.** Not the package's responsibility. Do not add `enabled`/consent props or CMP integration.
- **No HTML sanitisation.** The package never claims to make arbitrary HTML safe. It renders only whitelisted structures it has recognised; anything unrecognised is handed back to the host (see §6.4).
- **No runtime dependencies.** Zero. `react` and `react-dom` are peer dependencies only. X and YouTube are implemented directly against the platforms' own mechanisms, not via `react-twitter-embed` / `react-youtube`.
- **No dependency on `next`** of any kind. Next.js is a consumer, not a requirement. The package must work in plain React too.
- **No CommonJS build.** ESM only.
- **No `frame` prop** (custom window/document for iframe contexts). Out of scope.
- **No "inspired by" attribution** to any existing package in README or code.

## 3. Supported platforms (v1)

Platforms fall into two groups by mechanism. This split is the backbone of the architecture.

### Group A — script + manual initialisation

| Platform | Embed markup | Script | Manual init |
|---|---|---|---|
| X | `<blockquote class="twitter-tweet">…<a href="https://twitter.com/{user}/status/{id}">` | `https://platform.twitter.com/widgets.js` | `twttr.widgets.load(element)` (converts blockquotes in place) or `twttr.widgets.createTweet(id, element, options)` |
| Instagram | `<blockquote class="instagram-media" data-instgrm-permalink="…" data-instgrm-version="14">` | `https://www.instagram.com/embed.js` | `instgrm.Embeds.process()` |
| Facebook post | `<div class="fb-post" data-href="…">` | `https://connect.facebook.net/{locale}/sdk.js` | `FB.XFBML.parse(element)` |
| Facebook video (URL input only, see §5.4) | `<div class="fb-video" data-href="…">` | same SDK | `FB.XFBML.parse(element)` |
| Threads | `<blockquote class="text-post-media" data-text-post-permalink="…" data-text-post-version="0" id="ig-tp-{id}">` | `https://www.threads.com/embed.js` | **VERIFY** — not documented. Inspect `embed.js` for an exposed global analogous to `instgrm.Embeds.process`. If none exists, fall back to the TikTok approach. |
| TikTok | `<blockquote class="tiktok-embed" cite="…" data-video-id="{id}">` | `https://www.tiktok.com/embed.js` | **VERIFY** — not documented. Read https://github.com/justinmahar/react-social-media-embed/issues/74 (a user claims to have found a manual init path) and inspect `embed.js`. Fallback: reload the script with a cache-busting query parameter, replacing the previous `<script>` element. The fallback must handle multiple TikTok embeds on one page without re-triggering each other (see issue #81 in that repo for the failure mode to avoid). |

### Group B — pure iframe

| Platform | Iframe source | Notes |
|---|---|---|
| YouTube | `https://www.youtube.com/embed/{id}` | No script needed. Supports videos and Shorts. Preserve `start`/`t` and other query parameters from the input. |
| Facebook video (embed-code input) | `https://www.facebook.com/plugins/video.php?href=…` | Rendered as the iframe that came in. See §5.4. |

Not in v1 (do not implement, but do not design them out): Bluesky, Reddit, Pinterest, LinkedIn, Vimeo, Spotify.

## 4. Inputs

Two inputs, one output path:

- `html` → `parseEmbed(html)` → `ParsedEmbed` → platform component
- `url` → `matchUrl(url)` → `ParsedEmbed` (with empty options and no fallback content) → the same platform component

Nothing downstream of the parser knows which input was used.

### 4.1 Embed-code input (`html`)

The raw embed code copied from the platform's "Embed" / "Get embed code" dialog, stored as-is in the host's CMS. The parser must handle the real-world variants each platform actually generates, including:

- X: `twitter.com` and `x.com` hosts; `data-theme`, `data-conversation`, `data-cards`, `data-align`, `data-lang`, `data-dnt`, `data-width`.
- Instagram: `/p/`, `/reel/`, `/reels/`, `/tv/` permalinks, with the `?utm_source=ig_embed…` query stripped; `data-instgrm-captioned`; `data-instgrm-version`.
- Facebook: both the **iframe** variant (`plugins/post.php?href=…`, `plugins/video.php?href=…`, with `show_text`, `width`, `height` in the query) and the **SDK** variant (`fb-post` / `fb-video` divs with `data-*` attributes). The `href` inside the iframe query is URL-encoded; decode it.
- Threads: `threads.com` and legacy `threads.net` hosts; `/@{user}/post/{code}/` and `/t/{code}/`.
- TikTok: `cite` and `data-video-id`.
- YouTube: iframe `src` with `/embed/{id}` and any query parameters; `width`/`height` attributes.

### 4.2 URL input (`url`)

`matchUrl` is a table of host/path patterns per platform. Supported forms:

- X: `https://(twitter|x).com/{user}/status/{id}`
- Instagram: `https://(www.)instagram.com/(p|reel|reels|tv)/{code}/`
- Facebook post: `https://(www.)facebook.com/{page}/posts/{id}`, `…/permalink.php?…`, `…/photo…` — **VERIFY** the full set of post URL shapes the SDK accepts and document them in README.
- Facebook video: `…/{page}/videos/{id}`, `…/watch/?v={id}`, `…/reel/{id}`. Short links (`fb.watch/…`) cannot be resolved without a redirect: return `null` and document this.
- Threads: as above.
- TikTok: `https://(www.)tiktok.com/@{user}/video/{id}`. Short links (`vm.tiktok.com`, `vt.tiktok.com`) unsupported: return `null`.
- YouTube: `youtube.com/watch?v=`, `youtu.be/{id}`, `youtube.com/shorts/{id}`, `youtube.com/embed/{id}`, `youtube.com/live/{id}`; preserve `t`/`start`.

### 4.3 Honest limitation to document

With `html` input, the post's fallback content (text, author, link inside the `<blockquote>`) is available and is rendered server-side (§6.3). With `url` input there is no fallback content — only a placeholder until the embed loads. This is a property of the input, not a package limitation; say so in README.

## 5. Architecture

Two layers with a hard boundary.

### 5.1 Parser layer — `social-embeds/parser`

A pure function with **no React and no DOM dependency**. It must not use `DOMParser`, `document`, or any browser API; use regular expressions or a small hand-written tokenizer over the string. Reason: it runs identically in a Next.js Server Component, in Node at CMS ingestion time, and in the browser.

```ts
export type Platform = 'x' | 'instagram' | 'facebook' | 'threads' | 'tiktok' | 'youtube';

export type ParsedEmbed = {
  platform: Platform;
  kind: 'post' | 'video';           // only Facebook has both; others are fixed
  url: string;                      // canonical post URL
  id: string;                       // platform post/video id
  variant: 'sdk' | 'iframe';        // which rendering path applies (see §5.4)
  options: Record<string, string | number | boolean>; // platform options extracted from the input
  size?: { width?: number; height?: number };          // from iframe/data attributes when present
  fallbackHtml?: string;            // whitelisted blockquote inner content for SSR (§6.3); only from html input
};

export function parseEmbed(html: string): ParsedEmbed | null;
export function matchUrl(url: string): ParsedEmbed | null;
```

The result is a plain serialisable object so it can cross the RSC → client boundary.

`fallbackHtml` is **not** the raw input. It is rebuilt from a whitelist: for each platform, only the known elements and attributes that appear in the platform's own embed markup (`a[href]`, `p`, text, the platform's own `data-*` attributes). Everything else is dropped. The package does not sanitise arbitrary HTML; it reconstructs a known structure.

Unknown or malformed input → `null`. Never throw on bad input.

### 5.2 Renderer layer — `social-embeds` (default entry, `'use client'`)

- Platform components: `<XEmbed>`, `<InstagramEmbed>`, `<FacebookEmbed>`, `<ThreadsEmbed>`, `<TikTokEmbed>`, `<YouTubeEmbed>`. Each accepts `url` plus platform-specific option props, or an already-parsed `embed: ParsedEmbed`.
- Dispatcher: `<SocialEmbed>` accepts `html` **or** `url` (mutually exclusive at the type level — a discriminated union, not two optional props) and routes to the platform component.
- Two internal mechanisms shared by Group A: the script loader (§7) and the "mount + initialise" lifecycle hook.

### 5.3 Entry points

```json
"exports": {
  ".":        { "types": "./dist/index.d.ts",  "default": "./dist/index.js" },
  "./parser": { "types": "./dist/parser.d.ts", "default": "./dist/parser.js" }
}
```

The default entry's built output must start with `'use client'`. The `./parser` entry must **not** carry the directive. Verify with `publint` and `@arethetypeswrong/cli` in CI.

### 5.4 Facebook rendering rules (decided)

Facebook is the one platform that arrives in both iframe and SDK form. The rules:

- **Post → always SDK**, regardless of whether the input was an iframe or SDK snippet. Reason: the `plugins/post.php` iframe height is a content height computed for the `width` query parameter, not an aspect ratio; the iframe cannot be made responsive by anyone. The SDK resizes via postMessage. When the input is the iframe variant, extract `href` from the query and render the SDK path.
- **Video from embed code → iframe as given.** Aspect ratio is known from `width`/`height`. No SDK, no script.
- **Video from URL → SDK.** The aspect ratio is unknown (Facebook videos are both 16:9 and vertical Reels); the SDK reports the real size.

The parser sets `variant` accordingly so the renderer only follows it.

## 6. Shared component contract

Every embed component shares these props. Platform-specific option props are added per component and mirror the attributes the platform documents.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `url` / `html` / `embed` | see §5.2 | — | One required. |
| `width` | `number \| string` | `'100%'` | |
| `maxWidth` | `number` | per platform (X 550, Instagram 540, Threads 658, TikTok 605 — **VERIFY** each platform's documented maximum) | The embed fills its container up to this. |
| `height` | `number` | — | Group B only. Group A embeds size themselves. |
| `placeholder` | `ReactNode` | neutral skeleton | Rendered until the embed reports ready. Default skeleton uses a per-platform `minHeight` to limit CLS. |
| `lazy` | `boolean` | `true` | Load the platform script only when the element enters the viewport (`IntersectionObserver`). On a page with five embeds this is one third-party script on first paint instead of five. |
| `onLoad` | `() => void` | — | Fires once the platform has rendered the post. |
| `onError` | `(error: Error) => void` | — | Fires on invalid input, script load failure, or init timeout. Never throws. |
| `...rest` | `ComponentProps<'div'>` | — | Forwarded to the wrapper element (`className`, `style`, `data-*`). |

### 6.1 Responsiveness

- Group A: wrapper is `width: 100%; max-width: {maxWidth}px`. The platform widget adapts (X, Instagram, Threads and Facebook SDK all support fluid width — **VERIFY** the exact attribute for each: e.g. X `data-width`, Facebook `data-width="auto"`).
- Group B: wrapper uses `aspect-ratio: {w} / {h}` derived from the input's `width`/`height` (16:9 when absent); the iframe is `width: 100%; height: 100%`. The host does nothing to make these responsive.

### 6.2 Retry

Retry on failed initialisation is internal with a sensible fixed policy (e.g. 3 attempts, backoff). Not configurable in v1.

### 6.3 Server-side fallback content

For `html` input in Group A, render `fallbackHtml` inside the wrapper on the server, so the post text, author and link exist in the HTML for crawlers and no-JS clients. On the client, the platform script upgrades that markup in place.

Constraint: the platform script mutates the DOM after hydration. The fallback must live in a subtree React never re-renders — a container with a stable `ref` whose children are written once (`dangerouslySetInnerHTML` with the whitelisted `fallbackHtml`) and never updated by React afterwards. Prefer in-place initialisation APIs (`twttr.widgets.load(el)`, `instgrm.Embeds.process()`, `FB.XFBML.parse(el)`) over factory APIs that require an empty container, so the fallback is what gets upgraded.

### 6.4 Unrecognised input

`<SocialEmbed>` accepts `fallback?: (html: string) => ReactNode`. When `parseEmbed` returns `null`, the dispatcher calls `fallback` with the original string, and the host decides (e.g. render it as trusted HTML because its CMS sanitised it upstream). If no `fallback` is provided, render nothing and call `onError`.

## 7. Script loader

One internal module shared by Group A:

- Loads each platform script **at most once per page**; concurrent mounts share one promise.
- SSR-safe: no `window`/`document` access at module scope or during render; all side effects in effects.
- Survives client-side navigation: a component mounting after the script is already present must initialise its own element without reloading the script.
- Handles the script already being on the page from another source (e.g. the host added it in `<head>`): detect the global, do not duplicate.
- Readiness detection per platform (global present + ready callback where the platform offers one, e.g. `fbAsyncInit`, `twttr.ready`).
- Cleanup on unmount where the platform allows it; never remove a shared script because one embed unmounted.
- Facebook SDK: load `sdk.js` with `xfbml=false` (or equivalent) and parse explicitly, so the SDK does not scan the whole page on its own. Locale is a `FacebookEmbed` prop defaulting to `en_US`.

## 8. Tooling and repository setup

| Area | Decision |
|---|---|
| Language | TypeScript, `strict: true` |
| React | `react` and `react-dom` `^19` as **peer dependencies**; use React 19 idioms (`ref` as a prop, no `forwardRef`) |
| Package manager | pnpm, with a workspace for the playground |
| Build | **tsdown**, ESM only, two entries (§5.3), declaration files, `'use client'` preserved on the default entry |
| Node | 20+ (engines field, CI matrix 20/22) |
| Tests | **Vitest**. Parser tests run in Node with no DOM, against a fixtures directory of real embed codes per platform and variant (this is where most tests live). Component tests with `@testing-library/react` + `happy-dom`, with the script loader mocked. |
| Playground | `/playground` — a Next.js App Router app in the workspace, **not published**. It exercises the real RSC/client boundary, the `'use client'` directive in the built output, and real platform scripts. Chosen over Storybook because Storybook does not model Server Components. |
| Lint / format | ESLint flat config (`typescript-eslint`, `eslint-plugin-react-hooks`) + Prettier |
| CI | GitHub Actions: typecheck, lint, test, build, `publint`, `@arethetypeswrong/cli` |
| Versioning / release | **Changesets** for versioning and CHANGELOG; publish from GitHub Actions via **npm trusted publishing (OIDC)** — no `NPM_TOKEN` secret, provenance attached |
| License | MIT (`LICENSE.md`) |

## 9. Documentation deliverables

All documentation in English.

- `README.md` — install; the two inputs (`html` vs `url`) with the §4.3 limitation stated plainly; `<SocialEmbed>` usage incl. `fallback`; one example per platform component; the shared props table; a **platform table** with: mechanism (script/iframe), supported URL formats, options extracted from embed code, iframe/SDK behaviour (Facebook rules from §5.4), known limitations (short links, TikTok/Threads re-init caveats); Next.js notes (Server Component usage of `social-embeds/parser`, client components, `lazy`); SSR fallback behaviour; responsiveness.
- `LICENSE.md` — MIT.
- `CONTRIBUTING.md` — how to add a platform (parser pattern + fixtures + component + README row), how to run the playground, Changesets workflow.
- `CHANGELOG.md` — generated by Changesets.
- `CODE_OF_CONDUCT.md` — standard Contributor Covenant.

## 10. Working method

- Work **strictly sequentially**, one milestone at a time, in the order below. Finish and verify each before starting the next.
- Solve the problem before writing code: for each platform, first confirm the real embed markup, script URL and init mechanism (fetch the actual embed code for a public post and read the platform script where the docs are silent). Do not assume from memory.
- Every **VERIFY** item above must be resolved with evidence and the finding written into the README or a `docs/decisions.md` note.
- Do not add features, props, abstractions or dependencies not listed here. If something listed turns out to be impossible or wrong, stop and explain why instead of working around it silently.
- Ask when a platform's behaviour is genuinely ambiguous; do not guess.

### Milestones

1. Repository scaffolding: pnpm workspace, tsdown, Vitest, ESLint/Prettier, CI, Changesets, LICENSE, empty README skeleton.
2. `social-embeds/parser`: `parseEmbed` and `matchUrl` for all six platforms, fixtures from real embed codes, full test coverage of variants, `fallbackHtml` whitelist reconstruction.
3. Script loader (§7) with tests.
4. Group B components: `YouTubeEmbed`, Facebook video iframe path.
5. Group A components: `XEmbed`, `InstagramEmbed`, `FacebookEmbed` (post + video SDK paths), `ThreadsEmbed`, `TikTokEmbed` — including the two VERIFY investigations.
6. `<SocialEmbed>` dispatcher with `fallback`.
7. Playground: one page per platform with both inputs, plus a page with many embeds for the `lazy` and single-script-load behaviour, plus a client-navigation test between pages.
8. README, CONTRIBUTING, first changeset, dry-run publish (`pnpm publish --dry-run`), then trusted-publishing setup instructions for the maintainer.
