# social-embeds — Wave 3 Brief

Draft, 2026-11-19. Adds four platforms: **Spotify, Vimeo, Twitch and Dailymotion**. Everything in [project-brief.md](./project-brief.md) still applies: its non-goals (§2), the two inputs (§4), the parser/renderer split (§5), the shared component contract (§6) and the working method (§10). Wave 2's patterns are reused: strict parsing, canonical URLs that `verifyEmbed` enforces (D57), and iframes created on the client (D28). Items marked **VERIFY** need evidence before code, written up in `docs/decisions.md`.

## 1. Why these four

Wave 2's brief left them as the next candidates (wave 2 brief §1). Each covers content that news sites embed and that no supported platform does: podcasts and music (Spotify), professional video outside YouTube (Vimeo), live streams and clips (Twitch), and the video player some European publishers use (Dailymotion, added by the maintainer on 2026-11-19).

| Platform    | Users (approx.)                | Embed                                                               |
| ----------- | ------------------------------ | ------------------------------------------------------------------- |
| Spotify     | ~700M monthly (not checked)    | iframe, `open.spotify.com/embed/{type}/{id}`                        |
| Vimeo       | ~260M registered (not checked) | iframe, `player.vimeo.com/video/{id}`                               |
| Twitch      | ~240M (Buffer, unverified)     | iframe, `player.twitch.tv` and `clips.twitch.tv`; requires `parent` |
| Dailymotion | not checked                    | iframe, `geo.dailymotion.com/player.html?video={id}`                |

All four are pure iframes: no script, no fallback content. None needs a network call from the package (§2 of the project brief).

## 2. Platforms

Probed on 2026-11-19 with each platform's oEmbed endpoint or documentation. Real embed code from each Embed dialog is still needed for fixtures.

### 2.1 Spotify — iframe with a fixed height

