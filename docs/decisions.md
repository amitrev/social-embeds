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

Resolved in Milestone 8 (D42).

### D9. `CODE_OF_CONDUCT.md` in Milestone 8

§9 lists it, but no milestone did. Added in Milestone 8: Contributor Covenant 3.0, the current version, with the maintainer's address (amitrev@gmail.com) as the reporting contact. Prettier ignores the file so the text stays as published.

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
- **Video iframe** (`plugins/video.php`): kept as an iframe. Every query parameter except `href` stays an option under its own name, and `size` comes from the `width` and `height` attributes. No real video iframe code has been collected yet; the test derives one from the post iframe. (Since D44: real code is collected, and a video iframe that shows the post text renders through the SDK.)
- **SDK snippets** (`fb-post`, `fb-video`): options come from the documented attributes `data-width`, `data-show-text`, `data-lazy`, `data-allowfullscreen`, `data-autoplay` and `data-show-captions`. The fixtures are Meta's own documented snippets ([Embedded Posts](https://developers.facebook.com/docs/plugins/embedded-posts), [Embedded Videos](https://developers.facebook.com/docs/plugins/embedded-video-player)).
- **Locale:** the SDK script URL `connect.facebook.net/{locale}/sdk.js` carries the locale; the parser exposes it as `options.locale`. The `version` in the script URL is not extracted: it is the Graph API version, which the script loader sets (D26).
- **Fallback content:** whitelisted as `div`, `blockquote[cite]`, `a[href]` and `p`. The `class` attribute is kept only when it is exactly `fb-xfbml-parse-ignore`, the marker that tells the SDK not to parse that content.
- **Not accepted:** the inline SDK loader script (`(function(d, s, id){…}(document, 'script', 'facebook-jssdk'))`) that older snippets and the WordPress example use. It is an inline script, so the input is rejected under D14.

### D23. Instagram embed code

From the maintainer's pasted embed code (photo post with caption), 2026-11-03. (Since D48: the fixture is the oEmbed code of a live post, with the same structure.)

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

| Platform                | Aspect without input size  | Default `maxWidth` | Evidence                                                                                      |
| ----------------------- | -------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| YouTube                 | 16:9; 9:16 for Shorts URLs | none               | Player docs give only a minimum: "at least 200px by 200px".                                   |
| TikTok                  | 9:16 (D11)                 | 325                | TikTok's own embed code is 325×578. Was 605, the brief's value; changed in Milestone 7 (D40). |
| Facebook video (iframe) | 16:9                       | none               | Embedded Videos: `data-width` min 220 px, "no limit on the upper end".                        |

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

The default skeleton's `minHeight` per platform: X 250, Instagram 680, Threads 240, Facebook post 300, Facebook video 200. Each is close to the smallest post of that kind, so the skeleton rarely ends taller than the post. Measured in Chrome during Milestone 7 (D37):

- X at 550 px: text post 225, photo posts 528 and 581.
- Instagram: photo post without caption 883 at 540 px and 676 at 375 px, with caption 1205 at 540 px. Instagram was 540 until then; raised to 680 with the maintainer's approval.
- Threads text post: 239 (242 in Milestone 5).
- Facebook post: 725 for a text and photo post at 500 px, the only live sample; Facebook's "no longer available" notice is 202.

### D35. Lifecycle and verification

