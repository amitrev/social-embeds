# social-embeds

## 0.9.3

### Patch Changes

- 0c567a3: Platform components are smaller again: each now bundles only the URL half of its platform's parser, not the code that reads embed code, which only `parseEmbed` needs. `TikTokEmbed` adds about 3.1 KB gzipped instead of 3.5 KB, `YouTubeEmbed` 3.9 KB instead of 4.1 KB and `FacebookEmbed` 6.8 KB instead of 7.5 KB. `<SocialEmbed>` and the element grow by about 0.2 KB.

## 0.9.2

### Patch Changes

- 3de9477: `<SocialEmbed>` is about 0.85 KB smaller gzipped (27.4 KB), because the platform components now share one body instead of repeating it. A single platform component grows by under 0.1 KB.

## 0.9.1

### Patch Changes

- cfa81b3: Platform components are smaller: `YouTubeEmbed` adds about 4.1 KB gzipped to an app instead of 6.1 KB, `TikTokEmbed` 3.4 KB instead of 5.5 KB, `XEmbed` 5.3 KB instead of 6.5 KB, and `FacebookEmbed` 7.4 KB instead of 8.8 KB. Components no longer bundle the HTML parser, tables covering every platform, other platforms' script loaders, Flickr's frame sizing, the height-message listener or Twitch's `parent` handling. An `embed` of another platform given to a platform component is now reported as `expected a {Platform} embed, got {id}`, with the other platform's id.

## 0.9.0

### Minor Changes

- d8491b6: New `createSocialEmbed(platforms)`: a `<SocialEmbed>` that recognises only the platforms you list, so a bundler leaves the others out. With YouTube, X, Instagram, Facebook and TikTok it adds about 13 KB gzipped to an app, against about 28 KB for `<SocialEmbed>`, which recognises every platform. Each platform is exported under its id (`youtube`, `x`, `instagram`, …), and `genericIframe` adds generic iframe embeds. Call it in a `'use client'` module:
  
  ```tsx
  'use client';
  import { createSocialEmbed, genericIframe, x, youtube } from 'social-embeds';
  
  export const SocialEmbed = createSocialEmbed([youtube, x, genericIframe]);
  ```

## 0.8.1

### Patch Changes

- 52c008b: `<social-embed>` now restyles in place when `width`, `max-width`, `height`, `max-height` or `eager` changes, instead of reloading the embed. `eager="false"` now means off, and React 19's `eager` now means on. Embed code written straight inside the element, without a `<template>`, now renders. Placeholder copies no longer duplicate `id`s.
- 52c008b: `GenericIframeEmbed` no longer bundles every platform's parser: it adds about 5 KB gzipped to an app instead of about 16 KB. It still refuses an iframe that a named platform serves.
- 52c008b: Script embeds no longer render twice, or call `onLoad` twice, when React's `<Activity>` hides and shows them (Next.js 16 `cacheComponents`). `onError` is no longer called twice for the same error under StrictMode. The scripts the package adds now carry the page's CSP nonce, copied from its first `<script nonce>`. Instagram and Threads embeds inside a shadow root, where their script cannot reach, now report that at once instead of after about 50 s.
- 52c008b: More YouTube, Facebook and older embed code is recognised: YouTube playlists (`/playlist?list=`, `/embed/videoseries?list=`) and channel streams (`/channel/{id}/live`, `/embed/live_stream?channel=`), a `#t=` start time, URLs copied from HTML source with `&amp;`, Facebook photostream photo URLs, Vimeo code with its credit paragraph, Reddit's older `reddit-card` code, older Tumblr code, X's `twitter-video` code, and `&nbsp;` between an embed and its script.

## 0.8.0

### Minor Changes

- 8c20313: `<social-embed>` no longer moves or removes its own children. A framework that renders children into it, such as React's `{loading && <p />}`, no longer crashes with `NotFoundError`. The children stay in place, unrendered; the embed shows through a shadow root holding only `<slot name="embed">`, and still renders into the light DOM. If other code removes the embed, for example a framework text update or a DOM morph, it renders again. The element now also reads embed code from an `html` attribute, which React 19, Vue and Svelte write before the tag is defined.
- 8c20313: A platform component now bundles only its own platform's parser. Importing `YouTubeEmbed` alone adds about 5.7 KB gzipped to an app instead of 16.6 KB; `XEmbed`, `InstagramEmbed` and the others are similar. `<SocialEmbed>` still recognises every platform and is about 27 KB. The package now ships one file per module, so bundlers can drop what an app does not import. A URL of another platform given to a platform component is now reported as `social-embeds: not a {Platform} post URL: …` instead of naming the other platform.

### Patch Changes

