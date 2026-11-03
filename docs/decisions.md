# Decisions

Evidence-backed decisions and findings required by the project brief (§10). Each entry records what was decided, why, and the evidence.

## Tooling (Milestone 1, 2026-11-03)

### D1. Node.js: `engines.node >=22`, CI on 22, 24 and 26

The brief specified Node 20+ with CI on 20 and 22. Changed with maintainer approval.

- Node 20 reached end of life on 2026-04-30 ([nodejs/Release schedule](https://github.com/nodejs/Release/blob/main/schedule.json)).
- Current tool releases exclude Node 20:
  - tsdown 0.23.4: `^22.18.0 || ^24.11.0 || >=26.0.0`
  - vitest 5.1.0: `^22.12.0 || ^24.0.0 || >=26.0.0`
  - @changesets/cli 3.0.3: `^22.11 || ^24 || >=26`
- Supported lines on 2026-11-03: 22 (maintenance, EOL 2027-04-30), 24 (maintenance, EOL 2028-04-30), 26 (active LTS since 2026-10-28).

### D2. `'use client'` is checked by `scripts/check-directives.mjs`

§5.3 asks for the directive to be verified with publint and `@arethetypeswrong/cli`. Neither tool checks directives: publint reports "All good!" whether or not the directive is present, and neither package's source mentions `use client`.

The script runs in CI after the build. It fails unless `dist/index.js` starts with `'use client'` and no other emitted `.js` file carries it. Both negative cases were tested (directive removed from `index.js`; directive added to `parser.js`) and fail as expected.

Rolldown keeps a top-level directive only when the module is an entry module ([Rolldown: directives](https://rolldown.rs/in-depth/directives)). Consequences:

- The directive lives only in `src/index.ts`. Component files must not carry their own.
- The build prints a `MODULE_LEVEL_DIRECTIVE` warning for `src/index.ts`. The output is still correct, as the check proves.

### D3. TypeScript 6.0.3, not 7.x

`typescript@latest` is 7.0.2, but typescript-eslint 8.72.1 declares the peer range `typescript >=4.8.4 <6.1.0`.

### D4. Dev dependencies required by listed tools

- `vite` 8.3.5: required peer of Vitest 5 (`peerDependenciesMeta.vite.optional: false`).
- `@testing-library/dom` 10.4.2: required peer of `@testing-library/react` 16.
- `@eslint/js` 10.0.1: ESLint's own recommended core rules (approved).

### D5. `@arethetypeswrong/cli` runs with `--profile esm-only`

The default `strict` profile fails any ESM-only package (`node10`: "Resolution failed"; `node16` from CJS: ESM via dynamic import only). `--profile esm-only` ignores those two resolutions, which matches §2 (no CommonJS build).

### D6. The parser is DOM-free at compile time

`tsconfig.parser.json` type-checks `src/parser` with `lib: ["ES2022"]` and `types: []`. Any use of `document`, `window`, `DOMParser` or Node globals there fails `pnpm typecheck` (§5.1).

### D7. pnpm 12 minimum release age

pnpm 12 gates packages younger than its minimum release age. vitest 5.1.0 (published 2026-11-02) was inside that window at install time, so pnpm added `minimumReleaseAgeExclude` entries for `vitest`, `@vitest/mocker` and `@vitest/spy` 5.1.0 to `pnpm-workspace.yaml`. The gate is 24 hours: vitest 5.1.0 was published at 2026-11-02 16:02 UTC and clears it at 2026-11-03 16:03 UTC. A removal attempt at 15:25 UTC failed with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. The entries were removed in Milestone 4, at 18:43 UTC, when `pnpm install --frozen-lockfile` passed the policy check.

### D8. Release workflow deferred to Milestone 8

The npm trusted-publisher configuration is bound to the workflow filename and the maintainer's npm account. To verify in Milestone 8 against the official npm and pnpm docs:

- how `changeset publish` → `pnpm publish` performs the OIDC exchange, and which versions are required;
- that a failed exchange cannot fall back silently;
- whether a trusted publisher can be configured before the first publish.

### D9. `CODE_OF_CONDUCT.md` in Milestone 8

§9 lists it, but no milestone did.

## Platform behaviour

### D10. Facebook `fb-video` div embed code renders through the SDK

§3 limits the `fb-video` SDK path to URL input, and §5.4 renders video embed code "as the iframe that came in". But §4.1 requires parsing `fb-video` divs, which contain no iframe. Resolved by the maintainer on 2026-11-03: parse as `kind: 'video'`, `variant: 'sdk'`, with its `data-*` options. Same reasoning as URL input: the aspect ratio is unknown.

### D11. TikTok renders through the iframe Embed Player (Group B)

Supersedes the brief's TikTok row in §3 (maintainer decision, 2026-11-03).

- [Embed Videos](https://developers.tiktok.com/doc/embed-videos) (updated 2026-10-23): "Embed Videos will be deprecated soon … We recommend using Embed Player for new integrations."
- TikTok's oEmbed (`https://www.tiktok.com/oembed?url=…`) now returns an iframe, not a `blockquote.tiktok-embed`: `src="https://www.tiktok.com/player/v1/6718335390845095173?embed_from=oembed&music_info=1&description=1&autoplay=1&muted=1"`, `width="325" height="578"`.
- [Embed Player](https://developers.tiktok.com/doc/embed-player) (updated 2026-10-28) documents `https://www.tiktok.com/player/v1/{id}` and its query parameters.

Every TikTok input (legacy `blockquote.tiktok-embed` code, player iframe code, URL) renders the player iframe: `kind: 'video'`, `variant: 'iframe'`, no script and no fallback content. The default aspect ratio is 9:16, which matches the oEmbed iframe (325×578). VERIFY V2 no longer applies.

When the username is unknown (player iframe input), the canonical URL is `https://www.tiktok.com/@/video/{id}`. TikTok serves that URL with HTTP 200 and declares it as the page's canonical URL.

The TikTok website's own share dialog gives the player iframe too (pasted by the maintainer, 2026-11-03): `src="https://www.tiktok.com/player/v1/7701153412242574613?embed_from=webapp_share&music_info=1&description=1&autoplay=1&muted=1"`. No current source produces the blockquote, so the legacy blockquote tests use the structure from brief §3 rather than a fixture.

### D12. YouTube privacy-enhanced mode is preserved

The share dialog's "Enable privacy-enhanced mode" produces `https://www.youtube-nocookie.com/embed/{id}`. The parser accepts it and sets `options.nocookie = true` so the renderer keeps the host.

Share dialog output observed on 2026-11-03 (video `jNQXAC9IVRw`):

- default: `src="https://www.youtube.com/embed/jNQXAC9IVRw?si=zgsn8wwuM9wOXrRk"`, `width="560" height="315"`
- "Start at": `…?si=zgsn8wwuM9wOXrRk&amp;start=11`
- privacy-enhanced, controls off, start: `https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?si=zgsn8wwuM9wOXrRk&amp;controls=0&amp;start=11`

### D13. URL input carries only what the URL itself contains

§4 says URL input yields empty options; §4.2 says YouTube URLs keep `t`/`start`. Resolved (maintainer, 2026-11-03): `matchUrl` returns options only for data the URL itself carries. Today that is YouTube's start time: `t` (`90`, `90s`, `1m30s`, `1h2m3s`) or `start` becomes `options.start` in seconds, plus `nocookie` for `youtube-nocookie.com` URLs.

### D14. Embed-code input is strict

`parseEmbed` accepts only the platform's own snippet: one embed element, the platform's own `<script src>` tags, Facebook's empty `<div id="fb-root">`, whitespace and HTML comments. Anything else (wrappers, extra markup, unknown scripts, malformed HTML) returns `null`, and `<SocialEmbed>` hands the string to the host's `fallback` (§6.4). Maintainer decision, 2026-11-03.

### D15. Instagram URL shapes and canonical permalinks

Instagram's own site now links posts as `/{user}/p/{code}/` and `/{user}/reel/{code}/` (seen on `instagram.com/instagram/`, 2026-11-03). `matchUrl` accepts them (maintainer decision).

`embed.js` takes `data-instgrm-permalink` as given, strips the query, and appends `embed/` (plus `captioned/`). Status of the resulting iframe URLs for a reel and a post on 2026-11-03:

| Permalink path         | `…/embed/captioned/` |
| ---------------------- | -------------------- |
| `/reel/{code}/`        | 200                  |
| `/p/{code}/`           | 200                  |
| `/tv/{code}/`          | 200                  |
| `/reels/{code}/`       | 404                  |
| `/{user}/reel/{code}/` | 404                  |
| `/{user}/p/{code}/`    | 404                  |

So the canonical URL is always `https://www.instagram.com/{p|reel|tv}/{code}/`: `reels` becomes `reel`, and the username segment is dropped.

### D16. X embed code today

publish.x.com oEmbed output on 2026-11-03:

- links use `https://x.com/{user}/status/{id}?ref_src=twsrc%5Etfw`;
- the script is `https://platform.x.com/widgets.js` (the brief names `platform.twitter.com`);
- alignment is emitted as a plain `align="center"` attribute, not `data-align`;
- options appear as `data-cards`, `data-width`, `data-lang`, `data-dnt`, `data-theme`.

The parser accepts both hosts and both alignment forms. The canonical URL is `https://x.com/{user}/status/{id}`.

### D17. Threads embed code today

- The Threads oEmbed endpoint `https://graph.threads.net/v1.0/oembed?url=…` works without an access token.
- `data-text-post-permalink` uses `https://www.threads.com/t/{code}?utm_source=th_embed&amp;utm_campaign=threads_api`, even for `threads.net` and `/@{user}/post/{code}` input. The canonical URL is therefore `https://www.threads.com/t/{code}`.
- The blockquote carries `data-theme="light"` and `data-text-post-version="0"`.
- The inline style has `max-width:658px` by default (V4: Threads 658 confirmed). The oEmbed `maxwidth` parameter only changes that inline style; the parser ignores inline styles.
- The fallback content is a link with the Threads logo and the text "View on Threads". There is no post text or author.

### D18. Option names and value types

Options use camelCase names without the `data-` or platform prefix (`data-instgrm-captioned` → `captioned`, `show_text` → `showText`). Values are typed: `"true"`/`"false"` become booleans, an attribute the platform reads by presence alone (Instagram's `data-instgrm-captioned`) becomes `true`, a canonical integer (`0`, `11`, not `007`) becomes a number, and everything else stays a string. Iframe query parameters keep their own names (`si`, `controls`, `music_info`).

### D19. Facebook fluid width (V5, Facebook part)

[Embedded Posts](https://developers.facebook.com/docs/plugins/embedded-posts) (updated 2026-06-30): `data-width` takes 350–750 px; "Leave empty to use fluid width." There is no `data-width="auto"`. The page also documents `data-lazy` and `data-show-text`.

### D20. The parser does its own URL parsing

`URL` and `URLSearchParams` are declared only in the DOM and Node type libraries, which `tsconfig.parser.json` excludes on purpose (D6). The parser splits URLs with a regular expression and decodes components with `decodeURIComponent`.

### D21. Facebook URL shapes (V3)

The SDK's `fb-post` and `fb-video` render the `plugins/post.php` and `plugins/video.php` iframes, so each shape was tested by loading those plugins with the shape as `href` (2026-11-03). A dead post and an unknown shape give the same "This Facebook post is no longer available" page, so only live posts count as evidence:

- Posts: a public post supplied by the maintainer; its numeric id and a photo `fbid` were read from the plugin page's own links. The control `/{user}/posts/1` showed the "no longer available" page.
- Videos: the example video from [Embedded Videos](https://developers.facebook.com/docs/plugins/embedded-video-player) (`facebook/videos/10153231379946729`). The controls `/this-is/not-a-video/` and `/facebook/videos/1/` did not render.

| Shape                                            | Kind  | Renders |
| ------------------------------------------------ | ----- | ------- |
| `/{user}/posts/{numeric id}` (trailing `/` too)  | post  | yes     |
| `/{user}/posts/pfbid…`                           | post  | yes     |
| `/permalink.php?story_fbid={id}&id={owner}`      | post  | yes     |
| `/story.php?story_fbid={id}&id={owner}`          | post  | yes     |
| `/photo.php?fbid={id}` (extra `set`, `type` too) | post  | yes     |
| `/photo/?fbid={id}`, `/photo?fbid={id}`          | post  | yes     |
| `/{user}/photos/{album}/{fbid}/`                 | post  | yes     |
| `/{page}/videos/{id}` (trailing `/` too)         | video | yes     |
| `/{page id}/videos/{id}/`                        | video | yes     |
| `/{page}/videos/{slug}/{id}/`                    | video | yes     |
| `/watch/?v={id}`, `/watch?v={id}`                | video | yes     |
| `/video.php?v={id}`                              | video | yes     |
| `/reel/{id}`                                     | video | yes     |

Each works on the `www.facebook.com`, `facebook.com` and `m.facebook.com` hosts tested. `matchUrl` accepts exactly these shapes. The canonical URL keeps the shape on `https://www.facebook.com`, with only the identifying parameters (`story_fbid`, `id`, `fbid`, `v`), and drops video slugs.

Not supported, for lack of a live sample: group posts (`/groups/{id}/posts/{id}`) and share links (`/share/p/…`, `/share/v/…`). Share links and `fb.watch/…` are redirects, which the parser cannot follow; they return `null`.

### D22. Facebook embed code

- **Post iframe** (`plugins/post.php`, as pasted by the maintainer from a post's Embed dialog): renders through the SDK (§5.4). `show_text` and `width` carry over as `showText` and `width`, which the SDK also reads. `height` is dropped, because it only fits the iframe's width.
- **Video iframe** (`plugins/video.php`): kept as an iframe. Every query parameter except `href` stays an option under its own name, and `size` comes from the `width` and `height` attributes. No real video iframe code has been collected yet; the test derives one from the post iframe.
- **SDK snippets** (`fb-post`, `fb-video`): options come from the documented attributes `data-width`, `data-show-text`, `data-lazy`, `data-allowfullscreen`, `data-autoplay` and `data-show-captions`. The fixtures are Meta's own documented snippets ([Embedded Posts](https://developers.facebook.com/docs/plugins/embedded-posts), [Embedded Videos](https://developers.facebook.com/docs/plugins/embedded-video-player)).
- **Locale:** the SDK script URL `connect.facebook.net/{locale}/sdk.js` carries the locale; the parser exposes it as `options.locale`. The `version` in the script URL is not extracted: it is the Graph API version, which the script loader sets (D26).
- **Fallback content:** whitelisted as `div`, `blockquote[cite]`, `a[href]` and `p`. The `class` attribute is kept only when it is exactly `fb-xfbml-parse-ignore`, the marker that tells the SDK not to parse that content.
- **Not accepted:** the inline SDK loader script (`(function(d, s, id){…}(document, 'script', 'facebook-jssdk'))`) that older snippets and the WordPress example use. It is an inline script, so the input is rejected under D14.

### D23. Instagram embed code

From the maintainer's pasted embed code (photo post with caption), 2026-11-03:

- The script is protocol-relative: `//www.instagram.com/embed.js`. The parser also accepts `https:`.
- The permalink carries `?utm_source=ig_embed&amp;utm_campaign=loading`; the canonical URL drops it (D15).
- The inline style has `max-width:540px` (V4: Instagram 540 confirmed).
- Like `embed.js`, the parser uses `data-instgrm-permalink`, else the last link to a post.
- `captioned` is `true` when `data-instgrm-captioned` is present, which is the only check `embed.js` makes. `version` comes from `data-instgrm-version`.
- Fallback content keeps `div`, `a[href]` and `p`: the placeholder structure, "View this post on Instagram" and the "A post shared by …" link. The SVG and all inline styles are dropped. Instagram's embed code does not contain the caption text itself.

## Script loader (Milestone 3, 2026-11-03)

### D24. X script

`https://platform.x.com/widgets.js` redirects to `https://platform.twitter.com/widgets.js` (both serve the same file), so the loader adds the twitter.com URL and recognises a host tag on either host. Ready means `twttr.widgets.load` is a function, then `twttr.ready(callback)` has fired. `widgets.js` builds `twttr.ready` from its own load promise and flushes the `twttr._e` queue of the official snippet. On load, `widgets.js` scans the whole page once by itself (`window.twttr.widgets.load()`).

### D25. Instagram and Threads share one global (V1 evidence)

Both `embed.js` files define the same module, `PolarisEmbedSDKContext`. It creates `window.instgrm = { Embeds: {} }` if missing and registers each SDK by name in `instgrm.Embeds.registeredEmbedSDKs`: Instagram as `"instagram"`, Threads as `"threads"`. Each registration chains its processor onto `instgrm.Embeds.process`, so one `process()` call processes both platforms' blockquotes. Ready therefore means `registeredEmbedSDKs.<name> === true`, not merely `instgrm.Embeds.process` existing: Instagram's script alone must not count as Threads being ready.

For V1, this means Threads' manual initialisation is `instgrm.Embeds.process()`, the same call as Instagram. That comes from reading the script; Milestone 5 confirms it on rendered posts, including after client navigation.

### D26. Facebook SDK

Probed in the browser on 2026-11-03 against a live public post:

- `FB.XFBML.parse(element)` parses the plugins inside `element`, not `element` itself. Parsing the `fb-post` div directly renders nothing and reports nothing. The renderer must parse a wrapper (Milestone 5).
- Without `FB.init` and a valid `version`, `parse` throws `init not called with valid version`; `FB.init({ xfbml: false })` throws `invalid version specified`. A version is therefore required. The brief leaves it open.
- Social plugins render with old and new Graph API versions: `v3.2` (from Meta's docs snippet), `v26.0` and `v27.0` all rendered the post (iframe 725px tall). A nonexistent `v99.0` produced a 0px iframe.
- `sdk.js#xfbml=0&version=v26.0` initialises the SDK without scanning the page, the same as `FB.init({ xfbml: false, version: 'v26.0' })`, and still calls `fbAsyncInit`. The loader uses the hash form, so it never calls `FB.init` itself or replaces a host's own init.
- `FB` exists at the script's `load` event, before init has finished, and the SDK has no public "initialised" flag. Readiness is therefore `fbAsyncInit`: the loader chains it, calling a handler the host set up first.
- The SDK adds a second script, `connect.facebook.net/{locale}/bundle/sdk.js/`, and creates `<div id="fb-root">` if the page has none.

The loader uses `FACEBOOK_SDK_VERSION = 'v26.0'`, the version Meta's Embedded Posts documentation uses in its `FB.init` example. One SDK serves the whole page, so the first locale requested wins. An invalid locale is rejected before anything loads.

### D27. Loader policy

- **One per page:** at most one script per platform, and concurrent callers share one promise. A later caller gets the settled promise, so client navigation never reloads a script.
- **Host scripts:** if the global is already present, nothing is added. If a host tag is present but still loading, the loader waits for its global instead of adding a second tag.
- **Retries (§6.2):** a script the browser reports as failed (`error` event) is removed and retried after 1 s and then 2 s; three attempts in all. A script that does not load within 15 s is not retried, because it may still arrive and run twice. A global that does not appear within 15 s of loading is a failure too.
- **Failures are not cached:** an embed mounted later starts again.
- **Cleanup:** scripts are never removed, since other embeds and the host may need them. Per-embed cleanup belongs to the components (Milestone 5).
- **Server:** the module touches no browser API until called. Called on the server, it rejects.

Verified in the browser with the built loader on the real scripts. All four platforms became ready within 12 ms of each other, duplicate calls shared one tag, and a second round added no tags; four repeat runs gave the same result. On the very first run, Instagram and Threads did not initialise within 15 s, and the loader rejected as designed. The cause was not identified, and it did not happen again in the five later runs.

## Group B components (Milestone 4, 2026-11-03)

### D28. Iframes are created on the client

The server renders the sized wrapper and the placeholder; the iframe is added after mount. An iframe in server HTML can finish loading before hydration, and React then never sees its `load` event, which would leave the placeholder up and `onLoad` uncalled. The cost: without JavaScript, a Group B embed shows only its placeholder.

`lazy` (default `true`) uses `IntersectionObserver` with a `200px` vertical margin, so loading starts just before the embed scrolls into view rather than after it appears blank. Without `IntersectionObserver`, or with `lazy={false}`, the iframe is added right after mount.

Group B has no init timeout. The iframe `load` event always fires, even for a player error page, so `onError` reports invalid input only.

### D29. Facebook video iframe content fills the frame

A `plugins/video.php?…&width=560` iframe was rendered at 320, 560 and 900 px wide with a 560:314 box. Each time, the player filled the frame (screenshots, 2026-11-03). The iframe "as given" in an aspect-ratio wrapper is therefore responsive, as §5.4 assumes. The player takes several seconds to paint.

### D30. Aspect ratios and default maximum widths (V4, Group B)

| Platform                | Aspect without input size  | Default `maxWidth` | Evidence                                                                                                 |
| ----------------------- | -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| YouTube                 | 16:9; 9:16 for Shorts URLs | none               | Player docs give only a minimum: "at least 200px by 200px".                                              |
| TikTok                  | 9:16 (D11)                 | 605                | Player docs give no size; 605 is the brief's value, from the legacy blockquote's own `max-width: 605px`. |
| Facebook video (iframe) | 16:9                       | none               | Embedded Videos: `data-width` min 220 px, "no limit on the upper end".                                   |

A Shorts URL is the only input that says a YouTube video is vertical, so it gets 9:16. Embed code always carries `width` and `height`, which win.

### D31. Option props and iframe attributes

- **Option props** mirror each platform's documented player parameters in camelCase: YouTube's [player parameters](https://developers.google.com/youtube/player_parameters) (except the deprecated `modestbranding`) plus `nocookie`, and all 14 TikTok [Embed Player](https://developers.tiktok.com/doc/embed-player) parameters. Booleans become `1`/`0`. Parameters from embed code come first, and props the host passes replace them.
- **Iframe attributes** (`allow`, `referrerpolicy`, `scrolling`, `allowfullscreen`) are copied from each platform's own embed code in `test/fixtures`. Each iframe also gets a `title` for accessibility, because only YouTube's code has one.
- **Facebook video:** the iframe path is an internal component for now; `FacebookEmbed` (Milestone 5) routes video embed code to it.

Verified in the browser on 2026-11-03 with the built package and React:

- `onLoad` fired for YouTube (URL and privacy-enhanced embed code), TikTok and Facebook video, and `onError` fired for an invalid URL.
- The TikTok and Facebook embeds placed below the fold were created only after scrolling.
- At an 800 px viewport the iframes measured YouTube 720×405, TikTok 605×1076 and Facebook 720×404.
- At 375 px every wrapper was 359 px wide with its own ratio, and the page did not scroll sideways.

Component tests run in happy-dom, which never loads iframe pages and logs a `DOMException` ("Iframe page loading is disabled") for each one. The log comes from happy-dom's own console and cannot be silenced short of enabling real network loading.

## Group A components (Milestone 5, 2026-11-03)

### D32. How each platform renders and signals it

Probed in the browser on 2026-11-03 by inserting the markup after the script had loaded, which is the client-navigation case, then calling the platform's init. Signals were read from the scripts themselves.

| Platform  | Init                              | Rendered when                                                                                                                                                                                                    |
| --------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X         | `twttr.widgets.load(container)`   | `twttr.events` fires `rendered` for an element in the container, or an iframe in it gets a style height. `load()` returns a promise, but it resolves (at 436 ms) before the post has painted, so it is not used. |
| Instagram | `instgrm.Embeds.process()`        | the iframe gets class `instagram-media-rendered` (embed.js sets it on the iframe's `MOUNTED` message).                                                                                                           |
| Threads   | `instgrm.Embeds.process()`        | the blockquote is removed from the container (embed.js removes it, by id, once the iframe reports its height).                                                                                                   |
| Facebook  | `FB.XFBML.parse(container, done)` | the parse callback runs; it fired after the iframe was sized and visible.                                                                                                                                        |

**V1 resolved:** Threads' manual initialisation is `instgrm.Embeds.process()`. A Threads blockquote inserted after `embed.js` had loaded was rendered by `process()`: the iframe appeared, reported a height of 239 px at 1.4 s, and the blockquote was removed. `process()` rescans `.text-post-media` blockquotes on every call. Threads processes at most three embeds at a time and retries pending ones after 5 s and 10 s. It reads `data-theme` values `dark` and `auto`.

Threads finds the blockquote to remove through `id`, so the component keeps the embed code's `id="ig-tp-{code}"`.

If a host-loaded Facebook SDK was never initialised, `parse` throws `init not called with valid version`. The driver then calls `FB.init({ xfbml: false, version: 'v26.0' })` and parses again (D26).

### D33. Fluid width (V5) and default maximum widths (V4)

| Platform       | Fluid width                                                                                                                                                                                                                                                                                                                | Default `maxWidth`                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| X              | Built in: the iframe was 550 px in a 700 px box and 360 px in a 360 px box. No attribute needed.                                                                                                                                                                                                                           | 550: publish.x.com oEmbed returns `"width":550`.         |
| Instagram      | Not built in. embed.js copies the blockquote's inline style onto its iframe and gives the iframe only `min-width: 326px`, so without a width it stays 328 px wide in a 500 px box. The component sets the embed code's own `width:calc(100% - 2px)` on the blockquote; `width:100%` overflows by the iframe's 2 px border. | 540: the embed code's `max-width:540px` (D23).           |
| Threads        | Built in: embed.js's iframe style has `width:calc(100% - 2px)` (498 px in a 500 px box).                                                                                                                                                                                                                                   | 658: the embed code's `max-width:658px` (D17).           |
| Facebook post  | Built in when `data-width` is absent (360 px in a 360 px box). A `data-width="500"` post in a 360 px box also rendered 360 px wide, so a width carried over from iframe embed code does no harm.                                                                                                                           | 750: Embedded Posts docs, `data-width` "Max. 750 pixel". |
| Facebook video | Built in (360×203 in a 360 px box).                                                                                                                                                                                                                                                                                        | none: "no limit on the upper end".                       |

Three documented attributes have no prop, because the brief's shared props use their names: X's `data-width` (`width`), and Facebook's `data-width` and `data-lazy` (`width`, `lazy`). Values for them that come from embed code are still written to the markup.

### D34. Placeholder or fallback content

With `html` input that has fallback content, that content is what the user sees until the platform upgrades it, so no placeholder is rendered. This follows §4.3: url input gets "only a placeholder until the embed loads". Url input, and embed code without fallback content (Facebook iframes and SDK snippets without a blockquote), render the placeholder below the platform markup until the post has rendered.

The default skeleton's `minHeight` per platform: X 250, Instagram 540, Threads 240, Facebook post 300, Facebook video 200. Measured so far: a Threads text post at 242 px and a Facebook video at 16:9. The X, Instagram and Facebook-post values are estimates still to be measured in a visible window (D35).

### D35. Lifecycle and verification

- **Write once:** the platform markup is written once with `dangerouslySetInnerHTML` into a container that React never updates. The component is keyed by its markup, so different markup gets a fresh container. `suppressHydrationWarning` covers a host script that upgrades the markup before hydration.
- **Retries (§6.2):** load the script (D27), then render up to three times. Each attempt waits 15 s for the render signal, with 1 s and 2 s between attempts, and `onError` reports the last failure. A signal from an earlier attempt still counts, and `onLoad` fires once.
- **Cleanup:** none of the four platforms offers an API to tear an embed down. Unmounting stops watching (observers, X's event handler, timers), and late signals are ignored. The browser drops the platform's iframe along with the container.
- **Host-built embeds** are checked before use (`verifyEmbed`). The `url` must be one `matchUrl` recognises with the same platform and id, else `onError`. `fallbackHtml` must be exactly what the platform's whitelist rebuilds, else it is dropped. A TikTok URL with an empty user (`/@/video/{id}`, D11) is now a valid URL for this check. After the post-commit security review of Milestone 5, the check also requires a `kind`/`variant` pair the parser produces for that platform, and requires X fallback content to link to the same post, because widgets.js renders the post the blockquote links to. The Facebook video iframe ignores an `href` option, so the verified URL is always the plugin's `href`.

Browser check on 2026-11-03 with the built package and React, in a page that was not on screen:

- The Facebook post, Facebook video from URL, Instagram from URL and Threads all rendered and fired `onLoad`.
- Switching pages A → B → A re-rendered every embed on each mount and added no script tags.
- X and the Instagram post from the maintainer's embed code did not finish rendering: the X iframe stayed 0 px tall, and the Instagram iframe never received `MOUNTED`. Instagram's own unmodified embed code for that post stalled the same way in the same page, so the stall is not caused by the component's markup.

Confirming X and that Instagram post in a visible window is left to the Milestone 7 playground.

## Dispatcher (Milestone 6, 2026-11-03)

### D36. `<SocialEmbed>`

- **Input:** `html` or `url`, as a discriminated union (`{ html; url?: never } | { url; html?: never }`). Passing both, or neither, is a type error, and the tests assert that with `@ts-expect-error`.
- **Routing:** `html` goes through `parseEmbed` and `url` through `matchUrl`; the result goes to the platform component as `embed`. Nothing downstream knows which input was used (§4).
- **`fallback` (§6.4):** when `parseEmbed` returns `null`, `fallback` gets the original string unchanged. `onError` is then not called, because the host has taken the input over. Without `fallback`, nothing is rendered and `onError` reports `social-embeds: unrecognised embed code`.
- **Unsupported URLs** never reach `fallback`, which is defined for embed code: nothing is rendered and `onError` names the URL.
- **Props:** the dispatcher takes the shared props only. `height` reaches only YouTube, TikTok and Facebook, the platforms that can render as an iframe; the other platforms size themselves. Platform options come from the embed code; hosts who want option props use the platform component. Div attributes that share a name with a platform option (`lang`, `color`, `rel`) are not accepted by the dispatcher, because each platform reads that name its own way.
- **Server rendering:** the server HTML of `<SocialEmbed html>` contains the platform blockquote with its whitelisted fallback content, such as the post text and status link, and no script (tested with `renderToString`).

## Open VERIFY items

| ID  | Item                                            | Milestone | Status                                          |
| --- | ----------------------------------------------- | --------- | ----------------------------------------------- |
| V1  | Threads manual initialisation (§3)              | 5         | resolved: `instgrm.Embeds.process()` (D25, D32) |
| V2  | TikTok manual initialisation (§3)               | —         | no longer applies (D11)                         |
| V3  | Facebook post URL shapes the SDK accepts (§4.2) | 2         | resolved (D21)                                  |
| V4  | Default `maxWidth` per platform (§6)            | 4, 5      | resolved (D30, D33)                             |
| V5  | Fluid-width attribute per platform (§6.1)       | 5         | resolved (D33)                                  |
