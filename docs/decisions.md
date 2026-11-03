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

pnpm 12 gates packages younger than its minimum release age. vitest 5.1.0 (published 2026-11-02) was inside that window at install time, so pnpm added `minimumReleaseAgeExclude` entries for `vitest`, `@vitest/mocker` and `@vitest/spy` 5.1.0 to `pnpm-workspace.yaml`. The gate is 24 hours: vitest 5.1.0 was published at 2026-11-02 16:02 UTC and clears it at 2026-11-03 16:03 UTC. A removal attempt at 15:25 UTC failed with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, so remove the entries at the next commit after that time.

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
- **Locale:** the SDK script URL `connect.facebook.net/{locale}/sdk.js` carries the locale; the parser exposes it as `options.locale`. The `version` in the script URL is not extracted: it is the Graph API version, which is a script loader decision for Milestone 3.
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

## Open VERIFY items

| ID  | Item                                            | Milestone | Status                                           |
| --- | ----------------------------------------------- | --------- | ------------------------------------------------ |
| V1  | Threads manual initialisation (§3)              | 5         | open                                             |
| V2  | TikTok manual initialisation (§3)               | —         | no longer applies (D11)                          |
| V3  | Facebook post URL shapes the SDK accepts (§4.2) | 2         | resolved (D21)                                   |
| V4  | Default `maxWidth` per platform (§6)            | 4, 5      | Threads 658 (D17), Instagram 540 (D23) confirmed |
| V5  | Fluid-width attribute per platform (§6.1)       | 5         | Facebook answered (D19)                          |
