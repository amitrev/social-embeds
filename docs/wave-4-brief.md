# social-embeds — Wave 4 Brief

Draft, 2026-11-19. Adds seven platforms: **Bluesky, SoundCloud, Apple Music, Apple Podcasts, Tumblr, Kick and Giphy**. Everything in [project-brief.md](./project-brief.md) still applies: its non-goals (§2, including no network calls from the package), the two inputs (§4), the parser/renderer split (§5), the shared component contract (§6) and the working method (§10). Waves 2 and 3's patterns are reused: strict parsing, canonical URLs that `verifyEmbed` enforces (D57), options that never replace verified content (D68), and iframes created on the client (D28). Items marked **VERIFY** need evidence before code, written up in `docs/decisions.md`.

## 1. Why these seven

Waves 1–3 covered what Bulgarian news sites embed. Wave 4 makes the package useful to sites anywhere: these are the most-embedded platforms worldwide that it does not support yet (maintainer, 2026-11-19).

- **Bluesky:** the main X alternative for news and politics. Dropped from wave 2 for Bulgaria; back for global use.
- **SoundCloud, Apple Music, Apple Podcasts:** audio beyond Spotify. Apple's players are the default in iOS-heavy markets.
- **Tumblr:** long-form posts and art, still embedded by culture sites.
- **Kick:** live streams, the main Twitch alternative.
- **Giphy:** GIFs, embedded in listicles and live blogs.

One release, 0.5.0 (maintainer, 2026-11-19).

| Platform       | Embed                                                                  | URL input                    |
| -------------- | ---------------------------------------------------------------------- | ---------------------------- |
| Bluesky        | blockquote + `embed.bsky.app/static/embed.js`, height from the frame   | only URLs with a `did:`      |
| SoundCloud     | iframe, `w.soundcloud.com/player/?url=…`, fixed height                 | yes (VERIFY)                 |
| Apple Music    | iframe, `embed.music.apple.com/{cc}/…`, fixed height                   | yes                          |
| Apple Podcasts | iframe, `embed.podcasts.apple.com/{cc}/…`, fixed height                | yes                          |
| Tumblr         | `div.tumblr-post` + `assets.tumblr.com/post.js`, height from the frame | VERIFY, else embed code only |
| Kick           | iframe, `player.kick.com/{channel}`                                    | yes                          |
| Giphy          | iframe, `giphy.com/embed/{id}`, aspect ratio                           | yes                          |

## 2. Platforms

Probed on 2026-11-19 with each platform's oEmbed endpoint or player host. Real embed code from each Embed or Share dialog is still needed for fixtures.

### 2.1 Bluesky — embed code and `did:` URLs only

- **Decided (maintainer, 2026-11-19):** no handle lookup. Embed code carries the post's AT URI, so it renders without a network call. A URL renders only when its profile part is a DID (`bsky.app/profile/did:plc:…/post/{rkey}`). A URL with a handle (`bsky.app/profile/alice.bsky.social/post/…`) renders nothing, and `onError` says to use the embed code. The parser returns `null` for it, as for any URL it cannot turn into a post without a network call.
- **Embed code** (oEmbed, `embed.bsky.app/oembed?url=…`): `<blockquote class="bluesky-embed" data-bluesky-uri="at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3n2mkgfb4tk2d" data-bluesky-cid="bafyrei…"><p lang="en">{post text}</p>&mdash; <a href="https://bsky.app/profile/did:plc:…?ref_src=embed">{author}</a> <a href="https://bsky.app/profile/did:plc:…/post/3n2mkgfb4tk2d?ref_src=embed">{date}</a></blockquote><script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>`. The oEmbed answer has `width: 600` and `height: null`.
- **What `embed.js` does:** for each `.bluesky-embed` it creates an iframe `https://embed.bsky.app/embed/{did}/app.bsky.feed.post/{rkey}?id=…&ref_url=…` and sets its height from the frame's `message` events (`event.data.height`).
- **Fallback content:** the post text, author and date links, as X. Whitelisted and rendered on the server (D35, D39).
- **Mechanism, the builder's call after VERIFY.** Either:
  - **the script**, as X: the blockquote is written once, the platform's class is added only when the embed comes near (D39), and the script renders it; or
  - **the iframe directly**, as Telegram and Reddit: the component builds the `embed.bsky.app/embed/…` URL from the AT URI on the client and takes the height from the frame, with the whitelisted blockquote as the placeholder.

  The iframe path needs no script and no page-wide scan, but depends on an undocumented URL and message format. Recommended: the iframe, if VERIFY shows the format is stable enough; else the script.

- **Options:** none known beyond `data-bluesky-cid` (the post version). `ref_url` is the page's own URL and is never taken from input.
- **VERIFY:**
  - `embed.js`'s full behaviour: does it scan the whole page on load and on later calls (as X and Instagram, D39), and does it offer a manual re-scan?
  - the frame's `message` format and origin, and whether `id` is required;
  - what a deleted post, or a post from an account that hides itself from logged-out users, shows;
  - the Embed dialog's code (bsky.app → post menu → Embed post), and whether it has a dark mode option.