- **Embed code** (oEmbed, `open.spotify.com/oembed?url=…`): `<iframe style="border-radius: 12px" width="100%" height="152" title="Spotify Embed: …" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" src="https://open.spotify.com/embed/track/{id}?utm_source=oembed">`. A playlist came back with `height="352"`.
- **Types:** `track`, `album`, `playlist`, `artist`, `episode`, `show`, `audiobook`, `chapter`.
- **Rendering:** the iframe, `width: 100%` up to `maxWidth`, at the embed code's height. Spotify's player has two layouts by height (compact at 152, full at 352), so height is a fixed choice, not an aspect ratio (as LinkedIn, D53).
- **URL input:** `open.spotify.com/{type}/{id}`, also with an `intl-{lang}/` prefix (`open.spotify.com/intl-de/track/…`). `spotify.link/…` and `spotify.app.link/…` short links need a redirect: `null`.
- **Options:** the `theme` query (`0` for the dark player), and `utm_source` dropped.
- **VERIFY:**
  - the oEmbed height of each type (track 152 and playlist 352 seen), for the default height of URL input;
  - whether the frame posts its height (Spotify's iframe API posts playback events);
  - the Embed dialog's code, including its "compact" option and `theme`.
- **Decided (maintainer, 2026-11-19):** URL input gets the height Spotify's oEmbed gives that type (152 for a track, 352 for a playlist; the others measured in milestone 1).

### 2.2 Vimeo — iframe with an aspect ratio

- **Embed code** (oEmbed, `vimeo.com/api/oembed.json?url=…`): `<iframe src="https://player.vimeo.com/video/76979871?app_id=122963" width="480" height="270" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" title="…">`.
- **The Embed dialog's responsive code** is expected to wrap the iframe in a `<div style="padding:56.25% 0 0 0;position:relative;">` and add `player.vimeo.com/api/player.js`. That is a wrapper and a script beside the iframe, which D14's strict input rejects today.
- **Rendering:** the iframe in a box of the embed code's aspect ratio, as YouTube (D29). Video URLs carry no size: 16:9 by default, as YouTube URLs.
- **Unlisted videos** need their hash: `vimeo.com/{id}/{hash}` or `player.vimeo.com/video/{id}?h={hash}`. The hash is kept, and is part of the canonical URL.
- **URL input:** `vimeo.com/{id}`, `vimeo.com/{id}/{hash}`, `vimeo.com/channels/{name}/{id}`, `vimeo.com/groups/{name}/videos/{id}`, `vimeo.com/showcase/{id}/video/{vid}`, `player.vimeo.com/video/{id}`. `#t=1m2s` is kept as the start time.
- **Options:** the player parameters Vimeo documents (`autoplay`, `muted`, `loop`, `title`, `byline`, `portrait`, `color`, `dnt`, …); `app_id` and `player_id` dropped.
- **VERIFY:**
  - the Embed dialog's code, responsive and fixed, and which variants a host would paste;
  - whether a vertical video's oEmbed code carries its real ratio (it should, through `width`/`height`).
- **Decided (maintainer, 2026-11-19):** Vimeo's own responsive snippet (its wrapper `div` and `player.js`, exactly as the Embed dialog writes them) is accepted, a narrow exception to D14 like Facebook's `fb-root`. Anything else around the iframe is still rejected.

### 2.3 Twitch — iframe whose `parent` is the host page

- **Embed code** ([Twitch docs](https://dev.twitch.tv/docs/embed/video-and-clips/)):
  - live channel `https://player.twitch.tv/?channel={name}&parent={domain}`;
  - past broadcast `?video=v{id}`;
  - collection `?collection={id}`;
  - clip `https://clips.twitch.tv/embed?clip={slug}&parent={domain}`.

  `height` at least 300 and `width` at least 400; `allowfullscreen`.

- **`parent` is required** and must name the domain of the page that embeds the player; one `parent` per domain. Embed code carries the domain it was made for, which is wrong on any other host or environment. The package therefore drops every `parent` from the input and sets `parent={location.hostname}` when it creates the iframe. Iframes are already created only on the client (D28), so the server never needs the domain.
- **Options:** `autoplay` (live and VOD default `true`, clips `false`), `muted`, `time` (VOD start, `1h2m3s`).
- **URL input:** `twitch.tv/{channel}`, `twitch.tv/videos/{id}`, `twitch.tv/{channel}/clip/{slug}`, `clips.twitch.tv/{slug}`, `twitch.tv/collections/{id}`; `m.` and `www.` hosts. `?t=` on a video is kept as `time`.
- **Rendering:** 16:9 aspect ratio, `maxWidth` default none (as YouTube).
- **Not included:** the interactive JavaScript embed (`Twitch.Player`): it is code, not markup a CMS stores.
- **VERIFY:**
  - that `parent` works for `localhost`, ports and subdomains, and what the player shows when it does not match;
  - whether a page on HTTP (not HTTPS) can embed at all (Twitch documents HTTPS for parents);
  - the Embed dialog's code for each kind.
- **Decided (maintainer, 2026-11-19):** autoplay follows the embed code, else Twitch's own default, else the `autoplay` prop. The package does not turn it off.

### 2.4 Dailymotion — iframe with an aspect ratio, Player ID required

- **Decided (maintainer, 2026-11-19), after D63:** every Dailymotion embed needs a publisher's Player ID. Embed code that carries one renders as given. Code without one, and URLs, render only with the host's own `playerId` prop; otherwise `onError`.

- **Embed code** (oEmbed, `www.dailymotion.com/services/oembed?url=…`): `<iframe frameborder="0" width="480" height="847" src="https://geo.dailymotion.com/player.html?video=xby1a0e&" allowfullscreen allow="autoplay; fullscreen; picture-in-picture; web-share">`. The size is the video's own ratio: this one is vertical.
- **Older embed code** uses `https://www.dailymotion.com/embed/video/{id}`, often inside a responsive wrapper `div`.
- **Publisher players:** `geo.dailymotion.com/player/{playerId}.html?video={id}` carries a publisher's player configuration. The player id is kept as an option.
- **Rendering:** the iframe in a box of the embed code's aspect ratio. URLs carry no size: 16:9 by default.
- **URL input:** `dailymotion.com/video/{id}`, `dai.ly/{id}` (the id is in the path, so no redirect is needed), `dailymotion.com/embed/video/{id}`.
- **VERIFY:**
  - the Embed dialog's code today, and whether its responsive wrapper needs the same exception as Vimeo's;
  - which player query parameters to keep (`mute`, `startTime`, …);
  - whether `www.dailymotion.com/embed/video/{id}` still renders, or should be rewritten to the `geo.` player.

## 3. Shared changes

- `Platform` gains `'spotify' | 'vimeo' | 'twitch' | 'dailymotion'` (a minor bump with the same call-out as wave 2).
- `kind`: Vimeo, Twitch and Dailymotion `video`; Spotify `post`.
- `variant` `iframe` for all four.
- **Fixed-height iframes** reuse LinkedIn's path (Spotify).
- **A client-only query value** is new: Twitch's `parent`. `IframeEmbed` gains a way to finish the `src` on the client, kept to that one parameter.
- **Playground:** a page per platform, and the four on `/many`.

## 4. Considered, not included

- **SoundCloud:** a plain iframe (`w.soundcloud.com/player/?url=…`); overlaps Spotify for audio.
- **Kick:** live streams, iframe `player.kick.com/{channel}`; small in Bulgaria.
- **Bluesky:** not planned (2026-11-18).

## 5. Milestones

Same order as wave 2, each verified in a browser before the next:

1. **Research:** fixtures from each Embed dialog and every VERIFY into `docs/decisions.md`.
2. **Parser:** `parseEmbed` and `matchUrl` for the four, with tests.
3. **Twitch's client-side `parent`** in `IframeEmbed`, with tests.
4. **Components:** `SpotifyEmbed`, `VimeoEmbed`, `TwitchEmbed`, `DailymotionEmbed`.
5. **Dispatcher and playground.**
6. **README and changeset.**