- 8c20313: TikTok, YouTube, Vimeo, Spotify, Twitch, Dailymotion, LinkedIn, Snapchat and Facebook video embeds now call `onError` when their frame does not load within 15 s, as the other iframe embeds do. Changing an iframe embed's `url` or `embed` now starts a fresh frame, with its placeholder, `onLoad`, timeout and starting height, instead of reusing the old one.
- 8c20313: A platform `<script>` tag that never runs no longer stops X, Instagram, Threads, Facebook or Pinterest embeds. Tags written through `innerHTML` or `dangerouslySetInnerHTML`, as in CMS article HTML after a client-side navigation, made every embed of that platform fail with `… did not initialise` until a full reload. The package now adds its own tag at most 3 s after the page has loaded.
- 8c20313: When an X, Instagram, Threads, Facebook or Pinterest embed fails, for example because a content blocker stops the platform's script, the grey placeholder no longer stays for good. A URL now leaves a "View this post on {Platform}" link to the post, and embed code keeps its fallback content.
- 8c20313: More real-world input is recognised: Tenor embed code with ratios such as `data-aspect-ratio="1.77778"` (most Tenor code was rejected), X links copied from the media viewer (`/status/{id}/photo/1`) and `x.com/i/web/status/{id}`, `web.facebook.com` links, Giphy sticker pages and "Copy GIF link" URLs (`media.giphy.com/media/v1.…/{id}/giphy.gif`, `i.giphy.com/{id}.gif`), and Streamable URLs with a trailing slash.

## 0.7.1

### Patch Changes

- adec62a: Short Truth Social posts no longer leave blank space under them. The frame now starts at 150 px instead of 300 px: Truth Social reports its document height, which can never be shorter than the frame, so a 300 px start kept every short post at least 300 px high.

## 0.7.0

### Minor Changes

- e21c9ec: Add a generic iframe embed and seven platforms.
  
  - **Generic iframe:** embed code that no platform claims, but that holds one iframe, now renders, for Google Maps, Deezer, Loom, CodePen and any other site that gives iframe code. Only checked attributes reach the page: `src` must be `https:`, `allow` keeps media features only, and no script runs. `GenericIframeEmbed`, `parseIframe` and `ParsedIframe` are new; `parseIframe` is exported from `social-embeds/parser`. Plain URLs to unknown sites still render nothing.
  - **Platforms:** Truth Social, Imgur, Tenor, Streamable, Strava, Flickr and Rumble, each with a component (`TruthSocialEmbed`, `ImgurEmbed`, `TenorEmbed`, `StreamableEmbed`, `StravaEmbed`, `FlickrEmbed`, `RumbleEmbed`) and URL or embed code input, in `<SocialEmbed>` and `<social-embed>`. A Rumble page URL needs a lookup, so use its embed code. Strava's style option is the prop `embedStyle`.
  - **`Platform` has seven new values** (`'truthsocial'`, `'imgur'`, `'tenor'`, `'streamable'`, `'strava'`, `'flickr'`, `'rumble'`). An exhaustive `switch` over `Platform` stops compiling until it handles them.
  - **Behaviour change:** iframe code that `<SocialEmbed>` used to hand to `fallback`, and that `<social-embed>` answered with an `error` event, now renders. Non-iframe code and iframes that are rejected still reach `fallback` or `error`. Code whose `fallback` ran the site's resize script (Datawrapper, Flourish) now renders at the fixed height in the code. To keep running that script, call `parseEmbed` yourself and route the result: render your own markup when it returns `null`.

### Patch Changes

- 518bd41: `parseEmbed` and `parseIframe` no longer throw `RangeError: Maximum call stack size exceeded` on very large embed code, such as hundreds of thousands of sibling elements. They return `null` or the embed, as documented.

## 0.6.1

### Patch Changes

- 08011c3: Iframe embeds that do not load within 15 s of coming near the viewport now report `social-embeds: {title} did not load` through `onError` and the element's `error` event. A frame the browser blocked, such as TikTok, Snapchat or LinkedIn under Firefox's tracking protection, used to stay on its placeholder with no event. A load that arrives later still calls `onLoad`.
- fb18905: Script embeds (X, Instagram, Threads, Facebook, Pinterest) keep their full width when the host gives the wrapper layout classes such as `flex justify-center`. A Facebook post in a `flex justify-center` wrapper was drawn 552 px wide and cut off on phones.

## 0.6.0

### Minor Changes

- 97e034b: Adds the `<social-embed>` custom element (`social-embeds/element`): every platform, without React.
  
  An explicit `maxWidth={undefined}` on a Facebook post now gets the 750px default, like X, Instagram and Threads.

## 0.5.3

### Patch Changes

- 4339614: Telegram, Reddit, Bluesky and Tumblr embeds with `lazy={false}` no longer call `onError` for a missing height before they come near the viewport.