### 2.2 SoundCloud — iframe with a fixed height

- **Embed code** (oEmbed, `soundcloud.com/oembed?format=json&url=…`): `<iframe width="100%" height="400" scrolling="no" frameborder="no" allow="autoplay; encrypted-media" src="https://w.soundcloud.com/player/?visual=true&url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F293&show_artwork=true">`. The Share dialog's code adds a `<div>` with the artist and track links after the iframe (VERIFY), which needs a narrow exception to D14 like Vimeo's wrapper.
- **The content is the encoded `url` parameter:** `api.soundcloud.com/tracks/{id}`, `/playlists/{id}` or `/users/{id}` from embed code. Private tracks add `secret_token`, which is kept as content (as Vimeo's hash).
- **URL input:** `soundcloud.com/{user}/{track}`, `soundcloud.com/{user}/sets/{playlist}`, `soundcloud.com/{user}`; `m.` and `www.` hosts. `on.soundcloud.com/…` short links need a redirect: `null`.
- **Two id spaces:** embed code gives a numeric API id, a URL gives a permalink. Both are canonical URLs that `matchUrl` must accept, so `verifyEmbed` (D57) passes for either. The parser does not convert one into the other.
- **Rendering:** fixed height (LinkedIn's path, D53): the embed code's `height` and layout as given. 166 for a classic track, 300 or 450 for the visual player and playlists (VERIFY).
- **Decided (maintainer, 2026-11-20):** a URL renders the visual player (`visual=true`) at 400 px, as SoundCloud's oEmbed gives, the same rule as Spotify (D60).
- **Options:** the player parameters (`visual`, `color`, `auto_play`, `hide_related`, `show_comments`, `show_user`, `show_reposts`, `show_teaser`, `show_artwork`). The `url` parameter is content, never an option (D68).
- **VERIFY:**
  - that the player accepts `url=https://soundcloud.com/{user}/{track}`, so URL input needs no lookup;
  - the Share dialog's code, classic and visual, track and playlist;
  - each layout's height.

### 2.3 Apple Music — iframe with a fixed height

- **Embed code** (Share → Embed, expected): `<iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="450" style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="https://embed.music.apple.com/{cc}/album/{slug}/{id}">`. `embed.music.apple.com/us/album/1440857781` answered 200.
- **URL input:** `music.apple.com/{cc}/album/{slug}/{id}`, with `?i={songId}` for a song on its album; `/song/{slug}/{id}`; `/playlist/{slug}/pl.{id}`; `/music-video/{slug}/{id}`; `/artist/{slug}/{id}`. The embed URL is the same path on `embed.music.apple.com`. The country code is kept: content differs by store.
- **Rendering:** fixed height, 175 for a song, 450 for the rest (VERIFY); `maxWidth` 660 as Apple's own style.
- **`sandbox`:** kept as Apple writes it, through `IframeEmbed`'s existing `sandbox` prop (Reddit's, D56), set by the component, never from input.
- **VERIFY:** the Share dialog's code for each kind, each kind's height, and whether a music video is 16:9 instead of fixed.

### 2.4 Apple Podcasts — iframe with a fixed height

- **Embed code** (expected): as Apple Music, with `src="https://embed.podcasts.apple.com/{cc}/podcast/{slug}/id{id}?i={episodeId}"`. `embed.podcasts.apple.com/us/podcast/id1200361736` redirected (301) to `/us/podcast/1200361736`: the `id` prefix is dropped.
- **URL input:** `podcasts.apple.com/{cc}/podcast/{slug}/id{id}`, with `?i={episodeId}` for an episode.
- **Rendering:** fixed height, 175 for an episode, 450 for a show (VERIFY).
- **Platform name:** separate from Apple Music (my call): different hosts, kinds and heights. Proposed `'applemusic'` and `'applepodcasts'`.
- **VERIFY:** the Share dialog's code; which path form to use in the canonical URL after the 301.

### 2.5 Tumblr — script, height from the frame

- **Embed code** (oEmbed, `www.tumblr.com/oembed/1.0?url=…`): `<div class="tumblr-post" data-href="https://embed.tumblr.com/embed/post/t:0aY0xL2Fi1OFJg4YxpmegQ/832577330595643392/v2" data-did="b5a34…"><a href="https://www.tumblr.com/staff/832577330595643392">…</a></div><script async src="https://assets.tumblr.com/post.js?_v=…"></script>`. `width: 540`, `height: null`.
- **The embed URL holds a blog token** (`t:0aY0xL2Fi1OFJg4YxpmegQ`), not the blog name. A post URL (`www.tumblr.com/{blog}/{id}`, `{blog}.tumblr.com/post/{id}`) does not carry it.
- **URL input:** only if VERIFY shows `embed.tumblr.com/embed/post/{blog}/{id}/v2` works with the blog name. Otherwise Tumblr is embed code only, as Bluesky handles: the URL renders nothing and `onError` says to use the embed code.
- **Canonical URL if embed code only (my call):** `ParsedEmbed.url` is the `embed.tumblr.com/embed/post/t:{token}/{id}/v2` URL. `matchUrl` accepts that form, so `verifyEmbed` (D57) passes and the token is verified content, never an option (D68). Post URLs still return `null`. `data-did` is dropped, if VERIFY shows `post.js` does not need it to pick the post.
- **Mechanism:** as Bluesky, the builder's call between `post.js` and the iframe directly. `post.js`'s `_v` is a cache key: the package loads one pinned script URL, not the one in the input.
- **Fallback content:** only the post link.
- **VERIFY:** the URL question above; `post.js`'s behaviour (page scan, re-scan, `message` format); the Share dialog's code.

### 2.6 Kick — iframe with an aspect ratio

- **Embed code** (Share → Embed, expected): `<iframe src="https://player.kick.com/{channel}" height="720" width="1280" frameborder="0" scrolling="no" allowfullscreen="true">`. `player.kick.com/xqc` answered 200 ("KICK - Player").
- **URL input:** `kick.com/{channel}`; videos and clips if the player takes them (VERIFY).
- **Rendering:** 16:9, `maxWidth` none, as Twitch.
- **Options:** `autoplay`, `muted` (VERIFY the names).
- **VERIFY:** VOD and clip embed URLs; whether the player needs anything like Twitch's `parent`; the player's parameters.

### 2.7 Giphy — iframe with an aspect ratio

- **Embed code** (giphy.com → Embed, expected): `<iframe src="https://giphy.com/embed/{id}" width="480" height="270" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/{slug}-{id}">via GIPHY</a></p>`, optionally inside a responsive `<div style="width:100%;height:0;padding-bottom:…%;position:relative;">`. The `<p>` and the wrapper need a narrow exception to D14, as Vimeo's (D61). Giphy's oEmbed returns a `photo`, not embed code, so it is no source of fixtures.
- **URL input:** `giphy.com/gifs/{slug}-{id}`, `giphy.com/gifs/{id}`, `giphy.com/clips/{slug}-{id}`, `media.giphy.com/media/{id}/giphy.gif`, `gph.is/…` (short link, needs a redirect: `null`).
- **Rendering:** the embed code's aspect ratio; 1:1 for a URL, which carries no size (VERIFY a better default).
- **VERIFY:** the Embed dialog's code, responsive and fixed; whether clips (with sound) use the same `/embed/` path.

## 3. Shared changes

- `Platform` gains `'bluesky' | 'soundcloud' | 'applemusic' | 'applepodcasts' | 'tumblr' | 'kick' | 'giphy'`: a minor bump with the same call-out as waves 2 and 3.
- `kind`: Bluesky and Tumblr `post`; SoundCloud, Apple Music and Apple Podcasts `post` as Spotify (D64); Kick and Giphy `video`.
- `variant`: `iframe` for the five iframe platforms; Bluesky and Tumblr `sdk` (as Pinterest's widget) or `iframe`, after the mechanism decision. The `variant` type does not change.
- **Fixed-height iframes** reuse LinkedIn's and Spotify's path (SoundCloud, Apple Music, Apple Podcasts).
- **Height from the frame** reuses Telegram's and Reddit's path, if Bluesky or Tumblr take the iframe route.
- **`sandbox`:** Apple's components set `IframeEmbed`'s existing `sandbox` prop (D56).
- **Narrow wrapper exceptions to D14:** SoundCloud's link `div`, Giphy's `<p>` and responsive `div`. Each matches the platform's own markup exactly; anything else around the iframe is still rejected. The extras are accepted and dropped, as Vimeo's and Dailymotion's wrappers (my call): iframe platforms keep no fallback content.
- **"Embed code only" errors:** one message shape for a URL the package cannot render without a network call (Bluesky handles, Tumblr if VERIFY fails): `social-embeds: a {Platform} URL needs a lookup: use the embed code`. It lives in the components and the dispatcher only (my call): the parser still returns `null`, and `social-embeds/parser` gains no API.
- **Playground:** a page per platform, and every platform on `/many`.

## 4. Considered, not included

- **Mastodon:** every server has its own domain, so strict matching by host is impossible, and newer embed code loads a script from the post's server.
- **A generic iframe component** for hosts the app allows: gives up strict input (D14) for coverage.
- **Bluesky handle lookup:** a network call (maintainer, 2026-11-19).
- **Regional platforms** (Bilibili, Weibo, VK, LINE): on request.

## 5. Milestones

Same order as wave 3, each verified in a browser before the next:

1. **Research:** fixtures from each Embed or Share dialog, every VERIFY into `docs/decisions.md`, and the Bluesky and Tumblr mechanism decision.
2. **Parser:** `parseEmbed` and `matchUrl` for the seven, with tests, including the D14 exceptions.
3. **Iframe components:** `SoundCloudEmbed`, `AppleMusicEmbed`, `ApplePodcastsEmbed`, `KickEmbed`, `GiphyEmbed`.
4. **Bluesky and Tumblr:** `BlueskyEmbed`, `TumblrEmbed`.
5. **Dispatcher and playground.**
6. **README and changeset** (minor, 0.5.0).
