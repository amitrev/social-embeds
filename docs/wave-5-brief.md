# social-embeds — Wave 5 Brief

Draft, 2026-11-21. Adds a **generic iframe embed** for any iframe embed code no platform claims, and seven platforms: **Truth Social, Imgur, Tenor, Streamable, Strava, Flickr and Rumble**. Everything in [project-brief.md](./project-brief.md) still applies: its non-goals (§2, including no network calls from the package), the two inputs (§4), the parser/renderer split (§5), the shared component contract (§6) and the working method (§10), except where §2 below relaxes D14 for iframes on purpose. Earlier waves' patterns are reused: strict parsing for named platforms, canonical URLs that `verifyEmbed` enforces (D57), options that never replace verified content (D68), iframes created on the client (D28), and the load and height timeouts (D81, D91). Items marked **VERIFY** need evidence before code, written up in `docs/decisions.md`.

## 1. Why

**The package's job is to render embeds well:** create them only near the viewport, hold their space with a placeholder and a sized box, and report `load` and `error`. Which embeds a site uses is the site's own choice (maintainer, 2026-11-21). So any iframe embed code gets that treatment, from any host, with no list to configure.

**The seven platforms** are the social platforms still missing where the package can do more than the generic path: run the platform's script, take the height from the frame, or turn a plain URL into an embed (maintainer, 2026-11-21).

- **Truth Social:** posts that news sites worldwide embed every day.
- **Imgur:** image posts and albums from a large community.
- **Tenor:** GIFs, Giphy's counterpart, and the GIF source in many keyboards.
- **Streamable:** short video clips, widely used for highlights.
- **Strava:** activities and routes for sport and outdoor coverage.
- **Flickr:** the long-standing photo community.
- **Rumble:** video, with its own audience in news and commentary.

Skipped (maintainer, 2026-11-21): Mastodon, and Russian platforms (OK.ru, VK).

One release, 0.7.0 (my call): `Platform` gains seven names and the parser gains a public function, so a minor bump.

| Platform       | Embed                                                              | URL input                    |
| -------------- | ------------------------------------------------------------------ | ---------------------------- |
| Generic iframe | the pasted iframe, rebuilt from checked attributes                 | no: embed code only          |
| Truth Social   | iframe `truthsocial.com/…/embed` (expected), height from the frame | yes (VERIFY the embed path)  |
| Imgur          | blockquote + `s.imgur.com/min/embed.js`, height from the frame     | yes                          |
| Tenor          | div + `tenor.com/embed.js`, or iframe `tenor.com/embed/{id}`       | yes                          |
| Streamable     | iframe `streamable.com/e/{id}` in a responsive div                 | yes                          |
| Strava         | placeholder div + `strava-embeds.com/embed.js`                     | yes                          |
| Flickr         | `a[data-flickr-embed]` + `embedr.flickr.com/assets/client-code.js` | VERIFY, else embed code only |
| Rumble         | iframe `rumble.com/embed/{embedId}/`                               | no: needs a lookup (VERIFY)  |

## 2. Approaches

**Generic iframe, which hosts.** Three ways were weighed:

- **A list of allowed hosts that each site configures:** strict, but every site must maintain a list.
- **Any `https` iframe, always sandboxed:** nothing to configure, but a sandbox breaks most players.
- **A built-in list of known hosts that sites extend:** easy to use, but the package maintains the list forever.

**Chosen (maintainer, 2026-11-21): no host list at all.** Any `https` iframe renders. The package's job is rendering, and the site decides what it embeds. Safety comes from rebuilding the iframe from checked attributes (§3), not from limiting hosts.

**Generic iframe, where it lives in the code (my call).** Either:

- **a new `Platform`, `'iframe'`, inside `parseEmbed`:** one entry point, but it breaks the invariants every platform has today: a `matchUrl` pattern, a canonical URL for `verifyEmbed` (D57), a fixed `kind`, and the per-platform rows in the parity test; or
- **a separate `parseIframe`, tried after `parseEmbed`:** named platforms stay exactly as strict as now, and the generic path has its own small, documented contract.

Chosen: **the separate `parseIframe`.**

**Named platforms, script or iframe.** Truth Social, Imgur, Strava and Flickr each ship a script that turns markup into an iframe. As for Bluesky in wave 4, the builder picks per platform after VERIFY. **The iframe directly** needs no script and no page-wide scan, but depends on an undocumented URL and message format. **The script** follows the platform's own path. Recommended: the iframe wherever its URL and height messages prove stable; else the script.

## 3. Generic iframe

