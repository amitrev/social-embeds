# social-embeds — Wave 2 Brief

Draft, 2026-11-18. Adds five platforms: **Telegram, Snapchat, LinkedIn, Reddit and Pinterest**. Everything in [project-brief.md](./project-brief.md) still applies: its non-goals (§2), the two inputs (§4), the parser/renderer split (§5), the shared component contract (§6) and the working method (§10). This brief only lists what is new. Items marked **VERIFY** need evidence before code, written up in `docs/decisions.md`.

## 1. Why these five

Ranked by popularity among the platforms that are not supported yet. Platforms that offer no web embed for a post (WhatsApp, WeChat, Messenger, Viber, Discord) are left out, however popular.

| Platform  | Worldwide                                           | Bulgaria (ad reach, late 2025)  | Embed exists |
| --------- | --------------------------------------------------- | ------------------------------- | ------------ |
| Telegram  | ~1B monthly users                                   | no figure; a top messaging app  | yes          |
| Snapchat  | ~970M monthly users (Q2 2026)                       | 2.35M (35.1% of the population) | yes          |
| Pinterest | ~631M monthly users                                 | no figure                       | yes          |
| Reddit    | 126.8M daily users (Q1 2026)                        | 994K (14.8%)                    | yes          |
| LinkedIn  | 1.2B+ registered members (not monthly active users) | 1.60M members (23.9%)           | yes          |

