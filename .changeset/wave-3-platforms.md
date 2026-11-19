---
'social-embeds': minor
---

Add Spotify, Vimeo, Twitch and Dailymotion: `SpotifyEmbed`, `VimeoEmbed`, `TwitchEmbed` and `DailymotionEmbed`, routed by `<SocialEmbed>` and recognised by `parseEmbed` and `matchUrl`. `ParsedEmbed['platform']` has four new values, so a `switch` over every platform needs the new cases.

- Twitch's `parent` is set to the page's own host in the browser; any `parent` in the embed code is dropped.
- Dailymotion needs a publisher's Player ID: from the embed code, or `DailymotionEmbed`'s `playerId` prop. `<SocialEmbed>` takes none, so it renders a Dailymotion URL as nothing and calls `onError`.
- Vimeo's and Dailymotion's own responsive wrappers are accepted as embed code.
- `<SocialEmbed>` no longer accepts a `title` attribute for its wrapper `div`: Vimeo uses `title` as a player option.