- **Input:** embed code only (`html`, or `embed` from `parseIframe`). A plain URL to an unknown site renders nothing, as today: the package cannot know its embed URL, and most sites refuse to be framed.
- **Exactly one `<iframe>`** in the code (my call). Markup around it (wrapper `div`s, links, captions, `<script>` tags) is accepted and dropped; no script ever runs. Two or more iframes: not a generic embed.
- **Kept attributes:** `src`, `width`, `height`, `title`, `allow`, `allowfullscreen`, `referrerpolicy`, `sandbox`, `scrolling="no"`.
- **Dropped:** `srcdoc`, every `on*` handler, `style`, `class`, `id`, `name`, `loading` (the package does lazy loading itself), and anything else not kept.
- **Rejected (the code is not a generic embed):** a `src` that is not `https:` (`http:`, `javascript:`, `data:`, `blob:`, relative), or that carries a user name or password. These, and `srcdoc`, are the only ways pasted code could run inside the host page; dropping or rejecting them limits no host (my call). A protocol-relative `src` (`//host/…`) is rewritten to `https:`, as `parseUrl` already does for named platforms, so older embed codes in CMS archives still render (my call).
- **Attribute values** are checked, not trusted (my call): `allow` keeps only the media features `autoplay`, `fullscreen`, `encrypted-media`, `picture-in-picture`, `clipboard-write` and `web-share`, and drops every other feature, such as `camera`, `microphone`, `geolocation`, `payment` and `clipboard-read`, because a delegated permission is granted in the host site's name (maintainer, 2026-11-21). Each kept feature keeps its origin list when every origin is `*`, `'self'`, `'src'`, `'none'` or an `https:` origin (dropping the list would turn `autoplay *` into `autoplay` and break players that redirect); `referrerpolicy` and `sandbox` keep only their spec's keywords; `width`/`height` keep only numbers or percentages.
- **Named platforms win.** `<SocialEmbed>` and `<social-embed>` try `parseEmbed` first, then `parseIframe`, then `fallback` / `error`. An iframe whose host belongs to a named platform (YouTube, Vimeo, Spotify, `facebook.com/plugins`, …) never goes generic, even when that platform's parser rejects it (my call), so the generic path cannot bypass a platform's checks. The guard covers exactly the iframe hosts each named parser accepts, with a path prefix where the parser keys on one (`www.facebook.com/plugins/`). Each platform module exports its list; no hand-kept second copy (my call). Not guarded, so they render generically: frames that a platform's own script creates (`platform.twitter.com/embed/…`, `embed.reddit.com`), and a platform's other hosts (`podcasters.spotify.com`). Whole domains are not guarded, because that would send those other embeds to `fallback`.
- **Size** (my call), from the first source that has it: the iframe's `width` and `height` attributes; else `px` values in its inline `style` (read for the size only, the style is still dropped), as Bandcamp's code carries them; else one wrapper's `padding-bottom` ratio, read with the existing `unwrapRatio` as for Vimeo, Dailymotion and Giphy, as Loom's code carries it. Numeric `width` and `height` give an aspect-ratio box at most `width` wide (as other iframe embeds). A percentage or missing `width` with a numeric `height` gives full width at that height (LinkedIn's fixed-height path, D53). No usable size: 16:9.
- **Title:** the code's `title`, else `Embedded content` (my call), so the frame always has an accessible name.
- **Behaviour:** the existing iframe path. Created on the client near the viewport, the placeholder until `load`, `onLoad` / `load` on `load`, and the 15 s load timeout (D91) with `social-embeds: {title} did not load`.
- **No height messages.** Embed codes that bring a resize script (Datawrapper, Flourish, Infogram) keep the height they give. Known resize messages are a possible later addition (§6).
- **API:** `parseIframe(html): ParsedIframe | null` in `social-embeds/parser`; a public `GenericIframeEmbed` component (name my call); `<SocialEmbed>` and `<social-embed>` route to it. The component takes the shared props (`width`, `maxWidth`, `height`, `maxHeight`, `placeholder`, `lazy`, `onLoad`, `onError`).
- **Behaviour change, called out in the changeset:** iframe code that `<SocialEmbed>` used to hand to `fallback` now renders. `fallback` still receives everything else, including rejected iframes.
- **Fixtures:** real codes from Google Maps, Datawrapper, Deezer, Mixcloud, Loom, TED and CodePen, each with a test.

## 4. Platforms

Mechanisms below are from each platform's public docs and oEmbed, as expected on 2026-11-21. Real code from each Embed or Share dialog is still needed for fixtures.

### 4.1 Truth Social

- **Embed code** (Embed menu on a post, expected, as Mastodon 3.x): `<iframe src="https://truthsocial.com/@{user}/{id}/embed" class="truthsocial-embed" style="max-width: 100%; border: 0" width="600" allowfullscreen="allowfullscreen"></iframe><script src="https://truthsocial.com/embed.js" async="async"></script>`.
- **URL input:** `truthsocial.com/@{user}/posts/{id}`; `www.` host. The numeric id is the post; the user name is kept for the canonical URL.
- **Rendering:** the iframe, with its height from the frame. Mastodon's `embed.js` asks each frame for its height (`{type: 'setHeight', id}`) and the frame answers with `{type: 'setHeight', id, height}`. If Truth Social works this way, the frame only answers when asked, which is new: `MessageHeight` gains an optional request the component posts to the frame on `load`, still checked by origin and source (my call).
- **Options:** none known.
- **VERIFY:** the Embed menu's exact code and embed path; the message format, and whether the frame waits to be asked; what a deleted post shows; whether Cloudflare's bot check ever blocks the frame for real visitors.

### 4.2 Imgur

- **Embed code** (Embed on a post, expected): `<blockquote class="imgur-embed-pub" lang="en" data-id="{id}"><a href="https://imgur.com/{id}">{title}</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>`. Albums and gallery posts use `data-id="a/{id}"`.
- **URL input:** `imgur.com/{id}`, `imgur.com/a/{id}`, `imgur.com/gallery/{slug}-{id}` and `imgur.com/gallery/{id}`; `i.imgur.com/{id}.{ext}` gives the image id; `m.` and `www.` hosts.
- **Rendering:** the iframe `embed.js` creates (`imgur.com/{id}/embed?pub=true…`, expected), with its height from the frame.
- **Fallback content:** the title link. Whitelisted (D35).
- **Options:** `data-context` (show the post's description), if VERIFY confirms it.
- **VERIFY:** the frame's URL and message format; gallery vs album ids; what a mature-content post shows logged out.

### 4.3 Tenor

- **Embed code** (Share → Embed, expected): `<div class="tenor-gif-embed" data-postid="{id}" data-share-method="host" data-aspect-ratio="1.33" data-width="100%"><a href="https://tenor.com/view/{slug}-gif-{id}">{title}</a></div><script type="text/javascript" async src="https://tenor.com/embed.js"></script>`.
- **URL input:** `tenor.com/view/{slug}-gif-{id}`, with an optional locale segment (`tenor.com/{lang}/view/…`). `media.tenor.com/…` file URLs carry another id: `null`.
- **Rendering:** an iframe `tenor.com/embed/{id}`, the aspect ratio from `data-aspect-ratio`; a URL carries none, so 1:1 as Giphy (VERIFY a better default).
- **Kind:** `video`, as Giphy.
- **VERIFY:** that `tenor.com/embed/{id}` renders on its own, without `embed.js`; the Embed dialog's code.

### 4.4 Streamable

- **Embed code** (Embed on a video, expected): `<div style="position:relative; width:100%; height:0px; padding-bottom:56.250%"><iframe allow="fullscreen;autoplay" allowfullscreen height="100%" src="https://streamable.com/e/{id}" width="100%" style="border:none; width:100%; height:100%; position:absolute; left:0px; top:0px; overflow:hidden;"></iframe></div>`.
- **URL input:** `streamable.com/{id}`, `streamable.com/e/{id}`.
- **Rendering:** the iframe in an aspect-ratio box. The ratio comes from the wrapper's `padding-bottom`; a URL gives 16:9. The wrapper needs a narrow exception to D14, as Giphy's: accepted and dropped.
- **Options:** the player parameters, after VERIFY (`autoplay`, `muted`, `loop`, …).
- **VERIFY:** the Embed dialog's code and parameters; what an expired or deleted video shows.

### 4.5 Strava

- **Embed code** (Share → Embed on an activity or route, expected): `<div class="strava-embed-placeholder" data-embed-type="activity" data-embed-id="{id}" data-style="standard" data-from-embed="false"></div><script src="https://strava-embeds.com/embed.js"></script>`.
- **URL input:** `www.strava.com/activities/{id}` and `www.strava.com/routes/{id}`. `strava.app.link/…` short links need a redirect: `null`.
- **Rendering:** the frame that `embed.js` creates (`strava-embeds.com/{type}/{id}?…`, expected), with its height from the frame if it reports one, else the script.
- **Options:** `data-style` (`standard`, `minimal`) and any others VERIFY finds. `data-embed-type` and `data-embed-id` are content, never options (D68).
- **VERIFY:** the frame URL and height messages; which embed types exist (activity, route, segment?); what a private or deleted activity shows.

### 4.6 Flickr

- **Embed code** (Share → Embed, expected): `<a data-flickr-embed="true" href="https://www.flickr.com/photos/{user}/{id}/in/…" title="{title}"><img src="https://live.staticflickr.com/{server}/{id}_{secret}_b.jpg" width="1024" height="683" alt="{title}"/></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>`. Albums link to `…/albums/{id}`.
- **URL input:** `www.flickr.com/photos/{user}/{id}`, with or without `/in/…`; `flic.kr/p/{code}`, whose code is the photo id in Flickr's base-58 alphabet, decoded without a network call (my call); albums `…/photos/{user}/albums/{id}`.
- **Rendering:** the script turns the link into an iframe (`embedr.flickr.com/photos/{id}`, expected). The image's `width` and `height` give the aspect ratio. A URL has no image, so it renders only if the embedr frame works from the id alone (VERIFY); else Flickr URLs are embed code only, with the "needs a lookup" error.
- **Fallback content:** the linked image, shown until the script runs (D34). Whitelisted: `a[href]` to `flickr.com` and `img` whose `src` is on `live.staticflickr.com` or `farm*.staticflickr.com` (my call).
- **VERIFY:** the embedr frame URL, and whether it works from an id alone; album embeds; the default aspect ratio for a URL.

### 4.7 Rumble

- **Embed code** (Embed on a video, expected): `<iframe class="rumble" width="640" height="360" src="https://rumble.com/embed/{embedId}/?pub={pubId}" frameborder="0" allowfullscreen></iframe>`.
- **URL input:** the page URL `rumble.com/{pageId}-{slug}.html` carries a different id from the embed id (VERIFY), so it renders nothing, and `onError` reports `social-embeds: a Rumble URL needs a lookup: use the embed code` (the wave 4 message shape). `matchUrl` accepts `rumble.com/embed/{embedId}/` as the canonical URL, as Bluesky's DID URLs.
- **Rendering:** the iframe, aspect ratio from `width`/`height`, else 16:9.
- **Options:** `pub` (Rumble's publisher id, kept as given, never added) and player parameters VERIFY finds.
- **VERIFY:** that page and embed ids really differ; the Embed dialog's code; Rumble's script player (`embedJS`) is not accepted, iframe only.

## 5. Shared changes

- `Platform` gains `'truthsocial' | 'imgur' | 'tenor' | 'streamable' | 'strava' | 'flickr' | 'rumble'`.
- `kind`: Truth Social, Imgur, Strava and Flickr `post`; Tenor, Streamable and Rumble `video`.
- `variant`: `iframe` for Tenor, Streamable and Rumble; Truth Social, Imgur, Strava and Flickr `sdk` or `iframe`, after the mechanism decision (§2).
- **Height from the frame** reuses Telegram's path; a frame that answers only when asked adds the optional request (§4.1).
- **Narrow D14 exceptions:** Streamable's wrapper `div`; each platform's script tag next to its markup, as X and Instagram.
- **"Needs a lookup" errors:** Rumble URLs, and Flickr URLs if VERIFY fails.
- **The element:** `<social-embed>` gets every platform and the generic path, and the parity test covers them.
- **Playground:** a page per platform, a generic-iframe page with every fixture, and one of each on `/many` and `/element`.
- **Samples** follow D80: English, neutral, from each platform's own official account where it has one. Streamable, Strava and Rumble are heavy on sport and politics, so their samples need particular care.
- **README:** the platform table, the generic iframe section with its kept and dropped attributes, and the behaviour change.

## 6. Considered, not included

- **Mastodon; OK.ru and VK:** maintainer, 2026-11-21.
- **A host list for the generic iframe:** sites decide what they embed (maintainer, 2026-11-21).
- **Named components for Deezer, Mixcloud, Tidal, Bandcamp, Loom, TED, CodePen, Figma and Google Maps:** the generic iframe covers their embed code. A named component is worth it only if one needs URL input or height messages.
- **Resize messages for chart embeds** (Datawrapper, Flourish, Infogram): later, if sites ask.

## 7. Milestones

Each verified in a browser before the next:

1. **Research:** fixtures from each Embed or Share dialog and the generic-iframe sources, every VERIFY into `docs/decisions.md`, and the per-platform mechanism decisions.
2. **Parser:** `parseEmbed` and `matchUrl` for the seven, and `parseIframe`, with tests.
3. **Generic iframe:** `GenericIframeEmbed`, routing in `<SocialEmbed>` and `<social-embed>`, and the named-host guard.
4. **Iframe platforms:** Tenor, Streamable and Rumble.
5. **Script or frame-height platforms:** Truth Social, Imgur, Strava and Flickr.
6. **Playground, README and changeset** (minor, 0.7.0).