- **Write once:** the platform markup is written once with `dangerouslySetInnerHTML` into a container that React never updates. The component is keyed by its markup, so different markup gets a fresh container. `suppressHydrationWarning` covers a host script that upgrades the markup before hydration.
- **Retries (§6.2):** load the script (D27), then render up to three times. Each attempt waits 15 s for the render signal, with 1 s and 2 s between attempts, and `onError` reports the last failure. A signal from an earlier attempt still counts, and `onLoad` fires once.
- **Cleanup:** none of the four platforms offers an API to tear an embed down. Unmounting stops watching (observers, X's event handler, timers), and late signals are ignored. The browser drops the platform's iframe along with the container.
- **Host-built embeds** are checked before use (`verifyEmbed`). The `url` must be one `matchUrl` recognises with the same platform and id, else `onError`. `fallbackHtml` must be exactly what the platform's whitelist rebuilds, else it is dropped. A TikTok URL with an empty user (`/@/video/{id}`, D11) is now a valid URL for this check. After the post-commit security review of Milestone 5, the check also requires a `kind`/`variant` pair the parser produces for that platform, and requires X fallback content to link to the same post, because widgets.js renders the post the blockquote links to. The Facebook video iframe ignores an `href` option, so the verified URL is always the plugin's `href`.

Browser check on 2026-11-03 with the built package and React, in a page that was not on screen:

- The Facebook post, Facebook video from URL, Instagram from URL and Threads all rendered and fired `onLoad`.
- Switching pages A → B → A re-rendered every embed on each mount and added no script tags.
- X and the Instagram post from the maintainer's embed code did not finish rendering: the X iframe stayed 0 px tall, and the Instagram iframe never received `MOUNTED`. Instagram's own unmodified embed code for that post stalled the same way in the same page, so the stall is not caused by the component's markup.

Both were checked in a visible window in Milestone 7 (D37). X renders. That Instagram post has been removed, so it never renders anywhere.

## Dispatcher (Milestone 6, 2026-11-03)

### D36. `<SocialEmbed>`

- **Input:** `html` or `url`, as a discriminated union (`{ html; url?: never } | { url; html?: never }`). Passing both, or neither, is a type error, and the tests assert that with `@ts-expect-error`.
- **Routing:** `html` goes through `parseEmbed` and `url` through `matchUrl`; the result goes to the platform component as `embed`. Nothing downstream knows which input was used (§4).
- **`fallback` (§6.4):** when `parseEmbed` returns `null`, `fallback` gets the original string unchanged. `onError` is then not called, because the host has taken the input over. Without `fallback`, nothing is rendered and `onError` reports `social-embeds: unrecognised embed code`.
- **Unsupported URLs** never reach `fallback`, which is defined for embed code: nothing is rendered and `onError` names the URL.
- **Props:** the dispatcher takes the shared props only. `height` reaches only YouTube, TikTok and Facebook, the platforms that can render as an iframe; the other platforms size themselves. Platform options come from the embed code; hosts who want option props use the platform component. Div attributes that share a name with a platform option (`lang`, `color`, `rel`) are not accepted by the dispatcher, because each platform reads that name its own way.
- **Server rendering:** the server HTML of `<SocialEmbed html>` contains the platform blockquote with its whitelisted fallback content, such as the post text and status link, and no script (tested with `renderToString`).

## Playground (Milestone 7, 2026-11-03)

### D37. Playground and browser checks

- **App:** `/playground`, a Next.js 16.4.4 App Router app in the pnpm workspace, private and not published. 16.4.5 was released the same day and was still blocked by pnpm's 24-hour minimum release age. It depends on the package with `workspace:*`, so it uses the built `dist/`; run `pnpm build` at the root first.
- **Pages:** one page per platform at `/x`, `/instagram`, `/threads`, `/facebook`, `/tiktok` and `/youtube`, each showing:
  - the embed codes from `test/fixtures` and two derived variants, a Facebook video iframe and a TikTok blockquote, each with the result of parsing it;
  - post URLs;
  - one embed parsed on the server with `social-embeds/parser` and passed to the platform component as `embed`;
  - a client box for your own embed code or URL, which reports `onLoad`, `onError` and `fallback`.
- **`/many`** has 20 embeds from post URLs. A bar in the layout counts each platform's script on the page and stays mounted during client navigation.
- **RSC boundary:** every page is a Server Component that renders the package's components directly. `next build` pre-renders all pages, which works only through the `'use client'` directive in `dist/index.js`. The server HTML of every page has fallback content or skeletons, no platform scripts and no iframes.
- **Lint and CI:** the root ESLint config still ignores `playground/`, and `next build` type-checks it. CI does not build the playground. (Since D47: it does.)

Browser check in Chrome 156 on 2026-11-03:

- Every platform renders from embed code, from a URL and from a server-parsed `embed`. That includes X with options: dark theme, Spanish, centred and 400 px wide.
- Two sample posts have since been removed. Instagram post `Dc85J9XNoGN`, the maintainer's embed code, gets Instagram's notice that the post "may have been removed", so it never renders. Meta's Embedded Posts sample post shows Facebook's "no longer available" notice. The playground labels both. (Since D48: both are replaced.)
- On `/many`, while scrolling down, each embed loads as it comes near, in page order, and each platform's script loads once.
- Client navigation keeps the same document, adds no script tags, and renders every embed again on each mount.
- The app's built-in browser pane paints only while it is on screen. When hidden, X's iframe never sends its height and IntersectionObserver never fires. Chrome has neither problem.

### D38. Instagram and Threads after the Facebook SDK

Instagram's and Threads' `embed.js` both start with `(window.FB && !window.FB.__buffer) || (function () { … })()`. When the Facebook SDK has loaded first, they do nothing. This was reproduced without React: a plain page that loads the SDK and then Instagram's script gets no `instgrm` global. Loading Instagram first and the SDK second works. In the playground, `/facebook` followed by `/instagram` left Instagram blank. The same happened on `/many`, where a Facebook video comes before the first Instagram post.

The SDK's own stub carries `__buffer` while the SDK loads, and neither script reads `FB` anywhere else. So, with the maintainer's approval, the loader marks a loaded SDK with `__buffer = true` just before adding Instagram's or Threads' script. It removes the mark when the script has run (its `load` event), when it fails, or when it times out. A stub that already has `__buffer` is left alone. Verified in Chrome: with the SDK loaded first, Instagram, Threads and a later `FB.XFBML.parse` all render, and the mark is gone afterwards.

This probably also explains the unexplained first run in D27, where all four scripts loaded at once and Instagram and Threads never initialised.

Not covered: a host page that adds the SDK and then Instagram's script itself. That script has already done nothing by the time an embed mounts, and the loader reports that Instagram did not initialise.

### D39. Platform class added on render

widgets.js scans the whole page for `blockquote.twitter-tweet` when it loads, unless the page has `<meta name="twitter:widgets:autoload" content="off">`. Instagram's and Threads' `embed.js` scan the whole page for `instagram-media` and `text-post-media` when they load and on every `process()` call. Without a change, once a platform's script was on the page, every embed of that platform rendered at once, however far off-screen. `lazy` then delayed only the first script load, and off-screen embeds kept their skeleton under the rendered post until they came near.

With the maintainer's approval, the X, Instagram and Threads components now write their blockquote without its class. The server HTML keeps the blockquote, its attributes and its fallback content. The driver adds the class just before asking the platform to render: before `twttr.widgets.load(container)` or `instgrm.Embeds.process()`. It adds the class only to a blockquote that has none, because Threads swaps its class for `text-post-media-registered` once it takes the blockquote on, and a retry must not add the class back. Host CSS that targets those classes no longer applies to the fallback content before the post renders. This changes D35's write-once rule: the driver now changes the written markup once, by adding the class. Facebook needs no change: the SDK loads with `xfbml=0` and parses only the container it is given.

### D40. TikTok default width

At the default `maxWidth` of 605, the 9:16 player measured 605×1076, taller than a laptop screen. TikTok's own embed code, from oEmbed and from the share dialog, is 325×578. With the maintainer's approval, the default is now 325 (D30).

## Release (Milestone 8, 2026-11-03)

### D41. Changesets did not see the package

`pnpm-workspace.yaml` listed only `playground`, so Changesets, which reads the workspace globs, left out the root package: `changeset status` failed with "Found changeset … for package social-embeds which is not in the workspace". The workspace now lists `.` as well. The lockfile is unchanged, and `pnpm install --frozen-lockfile` still passes.

### D42. Trusted publishing (D8)

- **Workflow:** `release.yml` follows the trusted-publishing workflow from [Changesets' automating guide](https://changesets.dev/guide/automating), with pnpm. It uses the separate `changesets/action` v2 sub-actions (`select-mode`, `version`, `pack`, `publish`), which the action recommends for trusted publishing. v2 targets Changesets v3, the CLI version used here. Only the publish job has `id-token: write`. It runs in the `npm` environment and publishes the tarball that the pack job built and checked. The pack and publish steps were replaced by staged publishing the next day (D43).
- **Who publishes:** in a pnpm workspace, `changeset publish` runs `pnpm publish <tarball> --access public --tag <tag> --no-git-checks --json` (source of `@changesets/cli` 3.0.3). pnpm 12 does the OIDC exchange itself: its binary reads `ACTIONS_ID_TOKEN_REQUEST_URL` and `ACTIONS_ID_TOKEN_REQUEST_TOKEN` and calls npm's `/-/npm/v1/oidc/token/exchange/package/`. No npm CLI version is involved; npm's own requirement (npm 11.5.1, Node 22.14) applies to `npm publish`. Under trusted publishing, pnpm attaches provenance to a public package from a public repository ([pnpm publish](https://pnpm.io/cli/publish)).
- **No silent fallback:** when the exchange fails, pnpm logs `Skipped OIDC: …` and falls back to configured credentials (pnpm 12.12.1 changelog; the message is in the binary). The release jobs have no npm token, and `setup-node` gets no `registry-url`, so there is nothing to fall back to and the publish fails. The setup steps also turn on npm's "Require two-factor authentication and disallow tokens".
- **Before the first publish:** not possible. [`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust) states that the package must already exist on the registry, and the website setting lives in the package's settings. `docs/releasing.md` therefore claims the name with a placeholder `0.0.0` that has only a `package.json`. 0.1.0 is then the first release from the workflow, with provenance, and the placeholder is deprecated.
- **Expiry:** a new trusted publisher must complete a publish within 2 days, or it expires ([npm docs](https://docs.npmjs.com/trusted-publishers), updated 2026-10-06).
- **Allowed actions:** a trusted publisher created after 2026-09-03 allows only `npm stage publish` unless `npm publish` is ticked as well. The first release run failed on 2026-11-04 with `403 … {"error":"OIDC permission denied for this action"}` from a connection without it: the exchange had worked, the publish was refused, and nothing was published. npmjs.com marks ticking `npm publish` as "Not recommended", so the maintainer chose staged publishing instead (D43).
- **First version:** 0.1.0, from a minor changeset (maintainer's choice).
- **Dry run:** `pnpm publish --dry-run` passes. The packed tarball is 26 KB with nine files: `dist/` (`index.js` starting with `"use client"`, `parser.js` without it, their shared chunk and type declarations), `README.md`, `LICENSE.md` and `package.json`.

### D43. Staged publishing

Maintainer decision, 2026-11-04: keep the trusted publisher at npm's default (stage only) and release through [staged publishing](https://docs.npmjs.com/staged-publishing). CI can only stage a version; it goes live when a maintainer approves it on npmjs.com or with `npm stage approve`, which always asks for two-factor authentication. Even a compromised workflow cannot release on its own.

Evidence:

- npm: a trusted publisher always allows `npm stage publish`; tokens from trusted publishing "cannot be used to approve from the stage queue"; and "Provenance is generated for staged packages on parity with direct publishes" (npm maintainer, [GitHub discussion #196675](https://github.com/orgs/community/discussions/196675), 2026-05-22). [`npm stage`](https://docs.npmjs.com/cli/v11/commands/npm-stage) needs npm 11.15.0 or later, and its `--provenance` defaults to off, so the workflow passes it.
- Changesets cannot stage ([changesets/changesets#2025](https://github.com/changesets/changesets/issues/2025), open). `changeset publish` only has `--otp`, `--tag`, `--from-pack-dir` and `--git-tag`.
- `pnpm stage publish` exists, but pnpm's docs do not say whether it uses OIDC. npm documents that its own `npm stage publish` does, so the stage step uses npm. GitHub's Node.js 24.22 ships npm 11.19.1 (nodejs.org release index), so nothing extra is installed. `npm stage publish <tarball> --access public --provenance --json` was dry-run with npm 11.19.1 against the packed 0.1.0 tarball.

The workflow:

- keeps Changesets' `select-mode` and `version` jobs;
- replaces its `pack` with `pnpm pack` plus `actions/upload-artifact`;
- replaces its `publish` with a `stage` job. That job downloads the tarball, runs `npm stage publish`, pushes a `v{version}` tag, creates a draft GitHub release from the `CHANGELOG.md` entry, and writes the stage id and approval steps to the job summary.

npm lists a staged version only once it is approved, so Changesets' `select-mode` keeps reporting `publish` until then. The `v{version}` tag marks a version as staged, and `pack` and `stage` are skipped while it exists. The tag is pushed after staging succeeds, so a failed stage leaves no tag and the next push retries. The workflow runs `bash` with `pipefail`, so a failed `npm stage publish` fails its step even though its output is piped through `tee`.

The new package's `0.0.0-stage` version, created a minute before the maintainer's `0.0.0` placeholder, is npm's placeholder for staged publishing ([staged publishing](https://docs.npmjs.com/staged-publishing)).

### D44. Facebook video iframe that shows the post text renders through the SDK

§5.4 keeps video embed code "as the iframe that came in", because its "aspect ratio is known from `width`/`height`". That holds only without the post text. With "Include full post" ticked, the Embed dialog produces `plugins/video.php?height=476&…&show_text=true&width=267` in a 267×591 iframe (`facebook/video-iframe-reel.html`, the first real video iframe code collected; D22 had none). The player is 267×476 and the other 115 px are for the text, which does not scale with the player. Reported from a host page, where the 267:591 box cut the text off.

Evidence (Chrome, 2026-11-11, the reel of that fixture):

- **Iframe as given**, in a 550 px wide 267:591 box (550×1217): the player takes 550×978 and the row of reactions below the text is cut off.
- **Through the SDK** (`fb-video`, `data-show-text="true"`, no `data-width`): the SDK sized the iframe to its content, with the whole text visible.

  | Box width | SDK iframe | Player (9:16) | Text |
  | --------- | ---------- | ------------- | ---- |
  | 267       | 267×885    | 475           | 410  |
  | 343       | 343×962    | 610           | 352  |
  | 360       | 360×973    | 640           | 333  |
  | 550       | 550×1233   | 978           | 255  |
  | 760       | 760×1548   | 1351          | 197  |

  The text's height is neither a ratio of the width nor a constant, so no CSS box can reserve it. Facebook's own 267×591 iframe leaves 115 px where the text needs 410: the embed code as given is cut off too.

- `show_text=1` shows the text as `true` does; `show_text=0` does not (both loaded as `plugins/video.php` iframes).
- The SDK sends `data-show-text` to the plugin as `show_text`: its iframe's query was `app_id, channel, container_width, href, locale, sdk, show_text`.

The rule: a `plugins/video.php` iframe whose `show_text` is `true` or `1` parses as `variant: 'sdk'` with `showText: true`, for the reason §5.4 gives for posts. `allowfullscreen`, `autoplay` and `show_captions` carry over as the options the SDK reads. `width` and `height` do not go to the SDK, because its video is fluid (D33), as the iframe is (D29); they are kept as the embed's `size` (D45). `t` is dropped: `fb-video` has no attribute for a start time. A video iframe without the text stays an iframe (D22, D29).

The cost: these embeds load the SDK, and their height is known only once it has rendered, so the placeholder is the SDK video's (D34).

### D45. `maxHeight`, and Facebook video embed code without its post text

D44 embeds are tall: the reel of its fixture is 343×962 on a 375 px phone and 550×1233 in a 550 px column. The maintainer found that too tall (2026-11-11). A height limit cannot apply while the text shows, because the text's height is unknown before rendering and grows as the box narrows (D44's table). Facebook offers nothing in between: `data-show-text` is the only documented attribute for the text (D22), and the text is inside a cross-origin iframe.

Maintainer decision, 2026-11-11: add `maxHeight`, and let `showText={false}` render such code as the plain iframe.

- **`maxHeight`** is a prop of the iframe-based embeds, beside `height`. With an aspect ratio, a height limit is a width limit: the wrapper's `max-width` becomes the smaller of `maxWidth` and `floor(maxHeight × width / height)`. Nothing else changes, so there is no layout shift and no new CSS. With a fixed `height`, it is the wrapper's `max-height`. Script-based embeds size themselves, so `<SocialEmbed>` and `FacebookEmbed` keep the prop off their wrappers, as they do `height`.
- **The parser keeps the player's size.** A D44 embed's `size` is the iframe's `width` and `height` parameters (267×476 in the fixture), not its attributes: the attribute height (591) includes the text.
- **`showText={false}`** on `FacebookEmbed`, for a video whose `size` is known, renders `plugins/video.php?href=…&show_text=false&width=…&height=…` in a box of the player's aspect ratio, with `allowfullscreen`, `autoplay` and `show_captions` when set. No SDK. Without a known size (video URLs, `fb-video` snippets) the video stays with the SDK, which then leaves the text out.
- **`variant`** stays `'sdk'` on the parsed embed: it names the path without host props.
- **Not done:** `showText` (true) on video embed code without the text keeps the iframe. `<SocialEmbed>` takes no platform options (D36), so a host that wants this uses `FacebookEmbed`.

Evidence (playground, 2026-11-11), the fixture with `showText={false}` and `maxHeight={640}`:

- Wrapper style `position:relative;width:100%;max-width:358px;aspect-ratio:267 / 476`; 358×638 at an 847 px wide viewport.
- In a 343 px container: 343×611. The iframe loaded, the player filled it and no text showed.
- The same sizes for YouTube Shorts (360 px wide at `maxHeight={640}`) are covered by tests only.

### D46. Instagram's or Threads' script added while the Facebook SDK loads

D38 marks a loaded SDK at the moment embed.js is added. It did not cover an SDK that finishes loading after embed.js was added and before it runs: there is nothing to mark yet, and the script then runs beside a loaded SDK and does nothing. D38's guess about D27's first run was this.

Reported from a host article with Facebook, X and Instagram embeds, all with `lazy` off (2026-11-11). The three scripts were added in the same task. After a client navigation the SDK's two files had loaded at 1709 and 1749 ms and embed.js at 1760 ms; `window.instgrm` never appeared, and no Instagram post rendered. On a direct load with the scripts in the HTTP cache the SDK was first again, with the same result. The loader waited 15 s and reported that Instagram did not initialise.

embed.js (fetched 2026-11-11) still begins with `(window.FB && !window.FB.__buffer) || (function () { … })()`, and it registers while it runs: its last module calls `PolarisEmbedSDKImpl.init()`, which calls `registerEmbedSDK("instagram", …)`. So at its `load` event, no registration beside a loaded SDK means that it skipped itself and changed nothing.

The loader (`skipped` on a `PlatformScript`): when a script's `load` event finds that it skipped itself, its tag is removed and the script is added again. `prepare` runs again and now marks the SDK. At most three tags are added in all, the retry limit of §6.2. Without a loaded SDK, a script that has not registered yet is waited for as before and never added twice.

Verified in Chrome on the playground's `/eager` page (one embed per script-based platform, `lazy` off), reached by client navigation. Instagram's first tag was held back until the SDK had loaded, to force the order. The loader then added the script again while `FB.__buffer === true`; Instagram registered and rendered (iframe `instagram-media-rendered`, 883 px tall), one embed.js tag was left in the page, and the mark was gone. Threads lost the same race on its own in that run and recovered the same way.

Still not covered, as in D38: a host page that adds the SDK and then Instagram's script itself.

### D47. CI builds the playground

D37 left the playground out of CI, so a change that broke the package in Next.js showed only when someone built or ran the playground by hand. The CI job now runs `pnpm --dir playground build` after the package's own checks, on Node 22, 24 and 26. `next build` type-checks every page against the built `dist/` and pre-renders all of them, which takes the `'use client'` directive and a server render of every sample (D37).

Checked on 2026-11-11: the build passes in about 5 s, and it fails when `'use client'` is removed from `src/index.ts` before the package is built.

### D48. Sample posts replaced

Instagram post `Dc85J9XNoGN` is gone (D37): `instagram.com/api/v1/oembed/` answers 404 for it. `instagram/post-captioned.html` is now the embed code of `https://www.instagram.com/p/DfPQchkG1tg/`, a captioned post of the `instagram` account that was already the playground's URL sample.

- **Source:** `https://www.instagram.com/api/v1/oembed/?url=…&maxwidth=540`, the `html` field, fetched on 2026-11-11 without a login or a token.
- **Same code as the Embed dialog's:** apart from the post code and the "A post shared by …" text, every element, attribute and inline style is the one in the code it replaces (D23), including `data-instgrm-captioned`, `data-instgrm-version="14"` and the protocol-relative script. Without `maxwidth` the inline style says `max-width:658px`; with 540 it says `max-width:540px`, as the Embed dialog code did.
- The `html` field ends after the script tag, without a newline.

Facebook: Meta's Embedded Posts documentation still shows its removed sample post (checked 2026-11-11), so `facebook/post-sdk-docs.html` stays as documented and remains a parser fixture. In the playground, that snippet now carries the maintainer's post from `facebook/post-iframe.html`, which `plugins/post.php` still renders, and the post URL sample and `/many` use the same post. The Instagram URL samples are the post above and a reel, `DfQCqMnhpsG`.

No removed post is left among the playground samples. The box for your own input still shows what a removed post does.

Checked in Chrome on 2026-11-11, in a visible window:

- `/instagram`: the new embed code rendered at 540 px wide and 1205 px tall, with its caption; the post and the reel from their URLs rendered 883 px tall. One `embed.js` tag.
- `/facebook`: the SDK snippet with the live post rendered 500×725, not the 202 px notice (D34); the post from its URL rendered 552×706.
- `/many`: both Facebook posts rendered, no skeleton was left after scrolling to the end, and each platform's script was on the page once.

## Wave 2 research (Milestone 1, 2026-11-18)

The VERIFY items of [wave-2-brief.md](./wave-2-brief.md), checked on 2026-11-18. The probes were static pages on `localhost:4173` that load each platform's iframe or script, with a `message` listener logging what the iframes post. The built-in browser pane refuses reddit.com and, after a few loads, stopped loading `embed.reddit.com` frames, so the Reddit and LinkedIn probes ran in Chrome.

### D49. Telegram: own iframe, height from `resize` messages

- **Embed code** (`telegram/widget-configurator*.html`): the configurator at `core.telegram.org/widgets/post` writes `<script async src="https://telegram.org/js/telegram-widget.js?24" data-telegram-post="telegram/83" data-width="100%">`. Its options add `data-userpic="false"`, `data-color="E22F38"`, `data-dark="1"` and, with a colour and dark together, `data-dark-color="F95C54"`. No blockquote form came out of it.
- **No handshake:** an iframe of `https://t.me/telegram/83?embed=1`, added without Telegram's script, posted `{"event":"resize","height":540}` and `{"event":"ready"}` from `https://t.me` about 90 ms after loading. At 360 px wide with the options it posted 443. The frame's `widget-frame.js` runs `initWidgetFrame({ auto_height: true })`, which checks the body's height every animation frame and posts `resize` whenever it changes, to any origin. The parent's `visible` and `focus` messages only start animations and are not needed.
- **Width:** `widget-frame.css` gives `body.body_widget_post` `min-width: 300px; max-width: 500px`, so the default `maxWidth` is 500.

### D50. Snapchat: every embeddable type is an iframe at `{url}/embed`

- **Embed code** (`snapchat/profile-share.html`, `snapchat/lens-share.html`): the Embed button on a profile (`/@teamsnapchat`) and on a Lens (`/lens/61141491143`, whose canonical id is `9c4b773c46ca43acba564858059f7d7a`) write the same markup. A `blockquote.snapchat-embed` with `data-snapchat-embed-width="416"`, `data-snapchat-embed-height="692"`, `data-snapchat-embed-url="{canonical url}/embed"`, `data-snapchat-embed-style="border-radius: 40px;"` and a title. Then an inline style (`height:650px; max-width:416px; min-width:326px` among others), two links to the canonical URL and "View more on Snapchat", then `embed.js`.
- **No Spotlight fixture:** on a Spotlight video, Share → Embed opens a "Spotlight is even better on your phone" app prompt instead of the code, at both 800 and 1400 px wide. Spotlight embed code is built from the shape above.
- **What renders** (416×692 iframes with the script's `allow`, `allowfullscreen` and `scrolling="no"`):

  | URL                                       | `/embed` result                            |
  | ----------------------------------------- | ------------------------------------------ |
  | `/spotlight/{id}`                         | renders                                    |
  | `/@{user}/spotlight/{id}`                 | renders (`/spotlight/{id}` redirects here) |
  | `/@{user}`                                | renders; has a Stories tab                 |
  | `/add/{user}`                             | 308 to `/@{user}/embed`, renders           |
  | `/lens/{hex id}`, `/lens/{numeric id}`    | renders                                    |
  | `/@{user}/highlight/{uuid}` (saved story) | renders                                    |
  | `/@{user}/{story id}` (one public story)  | 404                                        |
  | `/p/{uuid}` (publisher story)             | 400                                        |

  Public stories therefore embed only inside the profile embed. No `/embed` page posts any message, so all use a fixed aspect ratio, 416:692.

- **Headers:** every `/embed` page sends `Content-Security-Policy: frame-ancestors *`. A Lens also sends `X-Frame-Options: DENY`, which browsers ignore when `frame-ancestors` is present, and it rendered.

### D51. Pinterest: two kinds of embed code; both render through the widget

- **Widget code** (`pinterest/widget-docs.html`): `<a href="https://www.pinterest.com/pin/{id}/" data-pin-do="embedPin">` and `pinit.js`, assembled from the two snippets of Pinterest's [widgets](https://developers.pinterest.com/docs/web-features/widgets/) and [add-ons](https://developers.pinterest.com/docs/web-features/add-ons-overview/) docs. The widget builder now redirects to the docs.
- **oEmbed code** (`pinterest/oembed-iframe.html`): `pinterest.com/oembed.json` returns `<iframe src="https://assets.pinterest.com/ext/embed.html?id={id}&src=oembed" height="436" width="450" frameborder="0" scrolling="no">`. Rendered, it shows a pin card about 360 px wide inside the fixed 450×436 frame and posts no message: the height fits one width only, like Facebook's `plugins/post.php` (§5.4). The endpoint is listed on [oembed.com](https://oembed.com/providers.json) (scheme `https://www.pinterest.com/*`, discovery on), but Pinterest's developer docs mention neither it nor `ext/embed.html`; the widget is the only documented embed.
- **The widget** (`pinit_main.js` loaded directly):
  - `window.PinUtils` has `build`.
  - On load it builds every anchor with `data-pin-do` on the page, and leaves an anchor without the attribute alone.
  - `PinUtils.build(element)` builds only that subtree: an anchor with `data-pin-do` outside it stayed an anchor.
  - The pin is drawn into the page, not an iframe: the anchor becomes `span.PIN_{n}_embed_pin` with `data-pin-id`, whose height follows its content.
  - Widths: 236 by default and for `small`, 345 for `medium`, 600 for `large`.
- **Maintainer decision, 2026-11-18:** oEmbed iframe code renders through the widget, as Facebook post iframes do through the SDK. Both inputs then share one path, the D39 pattern (anchor written without `data-pin-do`, added before `build`), and one ready signal (the anchor replaced by `span[data-pin-id]`).

### D52. Reddit: own iframe, no `embed_host_url`, height from `resize.embed`

- **Embed code** (`reddit/post-share.html`, `reddit/comment-share.html`, pasted by the maintainer from Share → Embed):
  - **Post:** `blockquote.reddit-embed-bq` with `style="height:316px"` and `data-embed-height="316"`, links to the post, its author and the subreddit, then `widgets.js`.
  - **Comment:** the link is `/r/{sub}/comments/{postId}/comment/{commentId}/` (not `…/{slug}/{commentId}/`), with `data-embed-height="240"` and no inline style.
- **What `widgets.js` builds** (probe with the pasted code):
  - **Post `src`:** `https://embed.reddit.com/r/bulgaria/comments/1xz8iq4/{slug}/?embed=true&ref_source=embed&ref=share&utm_medium=widgets&utm_source=embedv2&utm_term=23&utm_name=post_embed&embed_host_url={page}`.
  - **Comment `src`:** the same, with `showmedia=false&showmore=false&depth=1&utm_name=comment_embed`.
  - **Attributes:** `width="640px"`, `sandbox="allow-scripts allow-same-origin allow-popups"`, `allow="clipboard-read; clipboard-write"`.
  - **Height:** each frame posted `{"type":"resize.embed","data":316}` (comment: 220) from `https://embed.reddit.com`.
- **Without the script** (own iframes, Chrome): `?embed=true` alone, no query at all, no slug, `theme=dark`, 340 px wide, and both comment queries all rendered and posted `resize.embed`. **`embed_host_url` is not needed**, so the package does not send it (brief §2.4).
- In Chrome the post title rendered in English, a machine translation of the Bulgarian original. `data-embed-locale` is the attribute that sets it.
- Older comment permalinks (`/comments/{postId}/{slug}/{commentId}/`) returned an `embed.reddit.com` page of the same size as the `comment/` form (337938 and 337949 bytes). Weak evidence that both work; the parser accepts both.

### D53. LinkedIn: fixed iframe, activity URNs embed, consent banner inside

- **Embed code** (`linkedin/post-collapsed.html`, `linkedin/post-full.html`, pasted by the maintainer): `<iframe src="https://www.linkedin.com/embed/feed/update/urn:li:share:{id}[?collapsed=1]" height width="504" frameborder="0" allowfullscreen="" title="Embedded post">`. The dialog's "less text" option adds `?collapsed=1` (height 670 for an image post); the full post was 879.
- **No height messages:** no frame posted anything in 8 s. Content taller than the frame scrolls inside it (a scrollbar shows), at 504 and at 340 px, where the text reflows taller.
- **Activity URNs:** each embed page names its post's activity URN (`urn:li:activity:7527261038006697984` for share `7527261037016817664`). `/embed/feed/update/urn:li:activity:{id}` renders the same post, so post URLs (`/posts/{slug}-activity-{id}-…`) map to it. A share id under `ugcPost` is a 404.
- **Consent banner:** from Bulgaria, every frame opens with "LinkedIn respects your privacy" and Accept/Reject buttons, about 210 px tall, over the top of the post until the visitor answers. Not ours to hide; the README states it.
- **Headers:** `frame-ancestors *`.
- **Default height: 670** (maintainer decision, 2026-11-18), LinkedIn's own height for the collapsed image post. Two samples (670 collapsed, 879 full) were too few for the brief's measurement. A taller post scrolls inside the frame; a shorter one leaves space below it.

## Wave 2 parser (Milestone 2, 2026-11-18)

### D54. What the parser returns for the wave 2 platforms

| Platform  | `kind` / `variant`                                   | `id`                                              | Canonical `url`                                                                 |
| --------- | ---------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| Telegram  | post / iframe                                        | `{channel}/{post}`                                | `https://t.me/{channel}/{post}`                                                 |
| Snapchat  | video / iframe (Spotlight), post / iframe (the rest) | Spotlight id, username, Lens id or highlight uuid | `https://www.snapchat.com/…` without `/embed`; `/add/{user}` becomes `/@{user}` |
| LinkedIn  | post / iframe                                        | the URN, `urn:li:{activity\|share\|ugcPost}:{id}` | `https://www.linkedin.com/feed/update/{urn}/`                                   |
| Reddit    | post / iframe (posts and comments)                   | post id, or comment id                            | `…/r/{sub}/comments/{post}/`, or `…/comment/{comment}/`, without the title slug |
| Pinterest | post / sdk                                           | pin id                                            | `https://www.pinterest.com/pin/{id}/`                                           |

- **Telegram's embed code is a single `<script>`.** D14 requires one embed element beside the scripts; `parseEmbed` now also accepts exactly one script with no content when a platform reads it as its embed (`parseScript`). Only Telegram does. The script must carry `data-telegram-post` and none of the login, discussion or share attributes.
- **Options** follow D18's naming: Telegram's `data-dark-color` is `darkColor`, `data-single` (read by presence) is `single: true`; Reddit's `data-embed-*` keep their names after the prefix (`showmedia`, `locale`); Snapchat's `data-snapchat-embed-title` is `title`; Pinterest's `data-pin-width` is `width`. LinkedIn's iframe query is kept as given (`collapsed: 1`).
- **Sizes:** Snapchat's `data-snapchat-embed-width`/`height` and LinkedIn's iframe attributes are `size`. Reddit's `data-embed-height` is `size.height`: the starting height until the frame reports its own.
- **Snapchat links:** every link inside the blockquote must name the content of `data-snapchat-embed-url`, else `null`. Its inline `style` and `data-snapchat-embed-style` are ignored.
- **No `fallbackHtml`** for any of the five (brief §2).

## Message-sized iframes (Milestone 3, 2026-11-18)

### D55. `IframeEmbed` takes its height from the frame's messages

Telegram and Reddit frames post their own height (D49, D52); LinkedIn's do not (D53). `IframeEmbed` gains a third sizing mode beside the aspect ratio (D29) and a fixed `height`: a `messageHeight` of `{ origin, read }`.

- **Layout:** the wrapper has `width` and `maxWidth` and a `height` of `startHeight` until the first height arrives, then that height. No aspect ratio, and `height`/`maxHeight` do not apply.
- **Accepted messages:** only from `iframe.contentWindow` and only from `origin`. `read(event.data)` returns the height or `undefined`; if it throws, the message is ignored. Heights outside 1–50,000 px are ignored; others are rounded up.
- **Rendered:** the first accepted height removes the placeholder and calls `onLoad`, once. The iframe's `load` event does not count, because the frame loads before its post has a height.
- **Timeout:** if no height arrives within 15 s of the iframe being created, the placeholder is removed, the frame shows at `startHeight`, and `onError` is called. There is no retry, unlike the script loader (§6.2): reloading the same iframe would load the same page. The brief (§3.2) assumed the retry would apply.
- **Unmount** removes the listener and the timer.

Tests fake the messages (`test/components/iframe-embed.test.tsx`), including the wrong origin, the wrong window, data that is not JSON, and absurd heights. Checked in Chrome with the Telegram and Reddit components (D56).

## Wave 2 iframe components (Milestone 4, 2026-11-18)

### D56. `TelegramEmbed`, `RedditEmbed`, `SnapchatEmbed`, `LinkedInEmbed`

| Component       | `src`                                                | Size                                                                           | Default `maxWidth`         | Option props                                                         |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------- |
| `TelegramEmbed` | `https://t.me/{post}?embed=1&…`                      | messages from `https://t.me`, starts at 300                                    | 500                        | `userpic`, `color`, `dark`, `darkColor`                              |
| `RedditEmbed`   | `https://embed.reddit.com{path}?embed=true&…`        | messages from `https://embed.reddit.com`, starts at `data-embed-height` or 316 | 640                        | `theme`, `showMedia`, `showTitle`, `showUsername`, `locale`, `depth` |
| `SnapchatEmbed` | `{url}/embed`                                        | aspect ratio, embed code size or 416:692                                       | 416                        | none                                                                 |
| `LinkedInEmbed` | `https://www.linkedin.com/embed/feed/update/{urn}?…` | fixed: `height`, else embed code height, else 670                              | embed code width, else 504 | `collapsed`                                                          |

- **Query values as each platform's script writes them:** Telegram's options go in its script's order, `userpic` as `true`/`false`, other booleans as `1`/`0`, and `single` only when set. Reddit's booleans stay `true`/`false`. Embed code options come first and props replace them.
- **Attributes copied from each script:** Reddit's `sandbox` and `allow`, Snapchat's `allow` (Lenses use the camera), `scrolling="no"` for Telegram, Reddit and Snapchat. `IframeEmbed` gains `sandbox`.
- **Titles:** "Telegram post", "Reddit post", "LinkedIn post"; Snapchat uses the embed code's `data-snapchat-embed-title`, else "Snapchat".
- **`height`/`maxHeight`** are not props of `TelegramEmbed` and `RedditEmbed`, which size themselves.

Checked in Chrome on 2026-11-18 on a temporary playground page, one embed of each kind from its URL with `lazy` on, scrolled into view in turn. All eight called `onLoad`, and no placeholder was left:

- Telegram at 500 px became 384 px tall; at 360 px with dark theme, a red accent and no author photo it became 443 px. The whole post showed, with no scrollbar.
- Reddit: the post 640×316, the comment in dark theme 640×220.
- Snapchat: the profile and the Spotlight video at 416×692.
- LinkedIn: share and activity URNs (`collapsed`) at 504×670.

### D57. `verifyEmbed` requires the canonical URL

A post-commit security review of Milestone 4 found that `RedditEmbed` built its iframe `src` by cutting a fixed-length `https://www.reddit.com` off `embed.url`. `verifyEmbed` checked only that `matchUrl(embed.url)` gave the same platform and id, so a host-built embed with `url: 'https://reddit.com/r/ab/comments/1xz8iq4/'` passed. The cut then left `b/comments/…`, and the iframe loaded `https://embed.reddit.comb/comments/…`, a host the package never meant to frame. `TelegramEmbed` and `SnapchatEmbed` also build `src` from the URL, where a query or fragment would have reached the iframe.

The fix: `verifyEmbed` also requires `matchUrl(embed.url).url === embed.url`, for every platform. The parser and `matchUrl` already write the canonical form for every fixture (checked for all 27 on 2026-11-18), so only hand-built embeds with another URL form are now rejected, with `onError`. Tests: a `twitter.com` URL for an X post, the Reddit URL above, and a Telegram URL with a query and fragment are all rejected, and `RedditEmbed` with that URL renders no iframe.

## Pinterest widget (Milestone 5, 2026-11-18)

### D58. `PinterestEmbed` drives the widget per pin

- **Script:** the loader adds `https://assets.pinterest.com/js/pinit_main.js` itself, not `pinit.js`, which only adds `pinit_main.js` with a random query (D51). A host's own `pinit.js` or `pinit_main.js` is recognised, and the loader waits for its `PinUtils` instead of adding a second script. Ready means `PinUtils.build` is a function.
- **Markup:** `<a href="{canonical pin url}">` with `data-pin-width`, `data-pin-lang` and `data-pin-terse` from the embed code, and no `data-pin-do`.
- **Render:** the driver adds `data-pin-do="embedPin"` to the link, then calls `PinUtils.build(container)`. This is the D39 pattern: `pinit_main.js` builds every link with that attribute on the page when it loads. The pin has rendered when `span[data-pin-id]` appears in the container. Without `PinUtils.build` the driver throws, and the embed retries (§6.2).
- **Width:** the pin has a fixed width per `data-pin-width`, and the default `maxWidth` is that width: 236 (default and `small`), 345 (`medium`), 600 (`large`). The prop is `pinWidth`, because `width` is the wrapper's (D33). The skeleton is 270 px tall, close to a landscape pin at 236 px.
- **No fallback content:** the embed code's link has no text.

Checked in Chrome on 2026-11-18, on a temporary playground page with three pins from their URLs (default, `large`, and `medium` 3000 px below), `lazy` on:

- The two pins in view rendered at 236×278 and 600×550 and called `onLoad`.
- The third stayed an unbuilt link with its skeleton until it was scrolled near, then rendered at 345×360.
- `pinit_main.js` was on the page once.

## Wave 2 dispatcher and playground (Milestone 6, 2026-11-18)

### D59. `<SocialEmbed>` routes the wave 2 platforms

- **Routing:** `telegram`, `snapchat`, `linkedin`, `reddit` and `pinterest` go to their components. `height` and `maxHeight` reach Snapchat and LinkedIn, the fixed-size iframes, and not Telegram, Reddit or Pinterest, which size themselves (D36 still holds: no platform options on the dispatcher).
- **Props left off the dispatcher:** the new option names (`userpic`, `dark`, `darkColor`, `theme`, `showMedia`, `showTitle`, `showUsername`, `depth`, `collapsed`, `pinWidth`) join the D36 list. `color` and `locale` were already there.
- **Playground:**
  - One page per new platform, with every fixture, the URL samples, and an embed parsed on the server. The Snapchat Spotlight and Pinterest docs codes are derived (D50, D51).
  - `/many` has 8 more embeds before the X posts, so X still loads last.
  - `/eager` adds a Pinterest pin.
  - The script bar counts Pinterest.

Checked in Chrome on 2026-11-18, `next build` passing first:

- **Client navigation:** from the home page through `/telegram`, `/reddit`, `/snapchat`, `/linkedin` and `/pinterest`, with every article scrolled into view, the same document stayed loaded.
  - All 20 embeds rendered with no skeleton left: Telegram 500 px wide at 384, 367 and 622 px tall; Reddit 640×316 and 640×220; Snapchat 416×692; LinkedIn 504×879 and 504×670; Pinterest 236×278.
  - `pinit_main.js` was added once and kept across navigation.
- **`/many` and `/eager`:** both rendered every embed, loaded directly and reached by client navigation. Each script was on the page once.
- **Not reproduced:** on the first run of `/many` after that tour, five Instagram and Threads embeds kept their skeletons, and Threads' script was never added. That run overlapped a script of mine that froze the tab for 45 s. Three later runs passed: the same tour, `/pinterest` then `/many`, and `/many` loaded directly. The cause was not found.
- **Investigated on 2026-11-19, not reproduced:** five more runs in Chrome, on temporary pages that logged every script tag added, loaded, failed or removed, and every `onLoad` and `onError`. All embeds rendered every time.
  - `/many` loaded directly and scrolled at 200 ms per embed.
  - The first run's two tours of the new pages, then client navigation to the page, from a fresh document.
  - The same with every script already on the page.
  - Instagram, Threads and Facebook embeds mounted with `lazy` off while the tab was hidden: all five rendered within 0.8 s, still hidden.

  In one run Instagram's script skipped itself beside the loading SDK and was added again, as D46 designed. The loader removes a tag only after the browser reports that it failed to load, or after it skipped itself (D46), and a skipped tag is added again. So the first run's missing Threads tag means `threads.com/embed.js` failed three times in a row, or no Threads embed came near the viewport. With Instagram's posts not rendering in the same run, this points to Meta's servers not answering that browser for a while, not to the package; that stays unproven. Forcing `threads.com/embed.js` to fail on `/many` gives the same picture: the Threads embed keeps its skeleton, the bar counts Threads 0, and after the retries `onError` reports `social-embeds: could not load https://www.threads.com/embed.js`. `/many` now shows each embed's `onError` message under it, so a repeat names its cause.

## Wave 3 research (Milestone 1, 2026-11-19)

The VERIFY items of [wave-3-brief.md](./wave-3-brief.md). Frames were probed in Chrome on a static page on `localhost:4173` with a `message` listener, as in wave 2.

### D60. Spotify: fixed-height iframe, video shows at 16:9

- **Embed code** (`spotify/oembed-*.html`, from `open.spotify.com/oembed?url=…`): `<iframe style="border-radius: 12px" width="100%" height="…" title="Spotify Embed: …" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" src="https://open.spotify.com/embed/{type}/{id}?utm_source=oembed">`.
- **Heights by type:** track 152, episode 152, album 352, artist 352, playlist 352, all `width="100%"`. An audiobook's oEmbed failed (the id tried may not exist). These are the defaults for URL input (maintainer decision, brief §2.1).
- **A video show** (`show/4rOoJ6Egrf8K2IrywzwOMk`) comes back as `/embed/show/{id}/video` at `width="624" height="351"`: a 16:9 player, so it renders with that aspect ratio, not a fixed height. Its title names the latest episode.
- **No height messages:** every Spotify frame posted only `{"type":"ready"}` from `https://open.spotify.com`.
- **Not seen:** the Embed dialog itself (it needs a signed-in account); `theme=0` loaded without error.

### D61. Vimeo: aspect ratio from `width`/`height` or from the wrapper's padding

- **oEmbed code** (`vimeo/oembed.html`): `<iframe src="https://player.vimeo.com/video/76979871?app_id=122963" width="480" height="270" … referrerpolicy="strict-origin-when-cross-origin" title="…">`. The frame posted `{"event":"ready"}` from `https://player.vimeo.com` and no height.
- **Responsive code** (`vimeo/responsive-docs.html`), from [Vimeo's help center](https://help.vimeo.com/hc/en-us/articles/12426486963857): `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/{id}?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="…" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="…"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>`.
  - The help page's own example appends autoplay parameters with a second `?`, a malformed URL. The fixture drops them; it is derived.
  - The iframe has **no `width` or `height`**: the video's ratio is only in the wrapper's top padding (56.25% is 16:9). The parser reads that percentage as the aspect ratio, and accepts exactly this wrapper and `player.js` (maintainer decision, brief §2.2).
- **Not seen:** the Share → Embed dialog, which logged-out visitors do not get on vimeo.com.

### D62. Twitch: `parent` must be the page's host

- **Embed code** (`twitch/docs-*.html`): the channel, VOD and collection examples of [Twitch's embed docs](https://dev.twitch.tv/docs/embed/video-and-clips/), with `parent=streamernews.example.com`.
- **On `localhost`:**
  - `parent=localhost` played: the frame posted `UPDATE_STATE`, `video.ready`, `ready` and, for an offline channel, `offline` events from `https://player.twitch.tv`.
  - With `parent=example.com`, or no `parent`, the frame loaded and posted nothing.
- **So** the package drops every `parent` from the input and sets `parent={location.hostname}` (brief §2.3).
- **Not checked:** a host on plain HTTP other than `localhost`, and subdomains.

### D63. Dailymotion: every embed needs a Player ID

- **oEmbed code** (`dailymotion/oembed.html`): `<iframe frameborder="0" width="480" height="269" src="https://geo.dailymotion.com/player.html?video=xbxskia&" allowfullscreen allow="autoplay; fullscreen; picture-in-picture; web-share">`. The size is the video's own ratio (a vertical video gave 480×847).
- **That URL returns 403 `Forbidden`**, in Chrome and with curl, for every video tried and with any referrer. `www.dailymotion.com/embed/video/{id}` redirects (301) to it.
- **Dailymotion's [migration guide](https://developers.dailymotion.com/reference/migration-guide-new-embed-endpoint):** every embed needs a Player ID, created in the publisher's Dailymotion Studio. URLs without one may be rejected with 403. The legacy endpoint has been retired step by step since 2024-09-16.
- `geo.dailymotion.com/player/{playerId}.html?video={id}` returned 200; dailymotion.com itself uses its own player `xtv3w`.
- **Consequences:**
  - Embed code from a publisher's Studio carries the Player ID and can render.
  - Dailymotion's own oEmbed code and every URL have none.
  - The package must not borrow another account's Player ID.
- **Maintainer decision, 2026-11-19: Player ID only.**
  - Embed code whose iframe carries a Player ID (`geo.dailymotion.com/player/{playerId}.html?video={id}`) renders as given.
  - Embed code without one, Dailymotion's oEmbed code included, and every URL render only when the host passes its own `playerId` prop; otherwise `onError`.
  - The package never uses a Player ID the host did not give it.
- **Documented snippet** (`dailymotion/player-id-docs.html`, from [Dailymotion's iframe docs](https://developers.dailymotion.com/docs/iframe-web)): a `div` with `position:relative;padding-bottom:56.25%;height:0;overflow:hidden;` around the iframe, whose `width` and `height` are `100%`. As with Vimeo (D61), the ratio is only in the wrapper's padding, and the wrapper is accepted as Dailymotion's own.
- **Playlists** (`?playlist={id}`, alone or after a video) are left out of wave 3.

## Wave 3 parser (Milestone 2, 2026-11-19)

### D64. What the parser returns for the wave 3 platforms

| Platform    | `kind` / `variant`                                 | `id`                                                              | Canonical `url`                                                                                            |
| ----------- | -------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Spotify     | post / iframe; video / iframe for `/embed/…/video` | the 22-character id                                               | `https://open.spotify.com/{type}/{id}`                                                                     |
| Vimeo       | video / iframe                                     | the video number                                                  | `https://vimeo.com/{id}`, or `https://vimeo.com/{id}/{hash}` for an unlisted video                         |
| Twitch      | video / iframe                                     | channel name (lower case), VOD number, collection id or clip slug | `https://www.twitch.tv/{channel}`, `…/videos/{id}`, `…/collections/{id}`, `https://clips.twitch.tv/{slug}` |
| Dailymotion | video / iframe                                     | the video id (`x…`)                                               | `https://www.dailymotion.com/video/{id}`                                                                   |

- **Platform wrappers (D14 extended):** Vimeo's and Dailymotion's documented responsive snippets are accepted. The wrapper `div` must have only a `style` attribute, in exactly the form each platform writes (`padding:{n}% 0 0 0;position:relative;` for Vimeo, `position:relative;padding-bottom:{n}%;height:0;overflow:hidden;` for Dailymotion), around exactly one iframe. Anything else around the iframe is still rejected.
- **Ratio from padding:** the wrapper's percentage becomes `size`, reduced to the smallest whole numbers: 56.25% is `{ width: 16, height: 9 }`, 177.78% is `{ width: 5000, height: 8889 }`. For these two platforms `size` is then a ratio, not pixels; the components use it as an aspect ratio either way.
- **Fragments:** `parseUrl` now also returns the fragment, for Vimeo's `#t=` start time, kept as the `t` option.
- **Options dropped as tracking or ids:** Spotify `utm_source` and `si`; Vimeo `h` (kept in the URL instead), `app_id`, `player_id`; Twitch every `parent` (D62). Twitch keeps only `autoplay`, `muted` and `time`.
- **Twitch's precedence** follows its player: `channel`, then `video`, then `collection`. A `twitch.tv/{name}` URL is a channel unless the name is one of Twitch's own top-level pages (`directory`, `videos`, `settings`, …).
- **Spotify URLs** render the audio player: a page URL cannot tell a video show from an audio one. Only embed code with `/video` is a `video`.
- **Dailymotion:** a Player ID in the iframe (`/player/{id}.html`) becomes the `playerId` option; `player.html` and `www.dailymotion.com/embed/video/{id}` parse without one (D63). Playlists return `null`.

## Twitch's parent (Milestone 3, 2026-11-19)

### D65. `IframeEmbed` adds the page's host to the `src`

Twitch plays only when `parent` names the page's host (D62), which is not known on the server. `IframeEmbed` gains `hostParam`: when it creates the iframe, it appends `{hostParam}={location.hostname}` to the `src` (`&`, or `?` when the `src` has no query). The iframe is never in the server HTML (D28), so the host is read only in the browser, and the server and client renders still match. Only `TwitchEmbed` uses it.

Not covered: a page that is itself framed by another site. Twitch then needs that site's host as a second `parent`, which the package cannot know; a host page in that situation passes Twitch's embed code through `fallback`.

Tests: the parameter is added with `&` and with `?`, and the server HTML has no iframe. Checked in a browser with `TwitchEmbed` (D66).

## Wave 3 components (Milestone 4, 2026-11-19)

### D66. `SpotifyEmbed`, `VimeoEmbed`, `TwitchEmbed` and `DailymotionEmbed`

All four are `IframeEmbed`s. Each takes the platform's own player parameters as props; a prop replaces the same option from the embed code.

- **Spotify:** a fixed height, as LinkedIn (D53): the `height` prop, else the embed code's, else 152px for a track or episode and 352px for the rest (D60). Chapters and audiobooks get 352px until their oEmbed height is measured. A video show (`/embed/show/{id}/video`) keeps its aspect ratio instead. The wrapper gets Spotify's `border-radius: 12px` with `overflow: hidden`; the `style` prop replaces it. Option: `theme` (`0` for the dark player).
- **Vimeo:** 16:9, or the embed code's ratio. An unlisted video's hash goes back in as `h`, and the start time as `#t=` (prop `t`). Booleans become `1`/`0`. `player.js` is not loaded: the package sizes the frame itself.
- **Twitch:** 16:9, or the embed code's ratio, with `hostParam="parent"` (D65). `autoplay` and `muted` are sent as `true`/`false`, which is what Twitch reads; `time` as given. No `allow` list, as in Twitch's own code.
- **Dailymotion:** the Player ID is the `playerId` prop, else the embed code's (D63). With neither, or with one that is not `x` and 3 to 12 lowercase letters or digits, the component renders nothing and calls `onError`; the check also keeps the id from changing the iframe path. The `src` is always `geo.dailymotion.com/player/{playerId}.html?video={id}`. Options: `mute`, `startTime`, `loop`.

**Browser check** (Chrome, playground dev server on `localhost`, 2026-11-19):

- Spotify track 152px and playlist 352px high, both rounded; `theme=0` gave the dark player. Vimeo played at 16:9.
- Twitch: the iframe got `parent=localhost`, and the channel and VOD frames posted `UPDATE_STATE` events, which they do only for an accepted `parent` (D62). The channel showed its offline screen. The docs' VOD (`v40464143`) showed Twitch's "Failed to determine content classification" notice, a property of that old video.
- Dailymotion: `geo.dailymotion.com/player/x8lr5.html?video=x84sh87&mute=true` returned 200 and loaded the player, which then showed "Playback error". The same URL opened on its own showed the same error, so it comes from the docs' sample player and video, not from the component. A publisher's own Player ID and video are still to be tried.
- Without a Player ID, `onError` got the expected message and nothing rendered. In development it was called twice: React's Strict Mode runs effects twice.
- Every `onLoad` fired.

## Wave 3 dispatcher and playground (Milestone 5, 2026-11-19)

### D67. `<SocialEmbed>` routes the wave 3 platforms

- **Routing:** `spotify`, `vimeo`, `twitch` and `dailymotion` go to their components. All four are iframes, so `height` and `maxHeight` reach them.
- **No Player ID on the dispatcher** (maintainer decision, 2026-11-19): D36 holds, and `<SocialEmbed>` takes no `playerId`. It renders Dailymotion only from embed code that carries a Player ID; a Dailymotion URL, or code without one, renders nothing and `onError` reports `social-embeds: a Dailymotion embed needs a Player ID: pass playerId to DailymotionEmbed`. A host that has a Player ID and URLs uses `DailymotionEmbed`.
- **Props left off the dispatcher:** the new option names join the D36 list: Vimeo's (`autopause`, `background`, `byline`, `dnt`, `keyboard`, `muted`, `pip`, `portrait`, `quality`, `speed`, `title`, `transparent`, `t`, …), Twitch's (`time`) and Dailymotion's (`playerId`, `mute`, `startTime`). `title` is new to the list, so the dispatcher no longer takes a `title` attribute for its wrapper `div`. Spotify's `theme` was already there.
- **Playground:**
  - One page per new platform, with every wave 3 fixture except Twitch's collection example (its id is a placeholder) and the URL samples. The Dailymotion page adds `DailymotionEmbed` with the Player ID from Dailymotion's docs.
  - Embed code and URL samples on the platform pages now show their `onError` message, as `/many` does (D59). `ReportedEmbed` takes `html` as well as `url`.
  - `/many` has a Spotify track, a Vimeo video and a Twitch channel before the X posts. Dailymotion is left out: a URL cannot render through `<SocialEmbed>`.

Checked in Chrome on 2026-11-19, against `next build` and `next start`:

- **Client navigation** from the home page through `/spotify`, `/vimeo`, `/twitch` and `/dailymotion`, with every section scrolled into view: the same document stayed loaded, and no skeleton was left.
  - Spotify: track and episode 760×152, playlist and album 760×352, the video show 760×427.
  - Vimeo: five frames at 760×427. Twitch: four frames at 760×427, each with `parent`.
  - Dailymotion: the three frames with Player ID `x8lr5` at 760×427. The oEmbed code and the URL showed the Player ID message. The players show Dailymotion's "Playback error" for the docs' sample video, as in D66.
- **`/many`**, loaded directly and scrolled twice: 31 embeds, no `onError` message and no skeleton. Spotify 760×152, Vimeo and Twitch 760×427. Each script was on the page once.

## Wave 3 security review (2026-11-19)

### D68. Options never replace the verified content

`verifyEmbed` checks an `embed`'s `url`, `id` and shape (D35, D57), not its `options`. A host-built embed could therefore carry options named like the content parameters, and `query` keeps the first position of a key but the last value. So `{ options: { channel: 'other' } }` on a verified Twitch channel turned into `?channel=other`, and the same held for Dailymotion's `video` and Vimeo's `h`.

- Components drop those keys from the options with `optionsWithout`, as `FacebookVideoIframe` already drops `href`:
  - Twitch: `channel`, `video`, `collection`, `clip`, and `parent`, which `IframeEmbed` adds itself (D65).
  - Dailymotion: `video` and `playlist` (playlists are left out, D63). The Player ID was already taken out of the options.
  - Vimeo: `h`, which comes only from the verified URL.
- The iframe host stays fixed in every case, so the impact was other content from the same platform, not another origin.
- Not changed: YouTube's `list` and `playlist` are documented options that the embed code and props set on purpose. Reddit's `embed` and the other components take their content from the URL path.

Tests: a host-built embed with each reserved key renders the verified content, and Twitch gets exactly one `parent`.

## Dailymotion playback (2026-11-19, after 0.4.0)

### D69. Dailymotion's "Playback error" comes from its stream CDN

D66 and D67 saw the docs' player (`x8lr5`) show "Playback error" for its demo video. Checked again in Chrome on 2026-11-19:

- `api.dailymotion.com/video/x84sh87` reports the demo video as published, public and not geoblocked.
- On a static page on `localhost:4173`, `geo.dailymotion.com/player/x8lr5.html?video={id}&mute=true` played the demo video and two public news videos (`xby33jy`, `xby33ki`), muted, on the first load.
- On `/dailymotion` in the playground, `DailymotionEmbed` played the demo video in the first player.
- Every later load failed, on the static page, in the playground, and with the player URL opened on its own outside any embed. The player, its metadata and its recommendations loaded with 200. The video's stream manifest (`cdndirector.dailymotion.com/cdn/manifest/video/{id}.m3u8`) returned 403.

So the component builds a working `src`, and the player loads and can play. The 403 comes from Dailymotion's stream CDN with or without the package. It looks like a limit on the docs' sample player after a few plays; that is not proven. Whether a publisher's own Player ID has the same limit still needs one of its own videos.

## Wave 4 research (Milestone 1, 2026-11-20)

The VERIFY items of [wave-4-brief.md](./wave-4-brief.md). Frames were probed in Chrome on a static page on `localhost:4173` with a `message` listener, as in waves 2 and 3. Share and Embed dialog code was read from each platform's own page; cookie banners were declined.

### D70. Bluesky: embed code and DID URLs, an iframe that posts its height

- **Embed code** is what `embed.bsky.app/oembed` returns (`bluesky/oembed.html`): a `blockquote.bluesky-embed` with `data-bluesky-uri` (the AT URI) and `data-bluesky-cid`, the post text in a `p`, author and post links with `?ref_src=embed`, and `embed.js`. The post link carries the DID, not the handle.
- **`embed.js`** scans the whole node it is given (`document` by default) for `[data-bluesky-uri]` and replaces each with `https://embed.bsky.app/embed/{did}/app.bsky.feed.post/{rkey}?id={random}&ref_url={page}`; `data-bluesky-embed-color-mode` becomes `colorMode`. It exposes `window.bluesky.scan`.
- **The frame** posts `{ height, id }` as an object, from `https://embed.bsky.app`, once it has painted: a frame that has not been on screen posts nothing. Without `id` it still posts, with `id: null`. The post rendered at 682 px for 600 px wide.
- **Parser:** canonical `https://bsky.app/profile/{did}/post/{rkey}`, `id` `{did}/app.bsky.feed.post/{rkey}`, `kind: 'post'`. Options: `cid`, and `colorMode` from `data-bluesky-embed-color-mode` (`light`, `dark` or `system`). URLs with a handle need a lookup and return `null` (brief §2.1).
- **Not checked:** a deleted post and an account hidden from logged-out users.

### D71. SoundCloud: two id encodings, three heights

- **oEmbed** (`soundcloud/oembed-*.html`): `url=https%3A%2F%2Fapi.soundcloud.com%2F{tracks|playlists|users}%2F{n}`, `visual=true`, `show_artwork=true`; height 400 for a track, 450 for a playlist and a user.
- **Share → Embed** (`soundcloud/share-visual.html`, `share-classic.html`): `url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A293`, a URN encoded twice, plus `color`, `auto_play`, `hide_related`, `show_comments`, `show_user`, `show_reposts`, `show_teaser` and, for the visual player, `visual=true`. Height 300 visual, 166 classic. After the iframe comes a `div` with the artist and track links.
- **The player takes a permalink:** `url=https://soundcloud.com/forss/flickermood` rendered the track, so URL input needs no lookup.
- **Parser:** both encodings give `https://api.soundcloud.com/{type}/{n}`, `id` the number. Permalinks give `https://soundcloud.com/{user}/{slug}`, `…/sets/{slug}` or `https://soundcloud.com/{user}`. A `secret_token` stays in the canonical URL; no private track was available to check.
- **Rendering:** the embed code's height. A URL gets the visual player at 400 (maintainer, 2026-11-20).

### D72. Apple Music: album, song and playlist

- **Copy Embed Code** (`applemusic/share-album.html`, `share-song.html`): an iframe on `embed.music.apple.com` with Apple's `allow` and `sandbox`, `style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;"`, height 450 for an album and 175 for a song. A song from its album menu is written as `/song/{slug}/{id}`.
- **Slugs are not needed:** `embed.music.apple.com/us/album/1440857781` and `…?i=1440857786` both rendered.
- **Parser:** canonical without the slug: `https://music.apple.com/{cc}/{album|song|playlist}/{id}`, plus `?i={songId}` for a song on its album; `id` the `i` value when present, else the path id. The country code is kept.
- **Music videos** have no embed option on the web, and `music-video` URLs are not supported. Artists are not supported either: no embed was checked.

### D73. Apple Podcasts: episodes from embed code, shows from URLs

- **Embed Episode** (`applepodcasts/share-episode.html`): as Apple Music, with `height="160" width="640"`, `max-width:640px` and `border-radius:12px`, `src` `embed.podcasts.apple.com/{cc}/podcast/{slug}/id{showId}?i={episodeId}`.
- **Shows** have no embed option on the web. `embed.podcasts.apple.com/us/podcast/id1200361736` redirects to `/us/podcast/1200361736` and renders the show; at 450 px it fits.
- **Parser:** canonical `https://podcasts.apple.com/{cc}/podcast/id{showId}`, plus `?i={episodeId}`; `id` as Apple Music. Heights: episode 160, show 450.

### D74. Tumblr: the blog name works, so URLs render

- **oEmbed** (`tumblr/oembed.html`): `div.tumblr-post` whose `data-href` is `embed.tumblr.com/embed/post/t:{token}/{id}/v2`, with `data-did`, a link to `www.tumblr.com/{blog}/{id}`, and `post.js?_v=…`.
- **`embed.tumblr.com/embed/post/{blog}/{id}/v2` renders the same post** as the token form. A URL therefore needs no lookup, and the brief's embed-code-only path is not needed.
- **The frame** posts the string `{"method":"tumblr-post:sizeChange","args":[768]}` from `https://embed.tumblr.com`, once it has painted.
- **Parser:** canonical `https://www.tumblr.com/{blog}/{id}`, from `www.tumblr.com/{blog}/{id}[/{slug}]` and `{blog}.tumblr.com/post/{id}[/{slug}]`. Embed code takes the blog and id from its link, which must have the same id as `data-href`. The token and `data-did` are dropped.

### D75. Kick: the player URL, channels only

- Kick's site has no embed dialog, so `kick/player-channel.html` is derived from the player URL, `player.kick.com/{channel}`, which rendered the channel. The channel page asked for an age confirmation, which was not given.
- **Parser:** canonical `https://kick.com/{channel}`, lowercase; `kind: 'video'`, 16:9. Videos and clips are not supported. `autoplay` and `muted` are kept from the query; the player showed a play button with `autoplay=false`, and the parameters are not documented.

### D76. Giphy: fixed and responsive code, both with a credit

- **Embed dialog** (`giphy/embed-fixed.html`, `embed-responsive.html`): `<iframe src="https://giphy.com/embed/{id}" … class="giphy-embed" allowFullScreen>` at the GIF's size, or `width/height="100%"` inside `<div style="width:100%;height:0;padding-bottom:{ratio}%;position:relative;">`. Both are followed by `<p><a href="https://giphy.com/gifs/{id}">via GIPHY</a></p>`.
- `giphy.com/gifs/{slug}-{id}` redirects to `giphy.com/gifs/{id}`.
- **Parser:** canonical `https://giphy.com/gifs/{id}`; `kind: 'video'`; size from the iframe or the wrapper. A URL has no size and gets 1:1. Clips are not supported.

### D77. Bluesky and Tumblr render their frames directly

Both frames post their height to the page, so both components build the iframe themselves, as Telegram and Reddit do (D55): `variant: 'iframe'`, no script, no page-wide scan (D39), and nothing loaded before the embed comes near. `embed.js` and `post.js` are accepted in embed code and not loaded.

## Wave 4 dispatcher and playground (Milestone 5, 2026-11-20)

### D78. `<SocialEmbed>` routes the wave 4 platforms

- **Routing:** `bluesky`, `soundcloud`, `applemusic`, `applepodcasts`, `tumblr`, `kick` and `giphy` go to their components. `height` and `maxHeight` reach the five fixed-size iframes; Bluesky and Tumblr take their height from the frame.
- **A Bluesky handle URL** renders nothing, and `onError` reports `social-embeds: a Bluesky URL needs a lookup: use the embed code`, from the dispatcher and from `BlueskyEmbed`.
- **Props left off the dispatcher:** the new option names join the D36 list: SoundCloud's (`visual`, `autoPlay`, `hideRelated`, `showComments`, `showUser`, `showReposts`, `showTeaser`, `showArtwork`; `color` was already there), Kick's `autoplay` and `muted`, Bluesky's `colorMode`.
- **Playground:** a page per platform with every wave 4 fixture and URL samples, and one embed of each on `/many`, before the X posts.

Checked in Chrome on 2026-11-20, against `next build` and `next start`. The browser pane was hidden, so frames were brought into view one by one with a screenshot, which paints them:

- **SoundCloud:** Share visual 760×300, classic 760×166, oEmbed playlist 760×450, URLs 760×400.
- **Apple Music:** album 660×450, song 660×175, song on its album 660×175. **Apple Podcasts:** episode 640×160, show 640×450.
- **Kick:** 760×428. **Giphy:** 760×760, the credit not rendered.
- **Bluesky:** 600×691 and **Tumblr:** 540×768, from the frames' own height messages; neither platform's script was added to the page. The handle URL sample showed the lookup message.
- **`/many`:** the seven new embeds rendered at the sizes above, with no `onError` message.
- A Bluesky frame that had not been painted for 15 s reported `social-embeds: Bluesky post did not report its height`, then still took its height when painted. Frames paint once on screen, and `lazy` creates them only near the viewport, so this needs a hidden page or `lazy={false}` far below the fold.

## Wave 4 review follow-ups (2026-11-20)

### D79. Minor findings from the wave 4 review

- **Tumblr:** when `data-href` names a blog instead of a token, it must be the blog of the post link, else the code is rejected. A token still cannot be checked.
- **SoundCloud:** a valid `secret_token` given as a player parameter, rather than inside `url`, is folded into the canonical URL; a malformed one rejects the code.
- **Reserved option keys** are compared in lower case, so `URL` or `Secret_Token` cannot reach a player beside the verified content (D68).
- **Bluesky lookup message:** only a profile that is a domain name counts as a handle. A malformed DID (`did:plc:` in upper case, `did:key:…`) now gets "not a supported post URL", not "needs a lookup". The dispatcher and the components build the message from one helper.
- **Kick:** `kick.com/clips`, `/video` and `/videos` are not channels.

## Global samples (2026-11-20)

### D80. Every sample from the platform's own account

The rules, and why: [global samples design](./superpowers/specs/2026-11-20-global-samples-design.md). Candidates were checked logged out, through each platform's oEmbed endpoint, public page or API, on 2026-11-20. "Keep" means the current post already passes.

| Fixture or sample                                                   | New post                                                                                                        | Account                                 | Old post (replaced)                         |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------- |
| `x/oembed-basic`, `x/oembed-options`, demo                          | keep `x.com/jack/status/20`                                                                                     | @jack, the first tweet                  | —                                           |
| `x/oembed-link`, demo "twitter.com"                                 | `x.com/XDevelopers/status/1460323737035677698`                                                                  | @XDevelopers                            | Obama `266031293945503744`                  |
| `x/oembed-hashtag`                                                  | `x.com/XDevelopers/status/1293593516040269825`                                                                  | @XDevelopers                            | Ellen `440322224407314432`                  |
| `youtube/*`, demo                                                   | keep `jNQXAC9IVRw`; demo start `t=11` (the video is 19 s)                                                       | jawed, "Me at the zoo"                  | demo `t=90`                                 |
| `instagram/post-captioned`, demo post                               | `instagram.com/p/Df75lxnmIrF/`                                                                                  | @instagram, featuring artist @gengeller | `DfPQchkG1tg` (footballer)                  |
| demo reel                                                           | `instagram.com/reel/DfkYarGBOtk/`                                                                               | @instagram                              | `DfQCqMnhpsG` (singer)                      |
| `threads/*`, demo                                                   | `threads.com/@instagram/post/Df5MmLBm0O7` "four new Stories upgrades" (derived from a pasted Embed dialog code) | @instagram, Meta                        | `@instagram/post/DfQSavwEs5C`               |
| `facebook/post-iframe`, `facebook/post-sdk-docs` (derived), demo    | `facebook.com/facebook/posts/1710463914458955` (pasted)                                                         | Facebook                                | a private person's post                     |
| `facebook/video-sdk-docs`, demo video                               | keep `facebook/videos/10153231379946729`                                                                        | Facebook                                | —                                           |
| `facebook/video-iframe-reel`                                        | `facebook.com/reel/1523911562856332/` (pasted)                                                                  | Facebook, featuring a creator           | a Bulgarian news reel                       |
| `tiktok/oembed-player`, `tiktok/webapp-share-player` (pasted), demo | `tiktok.com/@tiktok/video/7704834703446117662`                                                                  | @tiktok                                 | `@scout2015` (docs sample)                  |
| `telegram/*`, demo                                                  | keep `t.me/telegram/83`                                                                                         | @telegram                               | —                                           |
| demo "single"                                                       | `t.me/designers/278?single` (an album)                                                                          | @designers, run by Telegram             | `durov/43` (personal channel, not an album) |
| `snapchat/profile-share`, demo                                      | keep `@teamsnapchat`                                                                                            | Team Snapchat                           | —                                           |
| `snapchat/lens-share`                                               | Lens `6451403405463552` "Dog"                                                                                   | Snapchat (official Lens)                | a community Lens                            |
| demo Spotlight                                                      | `@specsdevs/spotlight/W7_EDlXWTBiXAEEniNoMPwAAYbXB4dmdmdG9pAZ9IUkWUAZ9IUOjXAAAAAQ`                              | Spectacles (Snap)                       | `@yang_sixiang`                             |
| demo saved story                                                    | `@snapgames/highlight/88d1bbae-f29c-4c27-ac5c-f2afe670d8fe`                                                     | Snap Games                              | `@erling.haaland`                           |
| `linkedin/*`, demo                                                  | `urn:li:ugcPost:7528828146767409153`, chosen by the maintainer from LinkedIn's company page                     | LinkedIn                                | posts from the maintainer's network         |
| `reddit/post-share`, demo                                           | `r/reddit/comments/11zso11/` "An Improved Web Experience" (pasted)                                              | u/joyventure, Reddit admin              | `r/bulgaria` `1xz8iq4`                      |
| `reddit/comment-share`, demo                                        | `…/11zso11/comment/jde89cx/` (pasted)                                                                           | the same admin                          | `r/bulgaria` comment                        |
| `pinterest/oembed-iframe`, `pinterest/widget-docs` (derived), demo  | pin `424605071145752542`                                                                                        | Pinterest                               | `99360735500167749` (widget-builder sample) |
| `spotify/oembed-track`, demo track                                  | `track/0LrHzQHk5gYGbMsoVbKDuS` "Somewhere Sunny"                                                                | Kevin MacLeod, royalty-free             | Rick Astley                                 |
| demo album                                                          | `intl-de/album/4JFX70cq4K7PGohmm5OoNe`                                                                          | Kevin MacLeod                           | `4aawyAB9vmqN3uQ7FjRGTy`                    |
| `spotify/oembed-episode`                                            | keep `episode/7makk4oTQel546B0PZlDM5`                                                                           | Spotify, "Life at Spotify"              | —                                           |
| `spotify/oembed-playlist`                                           | `playlist/37i9dQZF1DX4sWSpwq3LiO` "Peaceful Piano"                                                              | Spotify (editorial)                     | Today's Top Hits                            |
| `spotify/oembed-show-video`                                         | `show/4OsuS4G6ukepPsjme51uFt` "Spotify News"                                                                    | Spotify                                 | `4rOoJ6Egrf8K2IrywzwOMk`                    |
| `vimeo/*`, demo                                                     | keep `76979871`                                                                                                 | Vimeo staff                             | —                                           |
| `twitch/docs-channel` (derived), demo                               | channel `twitch`                                                                                                | Twitch                                  | `dallas`                                    |
| `twitch/docs-video` (derived)                                       | `videos/1816688726` "Twitch's Channel Trailer"                                                                  | Twitch                                  | `40464143`                                  |
| `twitch/docs-collection` (derived)                                  | `collections/ryMlWIJaBxf2aQ` "Patch Notes"                                                                      | Twitch                                  | a placeholder id                            |
| demo clip                                                           | `twitch/clip/LivelyFrigidApeLeeroyJenkins-D01Eij0_9y-oFwAu`                                                     | Twitch                                  | —                                           |
| `dailymotion/player-id-docs`                                        | keep `x8lr5` + `x84sh87`, Dailymotion's demo video (a hiker, English)                                           | Dailymotion                             | —                                           |
| `dailymotion/oembed`, demo                                          | `x84qh50`, Dailymotion's demo video (meerkats)                                                                  | Dailymotion                             | `xbxskia` (news)                            |
| `bluesky/oembed`, demo                                              | `bsky.app/profile/bsky.app/post/3mxu3hsnebc2v` "saw some cool clouds today"                                     | @bsky.app                               | `3n2mkgfb4tk2d` (press item)                |
| `soundcloud/*`, demo                                                | keep Forss _Flickermood_, _Soulhack_, `forss`                                                                   | Forss, co-founder                       | —                                           |
| `applemusic/*`, demo                                                | album `1357820591` _Birds of Oaks Bottom: Piano Solos_, song `1357820597` "Great Blue Heron"                    | Chad Crouch, little-known               | Jack Johnson `1440857781`                   |
| `applepodcasts/share-episode`, demo show                            | show `id947965068`, episode `1000430702647` "Monument Valley: Meet the Developer"                               | Apple                                   | _The Daily_ `id1200361736` (news)           |
| `tumblr/oembed`, demo                                               | `staff.tumblr.com/post/828009069026721792` "Premium just got better"                                            | @staff                                  | `832577330595643392` (news event)           |
| `kick/player-channel` (derived), demo                               | channel `kick`                                                                                                  | Kick                                    | `xqc` (streamer, 18+ gate)                  |
| `giphy/*`, demo                                                     | `l41YlHs99JsSptZf2`, a cat over the GIPHY logo                                                                  | @originals, GIPHY Studios               | `JIX9t2j0ZTN9S` (no uploader)               |

- **@X:** no usable post from `@X` itself was found; `@XDevelopers` is X's official developer account.
- **Music:** neither Spotify nor Apple has a track of its own. A royalty-free (Kevin MacLeod) and a little-known (Chad Crouch) artist were chosen; MacLeod's Apple Music album is a 2026 re-upload, so Apple uses Crouch. Spotify's track fixture keeps a track rather than an episode, so the track path stays tested (maintainer, 2026-11-20).
- **Apple Podcasts:** Apple's keynote podcast features its executives, so a developer-interview episode was chosen.
- **Giphy:** `giphy.com/giphy` is a search page, not an account; GIPHY Studios is Giphy's own studio.
- **Threads:** every recent `@threads` post shows "Thread not available" on its `/embed` page, logged out; `@instagram`'s Threads posts embed. The maintainer's Embed dialog code for `@threads/post/Df7kSgBJVNz` was kept, with the permalink and element id changed to `@instagram/post/Df5MmLBm0O7` and its Bulgarian link text changed to "View on Threads". The maintainer approved the text change (2026-11-20); the switch to the `@instagram` post was the executor's call. `threads/oembed*.html` keep the oEmbed form (`/t/{code}` permalink with `utm_` query, `data-theme`), derived from the previous oEmbed fixtures with the new post's code.
- **Browser check** (2026-11-20, `next build` + `next start`, each embed brought into view): every platform page shows only the documented `onError` samples (Bluesky's handle URL, Dailymotion without a Player ID). On `/many` all 38 embeds rendered; Threads renders the `@instagram` post. One Reddit frame reported no height while the browser pane was hidden, and the same post rendered at 316 px elsewhere on the page.
- **Pasted by the maintainer:** LinkedIn, Facebook post and reel, TikTok share dialog, Reddit post and comment, Threads.

## Cleanup after 0.5.2 (2026-11-20)

### D81. The height timeout waits for the frame to be near

Frames that report their height (Telegram, Reddit, Bluesky, Tumblr) post it only once painted (D70). With `lazy={false}` the iframe is created at once, so a frame far below the fold timed out after 15 s and called `onError`, then took its height when scrolled to (D78). The message listener still starts when the iframe is created, but the 15 s timeout now starts when the frame comes within 200 px of the viewport. With `lazy` on, both happen together. The extra observer is created only with `lazy` off and a frame that reports its height.

## Web component (2026-11-20)

### D82. Shared plans, separate frame code

Each platform's knowledge (the iframe URL, allowed features, aspect ratio, height messages, options and script markup) moved into plain "plan" functions in `src/core/` that the React components and the `<social-embed>` element both call, so a platform fix is made once. The frame behaviour (lazy loading, height messages, the 15 s timeouts and retries) is written twice, in the React hooks and in DOM code, because sharing it would have rewritten the code that D28 and D81 depend on. The numbers both sides use live in one shared constants module.

### D83. The element renders into the light DOM

The platform scripts (X, Instagram, Threads, Facebook, Pinterest) scan the page's document for their markup and cannot see into a shadow root. The element therefore renders inside itself, as the components render inside their wrapper.

### D84. Input order and the template

The `html` property wins over the first `<template>` child, which wins over the `url` attribute, mirroring `<SocialEmbed>`'s embed-code-first rule. A template keeps the embed code inert, so the platform's script tag never runs and the blockquote is never shown raw. The element builds markup only from a verified embed and escaped values (D68); unrecognised embed code renders nothing and fires `error`.

### D85. Events

`load` is a plain `Event` and `error` an `ErrorEvent` whose `error` is the `Error` React's `onError` receives, with the same message. Neither bubbles, like `<img>` and `<iframe>` events. Both dispatch in a microtask, so a listener added right after the element is created still hears an outcome that is known at once, and only while the element is connected, so a removed element never fires.

### D86. `eager`

`eager` is a boolean attribute that loads at once instead of when near the viewport. It is the inverse of React's `lazy`, because HTML boolean attributes default to off. The height timeout still starts when the frame is near (D81).

### D87. One self-contained `element.js`

Subresource Integrity checks only the file a script tag names, not the modules it imports, so `dist/element.js` has no chunks shared with the other entries and one `integrity` hash covers all of its code. It is minified, unlike the other entries, and about 20 KB gzipped, under the 30 KB budget, against about 45 KB for React alone. `scripts/check-element.mjs` fails the build if the file has any import or is over 30 KB gzipped; it finds imports with a lexer, so a string or comment that merely says `import` does not fail it. It also imports the file in Node, which must export `SocialEmbedElement` and define nothing. The entry is listed in `sideEffects` because importing it registers the tag.

### D88. Per-platform defaults live in the plans

A component that sets a default `maxWidth`, a fixed `height` or a `borderRadius` for its platform now sets it in the plan, so the element sizes and rounds each embed the same as React. The components keep only prop typing and option names; a prop or `style` the host passes still replaces the plan's value.

### D89. Waiting for `DOMContentLoaded`

An element in the HTML can connect while the parser is still reading, before its children and `<template>` exist. If the document is still loading when it connects, it waits for `DOMContentLoaded` before capturing its children and starting, so a template or placeholder written inside it is never missed.

### D90. Script embeds measure a box the host cannot lay out

The wrapper of a script embed takes the host's `className` and `style`. Up to 0.6.0 the platform container and the skeleton were its direct children, so the host's layout classes applied to them. novini.bg gives every embed block `flex items-center justify-center`. In that flex row the container shrank to fit its content and was 0 px wide when the Facebook SDK read it, beside a `width:100%` skeleton. The SDK sent `container_width=0`, Facebook drew its default 552 px post, and at 375 px the iframe sat at x = -88, cut off on both sides (2026-11-20, live article, `data-width="500"` from iframe embed code). D33's fluid-width check had used a block box only.

The same post rendered in the live page at 375 px, in four boxes:

| Wrapper                         | Container    | `container_width` | iframe            |
| ------------------------------- | ------------ | ----------------- | ----------------- |
| flex row, `justify-center`      | as before    | 0                 | 552 px at x = -88 |
| block                           | as before    | 375               | 375 px            |
| flex column, children stretched | as before    | 375               | 375 px            |
| flex row, `justify-center`      | `width:100%` | 188               | 350 px            |

The container and the skeleton now sit in one package-owned `<div style="width:100%">` inside the wrapper. As the wrapper's only child, it takes the wrapper's full width in a block wrapper and in a flex row or column, so the container is as wide as the wrapper when the script reads it.

Evidence (playground, 375 px viewport, 343 px column, wrapper `display:flex; align-items:center; justify-content:center`): the old structure rebuilt in the page got `container_width=0` and a 552 px iframe at x = -88; `FacebookEmbed` and `<social-embed>` both got `container_width=343` and a 350 px iframe at x = 16. 350 px is the smallest post Facebook draws, so a column narrower than that still overflows on the right, as in a block box.

- **Not `display:block` on the wrapper:** an inline `display` overrides the host's `hidden` attribute and responsive classes such as `hidden md:block`.
- **Not `width:100%` on the container alone:** in a flex row it shares the row with the skeleton, so it was 188 px and Facebook drew its 350 px minimum (last row).
- **The element has the same box.** Its wrapper is package-owned and the host's classes land on `<social-embed>`, so it never had the bug; the box keeps one DOM for both, which the parity test compares.

### D91. Iframe embeds time out when they do not load

Iframe embeds that do not report their height (all but Telegram, Reddit, Bluesky and Tumblr) called `onLoad` on the iframe's `load` event and had no timeout. In Firefox on the `/element` demo, TikTok, Snapchat and LinkedIn stayed at "waiting" (reported by the maintainer, 2026-11-20). The same page showed X's `widgets.js did not initialise` and Facebook's `could not load …/sdk.js`, which fits Firefox's tracking protection blocking those hosts; its shield panel was not checked. The frames never fired `load`, and an iframe fires no `error`, so the host could not show a fallback.

These frames now get the D81 timeout, started the same way: 15 s from when the frame comes within 200 px of the viewport, also with `lazy={false}`. Without a `load` by then, the placeholder goes and `onError` (the element's `error` event) reports `social-embeds: {title} did not load`. A `load` that arrives later still calls `onLoad`, as a late height does (D78). With `lazy` off, the near-viewport observer for the timeout is now created for every iframe embed. The constant is renamed `FRAME_TIMEOUT_MS`.

## Wave 5 research (Milestone 1, 2026-11-21)

The VERIFY items of [wave-5-brief.md](./wave-5-brief.md). Frames were probed in Chrome on a static page on `localhost:4173` with a `message` listener, as in waves 2–4. Embed and Share dialog code was read from each platform's own page, logged out; cookie banners were declined. Platform scripts were read as served on 2026-11-21.

### D92. Generic iframe fixtures: what each code carries

One real code per source in `test/fixtures/generic/`, checked against the rules of brief §3:

| Fixture              | `src` host                    | Size by §3                                          | Kept                                                                    | Dropped                                                                            |
| -------------------- | ----------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `google-maps-embed`  | `www.google.com/maps/embed`   | 600×450, ratio box                                  | `allowfullscreen=""`, `referrerpolicy`                                  | `style`, `loading`                                                                 |
| `datawrapper-oembed` | `datawrapper.dwcdn.net`       | full width at 200 (no `width`)                      | `title`, `scrolling="no"`                                               | `aria-label`, `id`, `frameborder`, `style`, `data-external`, the resize `<script>` |
| `deezer-oembed`      | `widget.deezer.com`           | 420×420                                             | `allowfullscreen="true"`, `allow="encrypted-media"`                     | `id`, `allowtransparency`                                                          |
| `mixcloud-oembed`    | `www.mixcloud.com/widget`     | full width at 120 (`width="100%"`)                  | `allow`: `encrypted-media`, `fullscreen`, `autoplay`, `web-share`       | `allow`: `idle-detection`, `speaker-selection`; `frameborder`                      |
| `loom-responsive`    | `www.loom.com/embed`          | wrapper `padding-bottom: 56.074766355140184%`       | `allowfullscreen`                                                       | `frameborder`, `webkitallowfullscreen`, `mozallowfullscreen`, `style`              |
| `ted-oembed`         | `embed.ted.com`               | 560×315                                             | `title`, all four `allow` features, `referrerpolicy`, `allowfullscreen` | `frameborder`, `loading`                                                           |
| `codepen-oembed`     | `codepen.io/…/embed/preview`  | full width at 300 (no `width`; `style` has no `px`) | `title`, `scrolling="no"`, `allowfullscreen="true"`                     | `id`, `frameborder`, `allowtransparency`, `allowpaymentrequest`, `class`, `style`  |
| `bandcamp-embed`     | `bandcamp.com/EmbeddedPlayer` | 350×470 from `style` `px`                           | —                                                                       | `style`, `seamless`, the link inside the iframe                                    |

None is rejected by the §3 rules, provided the generic parser does the following (Task 2):

- **Children of the iframe:** Bandcamp's iframe holds an `<a>` (fallback text for browsers without frames). The package's HTML parser reads it as a child element; it must be accepted and dropped.
- **No `title`:** Google Maps, Deezer, Mixcloud, Loom and Bandcamp get `Embedded content`.
- **An empty `allow` entry:** Mixcloud's list ends with `;`.
- **Loom's wrapper** is `position: relative; padding-bottom: {n}%; height: 0;` with a long fraction. None of the Vimeo, Dailymotion or Giphy wrapper patterns matches it.
- **A raw `&` in `src`** (Deezer, Loom), and `&amp;` (Mixcloud): both reach the parser as `&` and must be escaped again when the iframe is rebuilt.
- **`width: 0` in Datawrapper's `style`:** it has no `px` and `pixels()` rejects `0`, so the `height` attribute alone decides: full width at 200.
- **Text after the iframe:** Mixcloud's code ends with a newline; Datawrapper's with a `<script>`. Both are dropped.

Height messages, for the record (§6 leaves them for later): the Datawrapper frame posts `{"datawrapper-height":{"9kGOy":216}}` about every second from `https://datawrapper.dwcdn.net`, beside `{"sentinel":"amp","type":"embed-size","height":216}`. Its code says `height="200"`, so without its script the chart is clipped by 16 px at 600 and at 320 px wide.

### D93. Truth Social: the embed iframe posts its height without being asked

- **Embed code** (`truthsocial/embed-dialog-video.html`, post ⋯ → Embed Truth): `<iframe src="https://truthsocial.com/@{user}/{id}/embed" class="truthsocial-embed truthsocial-video" style="max-width: 100%; border: 0" width="600" allowfullscreen="allowfullscreen"></iframe><script src="https://truthsocial.com/embed.js" async="async"></script>`. `truthsocial.com/api/oembed?url=…` returns the same code. Text and image posts lack the class `truthsocial-video` (`oembed-text.html`).
- **`embed.js`** gives each `iframe.truthsocial-embed` a random `id`. It sets `scrolling="no"`, an 8 px radius and a `1px solid rgb(237 237 239)` border, and posts `{type: 'setHeight', id}` to the frame with `'*'` on `load`. On a `setHeight` message whose `id` it knows and whose `source` is that frame, it sets the `height`, plus 165 px for `truthsocial-video`.
- **The frame does not wait to be asked.** Its bundle stores the `id` of the last `setHeight` message it receives, from any origin. It posts `{type: 'setHeight', id, height}` to its parent with `'*'` whenever the post's state changes (loading, then loaded), with `height` its `scrollHeight`. Without an ask it posts the same object with `id` undefined. A second ask after load gets no answer until the content changes. Messages come from `https://truthsocial.com`.
- **Heights, 600 px wide:** a text post reported 216, then 221, and fits; a two-image post 506 and fits. **Video posts report their height before the video is sized:** 530 for a page 1,246 px tall (a vertical 480×854 video shown at 568×1010), 586 for another vertical one. Truth Social's own script gives 695 and cuts the video off as well.
- **Ruling (controller, 2026-11-21): video posts get 165 px more,** as Truth Social's script does. Embed code whose iframe has the class `truthsocial-video` adds 165 px to every reported height; a URL cannot tell a video post and takes the reported height. Vertical videos stay cut off, in the package as in Truth Social's own embed.
- **Paths:** `/@{user}/{id}/embed` has no `frame-ancestors` and loads in a frame; the app then rewrites the address to `/embed/{id}` without a new load. `truthsocial.com/embed/{id}` itself is served with `frame-ancestors 'none'` and cannot be framed. The frame reads only the post id from the path, never the user name.
- **URLs:** the web app writes `truthsocial.com/@{user}/posts/{id}` (`www.` redirects 301 to it); the API's `url` is `truthsocial.com/@{user}/{id}`, the only form oEmbed accepts. Quote posts link `truthsocial.com/users/{user}/statuses/{id}`. Ids are 18 digits, beyond 2⁵³: strings only.
- **Parser:** canonical `https://truthsocial.com/@{user}/posts/{id}`, `id` the post number as a string, `kind: 'post'`, `variant: 'iframe'` (D100). `src` template `https://truthsocial.com/@{user}/{id}/embed`; `maxWidth` 600, from the code's `width`; height from the frame. Options: none; the code's `class`, `style` and `allowfullscreen` are dropped. Whether the code is a video post (`truthsocial-video`) is not an option, but it sets the height rule below.
- **Frames the parser accepts (`ownsFrame`):** `truthsocial.com` with path prefix `/@`.
- **A missing post** shows "Not found — This resource could not be found — Go back" and posts a height equal to the frame's own (300 for a 300 px frame); `load` fires.
- **Cloudflare:** not verified for real visitors. Nine frame loads in Chrome showed no challenge, and curl with a browser user agent got 200 for `/@…/embed` and `embed.js`. Cloudflare answered 403 to curl for `/api/v1/…`, and the logged-out web app got 429 after about six paginated API calls.
- **Sample:** `@truthsocial`'s pinned "Meet the new Watch tab." (`117529982042129746`), a product feature. The account's 2026 text posts are about the company's finances, its merger or politics; the fixture's text post is its Independence Day greeting (`116862065232992052`), the only text-only post found that is none of these.

### D94. Imgur: blockquote code, a frame that posts its height once

- **Embed dialog** (`imgur/embed-dialog-album.html`, post ⋯ → Embed): `<blockquote class="imgur-embed-pub" lang="en" data-id="a/{id}"  ><a href="//imgur.com/a/{id}">{title}</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>`. The link is protocol-relative, the title is escaped (`It&#39;s`), and two spaces precede `>`. "Hide Title" adds `data-context="false"` (`embed-dialog-album-hide-title.html`); it hides the title and description, not shows them.
- **oEmbed** (`oembed-album.html`, `oembed-image.html`): `href="https://imgur.com/a/{id}"`, the title unescaped; an image is `data-id="{id}"` with the text "View post on imgur.com". oEmbed returns 404 for gallery URLs with a slug and for `i.imgur.com` file URLs.
- **`embed.js`** loads `imgur.com/min/embed-controller.js`. That script replaces each `blockquote.imgur-embed-pub` with an iframe `//imgur.com/{data-id}/embed?pub=true&ref={page URL}[&context=false][&analytics=false]&w={width}`, using the protocol of its own `src`. The width is the parent's, at most 540 and at least 400 (300 on touch screens); the initial height is 500. It listens, with no origin check, for JSON strings with `message: 'resize_imgur'` (sets the height) or `'404_imgur_embed'` (sets 200).
- **The frame** posts one JSON string, at `load`, unasked, from `https://imgur.com`: `{"message":"resize_imgur","href":"{frame URL}","height":415,"width":360,"context":true}`. It lays itself out to its own width; `w` changes nothing (415 at 360 px with `w=540`, `w=360` or none) and no message follows a resize. Album: 415 at 400 and 360 px, 485 at 540 px; image 363 at 400 px; `context=false` 315 at 400 px. **Without `pub=true`** it shows Imgur's old dark gallery viewer and posts nothing.
- **Gallery and album ids are the same:** `imgur.com/gallery/{slug}-04b1CmA` is `data-id="a/04b1CmA"`. `imgur.com/gallery/{id}/embed` redirects (301) to the home page, which refuses framing, so a gallery post is framed as `a/{id}`. Not checked: an old gallery post of a single image (`gallery/{imageId}`), which may need `{id}` instead.
- **Parser:** canonical `https://imgur.com/a/{id}` for albums and gallery posts, `https://imgur.com/{id}` for images; `id` the `data-id` (`a/04b1CmA`, `yOBT04V`); `kind: 'post'`, `variant: 'iframe'` (D100). `src` template `https://imgur.com/{data-id}/embed?pub=true`; 500 px until the message; `maxWidth` 540. Kept options: `context` (`false`) from `data-context`, `analytics` (`false`) from `data-analytics`. Dropped: `ref`, `w`, `lang`.
- **Fallback link:** the dialog's `href` is protocol-relative. The fallback whitelist keeps only `http(s)` URLs, so the link must be read as `https:` or it loses its `href`.
- **Frames the parser accepts (`ownsFrame`):** none; Imgur's code has no iframe.
- **A missing post** (`a/zzzzzzZ`) answers 404 with `X-Frame-Options: DENY`: the frame stays blank, `load` fires and no message arrives, so the D81 height timeout reports it.
- **Mature posts:** not verified. No neutral mature post exists to test with (D80).
- **Sample:** `@imgur`'s "It's Imgur's 16th Birthday Week! Share Memories and Reminisce." (`04b1CmA`) and its first image `yOBT04V`.

### D95. Tenor: the iframe works without `embed.js`

- **Embed dialog** (`tenor/embed-dialog.html`, the `</>` button, which also copies the code): `<div class="tenor-gif-embed" data-postid="{id}" data-share-method="host" data-aspect-ratio="1" data-width="100%"><a href="https://tenor.com/view/{slug}-gif-{id}">{title}</a>from <a href="https://tenor.com/search/{term}-stickers">{term} Stickers</a></div> <script type="text/javascript" async src="https://tenor.com/embed.js"></script>`. The second link ("from …") is part of the fallback content.
- **oEmbed** (`tenor/oembed.html`): `<iframe src="https://tenor.com/embed/{id}" width="600" height="400" frameborder="0"></iframe>`, 600×400 for a square sticker: oEmbed's size is not the GIF's.
- **`embed.js`** builds `https://tenor.com/embed/{data-postid}`, adding `?canonicalurl={page}` for `data-share-method="host"`. With `data-height` it uses `data-width`×`data-height`; otherwise a wrapper with `padding-top: (1 / ratio) × 100%`, the ratio `data-aspect-ratio` or 1.33.
- **The frame renders on its own:** `tenor.com/embed/{id}` without `embed.js` showed the sticker. It posts only player.js's `ready` event, from `https://tenor.com`, and sends no `frame-ancestors` or `X-Frame-Options`.
- **Ids are up to 20 digits** (`12328062661350661133`), beyond 2⁵³: strings only.
- **URLs:** `tenor.com/view/{slug}-gif-{id}`, also for stickers, and `tenor.com/{locale}/view/…` (`en-GB`). `tenor.com/view/{id}` redirects (301) to the full URL.
- **Parser:** canonical `https://tenor.com/view/{id}`, `kind: 'video'`, `variant: 'iframe'`, `src` `https://tenor.com/embed/{id}`. Ratio from `data-aspect-ratio`, else `width`/`height`. **Default for a URL: 1.33**, `embed.js`'s own default, instead of the brief's 1:1 (controller ruling, 2026-11-21). `maxWidth`: none (the code's `data-width` is `100%`). Options: none kept; dropped `data-share-method`, `canonicalurl`, `data-width`.
- **Frames the parser accepts (`ownsFrame`):** `tenor.com` with path prefix `/embed/`.
- **A missing GIF** shows plain "404 Not Found"; `load` fires.
- **Sample:** every item on Tenor's own account (tenor.com/official/tenor, first 25 checked) is a sticker. The fixture uses "Happy Cat Day" (`12328062661350661133`); stickers embed exactly as GIFs.

### D96. Streamable: two player paths, four code shapes

- **Codes seen:**
  - `streamable/api-embed-code.html`, the `embed_code` of `api.streamable.com/videos/{id}`: a wrapper `width: 100%; height: 0px; position: relative; padding-bottom: 56.25%;` around `<iframe class="streamable-embed" src="https://streamable.com/o/{id}" frameborder="0" scrolling="no" style="…" allowfullscreen>`.
  - `streamable/oembed.html`, `api.streamable.com/oembed.json`: the same iframe at `width="1280" height="720"`, no wrapper.
  - `streamable/player-copy-embed.html`, the player's right-click → Copy embed code: `<iframe src="https://streamable.com/e/{id}" width="100%" height="100%" … style="…position:absolute…"></iframe></div>`. It closes a `div` it never opens, and the package's HTML parser rejects any unmatched end tag. **Ruling (controller, 2026-11-21): accepted.** The Streamable parser tolerates exactly one trailing unmatched `</div>` after its iframe, for Streamable only (Task 4); every other unmatched end tag is still rejected.
  - `streamable/embed-docs.html`, derived from the help center's "Editing the Embed Code": a wrapper `width: 100%; height: 0px; position: relative; padding-bottom: 56.250%;` around an `/e/{id}` iframe.
- **Not seen:** the dashboard's Embed button ("Build Embed Code"), which needs the video's owner signed in. The code the brief expects (`allow="fullscreen;autoplay"`, wrapper `position:relative; width:100%; height:0px; padding-bottom:56.250%`) was in none of the sources.
- **Both paths play:** `streamable.com/e/{id}` and `/o/{id}` (another control skin). `/e/` posts player.js's `ready` from `https://streamable.com`; neither posts a height or refuses framing.
- **Player parameters** (help center): `loop=0`, `autoplay=1`/`0`, `nocontrols=1`, `hd=1`, `muted=1`. Not tested one by one.
- **Parser:** canonical `https://streamable.com/{id}`, `id` the short code (6 lowercase letters or digits; the API docs show a 5-character one), `kind: 'video'`, `variant: 'iframe'`. `src` template `https://streamable.com/e/{id}` plus kept options. Ratio from the wrapper's padding, else `width`/`height`, else 16:9; `maxWidth`: none. Kept options: `loop`, `autoplay`, `nocontrols`, `hd`, `muted`. Dropped: everything else. The two wrapper styles above are the D14 exceptions.
- **Frames the parser accepts (`ownsFrame`):** `streamable.com` with path prefixes `/e/` and `/o/`.
- **A missing video** shows "Oops! We couldn't find your video." An expired one: not verified, as no expired id was known.
- **Sample:** "chameleon" (`lttg48`), one of nine clips that Streamable's own home page plays; Streamable has no public account page. The others are a podcast, a donut, a fair, friends reacting, guitar, online gaming, fireworks and football.

### D97. Strava: a placeholder, a frame that posts its height once

- **Embed code:** Strava's dialogs need a signed-in account and were not seen. Public pages show `<div class="strava-embed-placeholder" data-embed-type="activity" data-embed-id="{id}" data-style="standard" data-from-embed="false"></div><script src="https://strava-embeds.com/embed.js"></script>`, and an older form with single quotes and no `data-style`. `strava/route-derived.html` is that form with a route.
- **`embed.js`** (last modified 2026-11-05) replaces each `.strava-embed-placeholder` with an iframe `https://strava-embeds.com/{type}/{id}?{params}#ns={uuid}&hostOrigin=…&hostPath=…&hostTitle=…[&mapHash=…]`. Every data attribute but `embed-type`, `embed-id` and `map-hash` becomes a query parameter under its camel-case name (`style`, `fromEmbed`, `fullWidth`). The frame is 554 px wide (100% for a route with `fullWidth=true`), 250 px at least, at most 100%, and 650 px high. It listens, with no origin or source check, for arrays whose first item is the `ns`; `BROADCAST_IFRAME_HEIGHT` sets the height. On window focus it posts `[ns, 'BROADCAST_HOST_FOCUS', {}]`.
- **The frame** posts `[ns, "BROADCAST_IFRAME_HEIGHT", height]` once, unasked, before `load`, from `https://strava-embeds.com`; `ns` is `null` without `#ns=`. No message follows a width change. Route: 571 at 554 px; 694 at 760 px with `style=minimal&fullWidth=true`.
- **Types:** `activity` and `route` render; `segment` returns 404. The profile and club cards of Strava's support article are other widgets.
- **Ids:** curated routes have 19 digits (`3247927232574435836`), so strings; small ids exist too (`route/1`).
- **Parser:** canonical `https://www.strava.com/activities/{id}` and `https://www.strava.com/routes/{id}`; `id` the number as a string; `kind: 'post'`, `variant: 'iframe'` (D100). `src` template `https://strava-embeds.com/{type}/{id}?style={style}[&fullWidth=true]#ns={token}[&mapHash=…]`; 650 px until the message; `maxWidth` 554, none for a full-width route. Kept options: `style` (`standard`, `minimal`; both render), `fullWidth` (routes), `mapHash`. Dropped: `fromEmbed` (the frame renders the same without it) and anything else. `data-embed-type` and `data-embed-id` are content (D68).
- **Frames the parser accepts (`ownsFrame`):** none; Strava's code has no iframe.
- **A missing or private item** (`activity/1`, an unknown route id) shows "This content is unavailable." with "View on Strava" and "Error code: 9CF", 521 px high. A private item was not checked separately.
- **Sample:** "Wonderland Trail" in Acadia National Park, a route Strava curates (its page reads "See Strava's Route"; logged out it asks to log in, but the embed renders). **No activity** from Strava's own account was found logged out, and no private person's activity was used, so the activity sample is open.

### D98. Flickr: the script writes the frame itself; the package builds the frame from the id

- **Share → Embed** (`flickr/embed-dialog*.html`): `<a data-flickr-embed="true" href="https://www.flickr.com/photos/{user}/{id}/" title="{title}"><img src="https://live.staticflickr.com/{server}/{id}_{secret}_{size}.jpg" width="…" height="…" alt="{title}"/></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>`. The default size is the largest (X-Large 4096 × 2301, with the secret of the large sizes); the list runs from 75 × 75 up. Header, Footer and Slideshow add `data-header="true"`, `data-footer="true"` and `data-context="true"`. An album links to `…/albums/{albumId}` and shows its cover.
- **oEmbed** (`flickr/oembed.html`, `oembed-album.html`): the title gains "by Flickr, on Flickr", the script is `https:`, the image is the 1024 px `_b`, and `<img …>` is not self-closed. The album's oEmbed uses single quotes and the cover photo's own title as `alt`.
- **The script does not create a framed URL.** `client-code.js` loads `embedr-loader.js`, which loads `widgets.flickr.com/embedr/embedr-{hash}.js`. For each `[data-flickr-embed="true"] img` wider than 150 px it fetches `https://embedr.flickr.com/photos/{id}?width={w}&height={h}&secret={secret}&{options}` (albums: `/photosets/{albumId}`) with the header `X-Embedr-Referrer: {page URL}`. It then `document.write`s the answer into an iframe that has no `src`. Flickr's HTML therefore runs in the host page's origin: in the probe, its messages came from `http://localhost:4173`. The frame took the image's pixel size (1024 × 575, `max-width: none`).
- **Options** the script reads from data attributes: `header`, `footer`, `comment-count`, `fave-count`, `branding`, `truncate`, `letterbox`, `context`, `lang`, `sharing`, `vr`, `gp`.
- **The frame URL works from the photo id alone,** with no user and no secret: `https://embedr.flickr.com/photos/55618331478?width=800&height=449` rendered in an iframe. It sends no `X-Frame-Options` or `frame-ancestors`. **`width` and `height` are required:** without them the image is `width="NaN"` and broken. They set the content's pixel size, so they must match the frame: a 400 × 225 frame with 800 × 449 showed its top-left quarter. A later resize of the frame does not reflow it. A ratio that differs from the photo's letterboxes in black (600 × 600). `header=true` overlays the photo, adding no height. `/photosets/{albumId}?width=…&height=…` renders the album as a slideshow.
- **Messages:** `{name: 'loaded', data: '{photoId}'}` when the image loads; the album frame posted it about 25 times in 1.5 s. `update:resize` and `update:height` exist in the frame's code (on window resize, on opening the description) and were not seen. No height on load.
- **`flic.kr/p/{code}`:** `2sJNueC` decodes to `55618331478` in the alphabet `123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ`, and `flic.kr/p/2sJNueC` redirects (302) to `www.flickr.com/photo.gne?short=2sJNueC`.
- **Parser:** canonical `https://www.flickr.com/photos/{user}/{id}/` and `https://www.flickr.com/photos/{user}/albums/{albumId}`; `id` the photo or album number; `kind: 'post'`, `variant: 'iframe'` (D100). The `src` template is `https://embedr.flickr.com/photos/{id}?width={px}&height={px}`, or `/photosets/{albumId}?…` for an album, plus kept options. The package builds it on the client at the box's pixel width and the photo's ratio, and rebuilds it when the box width changes (D100). Ratio from the image's `width` and `height`; for a URL, 4:3, the size Flickr's oEmbed gives albums (800 × 600), with letterboxing for other photos. `maxWidth`: the image's `width`. Kept options: `header`, `footer`, `context`. Dropped: the secret, the size suffix, the other display options.
- **Frames the parser accepts (`ownsFrame`):** none; Flickr's code has no iframe.
- **A missing photo:** `embedr.flickr.com/photos/{id}` answers 404 with the text "Photo not found".
- **Sample:** "Flickr for the Planet Feature - Rio Arrayanes, Patagonia Argentina" (`55618331478`), a landscape posted by Flickr's own account (a member's photo it features), and the album "Flickr Fundamentals and Flickr FAQs" (`72157716823987722`), Flickr's help videos and graphics.

### D99. Rumble: page and embed ids differ; iframe only

- **Embed dialog** (`rumble/embed-dialog-iframe.html`, video → Embed, logged out, "IFRAME"): `<iframe class="rumble" width="640" height="360" src="https://rumble.com/embed/{embedId}/?pub=4" frameborder="0" allowfullscreen></iframe>`. Logged out the dialog writes `pub=4`.
- **The "JavaScript" option** (`rumble/embed-dialog-js.html`): an inline loader that adds `https://rumble.com/embedJS/u4…`, then `<div id="rumble_{embedId}"></div>` and `Rumble("play", {"video":"{embedId}","div":"rumble_{embedId}"})`. It has no iframe, so neither the Rumble parser (iframe only, brief §4.7) nor the generic path accepts it.
- **oEmbed** (`rumble/oembed.html`): `<iframe src="https://rumble.com/embed/{embedId}/" width="3840" height="2160" frameborder="0" title="{title}" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>`, the video's own size.
- **The ids differ:** the page `rumble.com/v15atp3-….html` embeds as `v12onr1`, and `rumble.com/embed/v15atp3/` shows "Video not found". The page's JSON-LD `embedUrl` holds the embed id. A URL therefore needs a lookup, as the brief says.
- **The frame** plays with or without `pub`. It posts the string `get` and Google IMA messages, never a height.
- **Player parameters:** none found. The dialog writes only `pub`, and Rumble's player docs (`player.rumble.com/developers`) answered HTTP 421.
- **Parser:** canonical `https://rumble.com/embed/{embedId}/`; `id` the embed id (`v` and lowercase letters or digits); `kind: 'video'`, `variant: 'iframe'`. `src` template `https://rumble.com/embed/{embedId}/`, plus `?pub=` when given; ratio from `width`/`height`, else 16:9; `maxWidth`: none. Kept: `pub`, as given and never added. Dropped: everything else.
- **Frames the parser accepts (`ownsFrame`):** `rumble.com` with path prefix `/embed/`.
- **A missing video** shows "Video not found" (`v12onzz`).
- **Sample:** "Rumble Basics: How to Upload a Video (iOS App)", a help video that Rumble's help center (rumble.support) links to, uploaded by the verified account `rumble.com/user/Mario`. Rumble's `c/Rumble` and `user/Rumble` have no videos, and `c/HowtoRumble` and `c/RumbleHelpVideos` listed none logged out.

### D100. Script or frame: the mechanism per platform

| Platform     | Mechanism                      | Frame URL                                                      | Height message (origin, data)                                                    | Ask first?              |
| ------------ | ------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------- |
| Truth Social | `iframe`                       | `https://truthsocial.com/@{user}/{id}/embed`                   | `https://truthsocial.com`, the object `{type: 'setHeight', id, height}`          | no (D93)                |
| Imgur        | `iframe`                       | `https://imgur.com/{a/}{id}/embed?pub=true[&context=false]`    | `https://imgur.com`, a JSON string with `message: 'resize_imgur'` and `height`   | no; once, at `load`     |
| Strava       | `iframe`                       | `https://strava-embeds.com/{type}/{id}?style=…#ns={token}`     | `https://strava-embeds.com`, the array `[ns, 'BROADCAST_IFRAME_HEIGHT', height]` | no; once, before `load` |
| Flickr       | `iframe`, built by the package | `https://embedr.flickr.com/photos/{id}?width={px}&height={px}` | none on load; size from the image's ratio                                        | —                       |

- **Truth Social, Imgur, Strava: the frame directly.** Each frame posts its height unasked from a fixed origin, so the existing message path (D55) checks origin and source and needs no request. **Ruling (controller, 2026-11-21): `MessageHeight` gains no request;** the optional request of brief §4.1 is dropped. Truth Social's frame would also answer `{type: 'setHeight', id}` posted to it with `'*'` by tagging its later messages with that `id`; the origin and source check makes that unnecessary. Strava's `ns` only has to be in the fragment for the frame to echo it; any token will do.
- **Truth Social video posts (controller, 2026-11-21):** their reported height leaves out the video. Embed code with `truthsocial-video` adds 165 px to it, as Truth Social's script does; a URL takes the reported height. Vertical videos stay cut off (D93). Not chosen: the reported height alone, and a scrolling frame for videos.
- **Flickr: the package builds the frame (maintainer, 2026-11-21).** The brief expected a frame at `embedr.flickr.com/photos/{id}`, but Flickr's script frames no URL: it writes Flickr's HTML into a same-origin iframe (D98). The package instead builds `https://embedr.flickr.com/photos/{id}?width={px}&height={px}` on the client, from the box's pixel width and the photo's ratio, and rebuilds it when the box width changes. URL input works, at 4:3 by default. Mechanism `iframe`; Flickr's script is accepted in embed code and never loaded. The frame URL is undocumented. Not chosen:
  - running Flickr's script, which runs Flickr's code in the host's origin and makes the frame as wide as the image (4096 px for the dialog's default);
  - a frame at the code's fixed pixel size, which is not responsive.
- **Flickr from an id alone:** yes, given any `width` and `height`; the user name and the secret are not needed (D98).
- **Rumble page and embed ids differ:** yes (D99).

## Open VERIFY items

| ID  | Item                                            | Milestone | Status                                          |
| --- | ----------------------------------------------- | --------- | ----------------------------------------------- |
| V1  | Threads manual initialisation (§3)              | 5         | resolved: `instgrm.Embeds.process()` (D25, D32) |
| V2  | TikTok manual initialisation (§3)               | —         | no longer applies (D11)                         |
| V3  | Facebook post URL shapes the SDK accepts (§4.2) | 2         | resolved (D21)                                  |
| V4  | Default `maxWidth` per platform (§6)            | 4, 5      | resolved (D30, D33)                             |
| V5  | Fluid-width attribute per platform (§6.1)       | 5         | resolved (D33)                                  |