## 0.5.2

### Patch Changes

- 6f55068: README examples use official or classic, neutral sample posts.

## 0.5.1

### Patch Changes

- be66bc6: Tighten wave 4 parsing from the release review:
  
  - Tumblr embed code whose frame names a different blog than its post link is rejected.
  - A SoundCloud `secret_token` given as a player parameter is kept with the track.
  - Option keys that name a player's content are dropped in any letter case.
  - A Bluesky URL with a malformed DID reports "not a supported post URL" instead of asking for embed code.
  - `kick.com/clips`, `kick.com/video` and `kick.com/videos` are no longer read as channels.

## 0.5.0

### Minor Changes

- 91b0423: Add Bluesky, SoundCloud, Apple Music, Apple Podcasts, Tumblr, Kick and Giphy: `BlueskyEmbed`, `SoundCloudEmbed`, `AppleMusicEmbed`, `ApplePodcastsEmbed`, `TumblrEmbed`, `KickEmbed` and `GiphyEmbed`, routed by `<SocialEmbed>` and recognised by `parseEmbed` and `matchUrl`. `ParsedEmbed['platform']` has seven new values, so a `switch` over every platform needs the new cases.
  
  - Bluesky renders from embed code, or from a URL that names the account by its DID. A URL with a handle needs a lookup, which the package does not make: it renders nothing, and `onError` says to use the embed code.
  - Bluesky and Tumblr render their frames directly, with the height the frame reports; `embed.js` and `post.js` are not loaded.
  - A SoundCloud URL renders the visual player at 400 px; embed code keeps its own player and height.
  - SoundCloud's and Giphy's credit links after the iframe, and Giphy's responsive wrapper, are accepted as embed code.
  - `<SocialEmbed>` no longer accepts the new option names as wrapper attributes: SoundCloud's, Kick's `autoplay` and `muted`, Bluesky's `colorMode`.

## 0.4.1

### Patch Changes

- a100070: Add npm keywords for React, Next.js and each supported platform, so the package shows up in npm search.

## 0.4.0

### Minor Changes

- db9e95c: Add Spotify, Vimeo, Twitch and Dailymotion: `SpotifyEmbed`, `VimeoEmbed`, `TwitchEmbed` and `DailymotionEmbed`, routed by `<SocialEmbed>` and recognised by `parseEmbed` and `matchUrl`. `ParsedEmbed['platform']` has four new values, so a `switch` over every platform needs the new cases.
  
  - Twitch's `parent` is set to the page's own host in the browser; any `parent` in the embed code is dropped.
  - Dailymotion needs a publisher's Player ID: from the embed code, or `DailymotionEmbed`'s `playerId` prop. `<SocialEmbed>` takes none, so it renders a Dailymotion URL as nothing and calls `onError`.
  - Vimeo's and Dailymotion's own responsive wrappers are accepted as embed code.
  - `<SocialEmbed>` no longer accepts a `title` attribute for its wrapper `div`: Vimeo uses `title` as a player option.

## 0.3.0

### Minor Changes

- d394e91: Add Telegram, Snapchat, LinkedIn, Reddit and Pinterest: `TelegramEmbed`, `SnapchatEmbed`, `LinkedInEmbed`, `RedditEmbed` and `PinterestEmbed`, routed by `<SocialEmbed>` and recognised by `parseEmbed` and `matchUrl`. `ParsedEmbed['platform']` has five new values, so a `switch` over every platform needs the new cases.

### Patch Changes

- d394e91: A component now rejects an `embed` whose `url` is not the exact URL `matchUrl` returns for it, and calls `onError`. Embeds from `parseEmbed` and `matchUrl` are unaffected; an embed built by hand with another form of the same URL is no longer rendered.

## 0.2.1

### Patch Changes

- d19de4e: Instagram and Threads embeds no longer stay blank when the Facebook SDK finishes loading while their script is on its way, as on a page whose Facebook and Instagram embeds load at the same time.

## 0.2.0

### Minor Changes

- f586138: Add `maxHeight` for iframe embeds: the embed narrows to keep its aspect ratio, so a vertical video is at most that tall. `showText={false}` on `FacebookEmbed` now renders video embed code that shows the post text as the plain iframe, without the text and without the SDK.

### Patch Changes

- b81c544: Facebook video embed code that shows the post text (`show_text=true`) now renders through the SDK, so the text below the video is no longer cut off.

## 0.1.0

### Minor Changes

- 1872fb4: First release: `<SocialEmbed>` and the X, Instagram, Threads, Facebook, TikTok and YouTube components, which render a post from its embed code or URL, and `social-embeds/parser` with `parseEmbed` and `matchUrl`.