Sources: [DataReportal, Digital 2026: Bulgaria](https://datareportal.com/reports/digital-2026-bulgaria), [DataReportal, global social media statistics](https://datareportal.com/social-media-users), [Exploding Topics](https://explodingtopics.com/blog/top-social-media-platforms), [DreamGrow](https://www.dreamgrow.com/top-15-most-popular-social-networking-sites/), [Stacked Marketer](https://www.stackedmarketer.com/news/pinterests-user-base-keeps-growing-blueskys-not-so-much/), [WMTips, messaging apps in Bulgaria](https://www.wmtips.com/technologies/instant-messaging/country/bg/). Aggregator figures are estimates.

Not in wave 2 (wave 3 candidates, still "do not design out"): Spotify, Vimeo, Twitch. Twitch's player requires `parent={host domain}`, which is known only in the browser.

Not planned: Bluesky, which has no visible use in Bulgaria (maintainer decision, 2026-11-18).

## 2. Platforms

All five probed on 2026-11-18 by reading each platform's own script. Findings below are what the scripts do; real embed code from each platform's Embed dialog is still needed for fixtures (§10 of the project brief).

### 2.1 Telegram — iframe sized by messages

- **Embed code:** a `<script async src="https://telegram.org/js/telegram-widget.js?22" data-telegram-post="{channel}/{id}" …>` tag. The script tag _is_ the embed element. `telegram-widget.js` also accepts `<blockquote class="telegram-post" data-telegram-post="…">`.
- **What the script does:** builds `<iframe src="https://t.me/{channel}/{id}?embed=1&…">` with width `data-width` (default `100%`), `min-width: 320px`, no height, `scrolling="no"`. It copies these attributes into the query: `comment`, `userpic`, `mode`, `single` (by presence), `color`, `dark`, `dark_color`. It listens for `message` events from `https://t.me` whose JSON `data` is `{ "event": "resize", "height": n }` and sets the iframe's height. It also answers `ready`, `visible_off` and focus events.
- **Rendering:** the package builds the same iframe itself; no script. Height comes from the resize messages (§3.2).
- **URL input:** `https://(t|telegram).me/{channel}/{id}`, `https://t.me/s/{channel}/{id}`, with `?single` and `?comment={id}` kept. Private links (`t.me/c/…`) return `null`.
- **Fallback content:** none.
- **VERIFY:**
  - which form the Embed dialog on `t.me` produces today (script or blockquote);
  - whether the iframe sends `resize` without the script's `ready`/focus/visibility handshake;
  - the widest the post renders, for the default `maxWidth`.

### 2.2 Snapchat — iframe

- **Scope:** every content type Snapchat embeds (maintainer decision, 2026-11-18). [Snap's embed docs](https://developers.snap.com/api/snapchat-for-web/social-plugins/embedding-web-content) list five: Spotlight videos, Lenses, Public Profiles, Public Stories and Saved Stories. Spotlight is `kind: 'video'`; the others are `kind: 'post'`.
- **Embed code:** `<blockquote class="snapchat-embed" data-snapchat-embed-url="https://www.snapchat.com/{type}/{id}/embed" data-snapchat-embed-width data-snapchat-embed-height data-snapchat-embed-style data-snapchat-embed-title>` with an `<a>` inside, plus `<script async src="https://www.snapchat.com/embed.js">`. Snap's example (a Lens) writes 416×692.
- **What the script does:** on window `load` (or a `loadEmbed` event) it replaces every `.snapchat-embed` blockquote with an iframe whose `src` is `data-snapchat-embed-url`, size from the width/height attributes (default 340×700), `allow="autoplay; camera; microphone; clipboard-write;"`, `allowfullscreen`, `scrolling="no"`, and `data-snapchat-parent-url` set to the page URL. It has no global and no other behaviour. The script is the same for every content type.
- **Rendering:** the package renders that iframe itself, as with TikTok (D11). Aspect ratio from the embed code's width and height, 416:692 when absent.
- **`data-snapchat-embed-style`** is free-form CSS. It is not copied (strict input, no arbitrary styles reach the page).
- **URL input:** the content URL; the iframe `src` is the URL plus `/embed`. Known shapes: `https://(www.)snapchat.com/spotlight/{id}` and `https://(www.)snapchat.com/lens/{id}`. Short links (`t.snapchat.com/…`) need a redirect: `null`.
- **Fallback content:** none, as with TikTok.
- **VERIFY:**
  - the URL shapes of Public Profiles (likely `/add/{username}` or `/@{username}`), Public Stories and Saved Stories, from real share links on snapchat.com;
  - that each of them serves an `/embed` page, and its natural size (a profile is not 9:16);
  - whether the `/embed` page needs the `allow` list or `data-snapchat-parent-url`.

### 2.3 LinkedIn — iframe with a fixed height

- **Embed code:** `<iframe src="https://www.linkedin.com/embed/feed/update/urn:li:{share|ugcPost}:{id}" height width="504" frameborder="0" allowfullscreen title="Embedded post">`.
- **Problem:** the height is the post's content height at that width, the same problem as Facebook's `plugins/post.php` (project brief §5.4), and LinkedIn has no SDK to fall back on.
- **Rendering:** `width: 100%`, `maxWidth` = the embed code's width (504 when absent). Height, first match wins:
  1. the `height` prop;
  2. the embed code's `height`;
  3. a default height (maintainer decision, 2026-11-18), used for URL input.
- **URL input:** `https://www.linkedin.com/feed/update/urn:li:{activity|share|ugcPost}:{id}` and `https://www.linkedin.com/posts/{slug}-activity-{id}-{suffix}`, the latter mapped to `urn:li:activity:{id}`.
- **Limitation to document:** a default height can never fit every post. A short post leaves empty space below it, and a long one is cut or scrolls inside the frame. Hosts that know the height pass `height`, or use embed code.
- **VERIFY:**
  - whether the embed iframe posts a height message (then it uses §3.2 instead and the default height only shows until the first message);
  - whether `/embed/feed/update/urn:li:activity:{id}` renders, since post URLs carry an activity id;
  - what happens to the content when the iframe is narrower than the width it was built for;
  - whether content taller than the iframe is cut or scrolls;
  - the default height: measure the embed code heights of 10 or more real posts (text only, one image, a link card, a video) and pick one that fits the common image post without much empty space.

### 2.4 Reddit — iframe sized by messages

- **Embed code:** `<blockquote class="reddit-embed-bq" data-embed-…><a href="https://www.reddit.com/r/{sub}/comments/{id}/{slug}/">…</a> …</blockquote>` plus `<script async src="https://embed.reddit.com/widgets.js" charset="UTF-8">`.
- **What the script does:**
  - **Selectors:** `.reddit-embed-bq`, `.reddit-everywhere-bq`, `.reddit-card`, `.embedly-card`, `.reddit-embed`.
  - **Iframe source:** takes the first reddit.com post or comment link inside the element and builds `https://embed.reddit.com/{path}/?{params}`. The params come from `data-embed-*`: `depth`, `style`, `theme`, `showmedia`, `showtitle`, `showedits`, `created`, `height`, `locale`, `showusername`, `snippet`, and the `utm_*` values. It adds `embed_host_url` (the page's origin and path).
  - **Iframe attributes:** width `640px`, `max-width: 100%`, `sandbox="allow-scripts allow-same-origin allow-popups"`, `allow="clipboard-read; clipboard-write"`, `scrolling="no"`.
  - **Height:** set from `message` events whose JSON `data` is `{ "type": "resize.embed", "data": n }` and whose source is that iframe.
  - **Re-render:** the script runs once and exposes no global to re-scan, so it cannot render embeds added later.
- **Rendering:** the package builds the iframe itself; no script. Height from §3.2. Default `maxWidth` 640.
- **URL input:** `https://(www.|old.|new.)reddit.com/r/{sub}/comments/{id}(/{slug})?/`. Short links (`redd.it/{id}`, `reddit.com/r/{sub}/s/{code}`) need a redirect: `null`.
- **Approach** (maintainer decision, 2026-11-18): the three points below.
- **Comments:** comment permalinks (`…/comments/{id}/{slug}/{commentId}/`) are supported too, as `kind: 'post'`, with `depth` from the embed code. News sites embed single comments (answers in an AMA, a reply that became the story) as often as posts, and it is the same iframe.
- **`embed_host_url`** is not sent. It tells Reddit which page the embed is on; the package adds nothing the host did not ask for. If the embed does not render without it, record that and send it.
- **Fallback content:** none, as with the other iframe platforms. The blockquote holds only the title, the author and the subreddit as links. Showing it until the iframe loads would be a new behaviour for iframes; it can be added later without breaking anything.
- **VERIFY:**
  - whether the embed renders without `embed_host_url`;
  - the attributes the Embed dialog writes today, for a post and for a comment;
  - the `depth` values a comment embed accepts.

### 2.5 Pinterest — script + manual initialisation (Group A)

- **Embed code:** `<a data-pin-do="embedPin" data-pin-width="{small|medium|large}" href="https://www.pinterest.com/pin/{id}/"></a>` plus `<script async defer src="//assets.pinterest.com/js/pinit.js">`.
- **What the script does:**
  - **Loader:** `pinit.js` is a 290-byte loader. Once per day per page (a `PIN_{day}` window counter) it adds `https://assets.pinterest.com/js/pinit_main.js?{random}`.
  - **Init:** `pinit_main.js` exposes `window.PinUtils` with `build(element)`.
- **Rendering:** script-based. Load `pinit_main.js` directly, write the anchor without `data-pin-do`, and add the attribute just before calling `PinUtils.build(container)` (same pattern as D39).
- **URL input:** `https://(www.|{cc}.)pinterest.{tld}/pin/{id}/`. `pin.it/{code}` short links: `null`. Boards and profiles (`embedBoard`, `embedUser`) are out of scope.
- **VERIFY:**
  - whether `pinit_main.js` scans the page on load;
  - whether `build(element)` processes only that subtree;
  - the ready signal (what DOM appears when a pin has rendered);
  - pixel widths of `small`/`medium`/`large`;
  - that loading `pinit_main.js` directly behaves like loading `pinit.js`;
  - whether a host page that already loaded `pinit.js` can be detected.
- **Alternative if the script cannot be driven per element:** the iframe `https://assets.pinterest.com/ext/embed.html?id={id}` exists (HTTP 200) but is undocumented.

## 3. Shared changes

### 3.1 Types

- `Platform` gains `'telegram' | 'snapchat' | 'linkedin' | 'reddit' | 'pinterest'`.
- `kind` stays `'post' | 'video'`: Snapchat Spotlight is `video`; Snapchat Lenses, profiles and stories, and every other platform, are `post`.
- `variant` is `iframe` for all but Pinterest (`sdk`).
- Widening `Platform` breaks host code with an exhaustive `switch` on `embed.platform` at the type level. Pre-1.0 this is a minor bump, but the changeset says so.

### 3.2 Iframes sized by messages (new mechanism)

Telegram and Reddit, and LinkedIn if it posts heights, render an iframe whose height the platform reports with `postMessage`. Today's iframes use an aspect ratio (§6.1 of the project brief). `IframeEmbed` gains a third sizing mode:

- Width `100%` up to `maxWidth`. Height starts at the placeholder's `minHeight`.
- **Accepting a message:** only when `event.source === iframe.contentWindow` and `event.origin` is the platform's own origin (`https://t.me`, `https://embed.reddit.com`).
- **Parsing:** a per-platform function reads the height from the message's `data` and returns a number or nothing. Anything else is ignored.
- **`onLoad`:** fires on the first height message, not on the iframe's `load` event, because the iframe loads before the post has a height.
- **Unmounting:** removes the listener.
- **Timeout:** the existing init timeout and retry apply if no height arrives.

### 3.3 Other touch points

Listed per platform in CONTRIBUTING's "Adding a platform":

- `src/parser/platforms/{platform}.ts`
- `src/parser/verify.ts` (kind/variant pairs)
- `src/loader/platform-scripts.ts` (Pinterest only)
- `src/components/drivers.ts` (Pinterest only)
- a component per platform, exported from `src/index.ts`
- routing in `src/components/social-embed.tsx`
- fixtures under `test/fixtures/{platform}/`
- playground pages and `/many`
- README platform table

`height` on `<SocialEmbed>` reaches Snapchat and LinkedIn (fixed-size iframes), not Telegram or Reddit (sized by messages).

## 4. Milestones

Strictly in order, each finished and verified in a browser before the next.

1. **Research.** Real embed code for public posts from each platform's Embed dialog, saved as fixtures. Resolve every VERIFY above into `docs/decisions.md` entries.
2. **Parser.** `parseEmbed` and `matchUrl` for the five platforms, with tests for every fixture variant and URL shape.
3. **Message-sized iframes (§3.2)** in `IframeEmbed`, with tests that fake the platform's messages, including messages from the wrong origin or source.
4. **Iframe platforms:** `TelegramEmbed`, `RedditEmbed`, `SnapchatEmbed`, `LinkedInEmbed`.
5. **Pinterest:** script entry, driver, `PinterestEmbed`.
6. **Dispatcher and playground:** routing in `<SocialEmbed>`, one playground page per platform, the new platforms on `/many`, and a client-navigation check.
7. **README and changeset:** platform table rows, URL formats, options, limitations, and a minor changeset that calls out the widened `Platform` type.
