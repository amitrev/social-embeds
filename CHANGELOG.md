# social-embeds

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
