---
'social-embeds': minor
---

Add Bluesky, SoundCloud, Apple Music, Apple Podcasts, Tumblr, Kick and Giphy: `BlueskyEmbed`, `SoundCloudEmbed`, `AppleMusicEmbed`, `ApplePodcastsEmbed`, `TumblrEmbed`, `KickEmbed` and `GiphyEmbed`, routed by `<SocialEmbed>` and recognised by `parseEmbed` and `matchUrl`. `ParsedEmbed['platform']` has seven new values, so a `switch` over every platform needs the new cases.

- Bluesky renders from embed code, or from a URL that names the account by its DID. A URL with a handle needs a lookup, which the package does not make: it renders nothing, and `onError` says to use the embed code.
- Bluesky and Tumblr render their frames directly, with the height the frame reports; `embed.js` and `post.js` are not loaded.
- A SoundCloud URL renders the visual player at 400 px; embed code keeps its own player and height.
- SoundCloud's and Giphy's credit links after the iframe, and Giphy's responsive wrapper, are accepted as embed code.
- `<SocialEmbed>` no longer accepts the new option names as wrapper attributes: SoundCloud's, Kick's `autoplay` and `muted`, Bluesky's `colorMode`.
