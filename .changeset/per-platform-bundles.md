---
'social-embeds': minor
---

A platform component now bundles only its own platform's parser. Importing `YouTubeEmbed` alone adds about 5.7 KB gzipped to an app instead of 16.6 KB; `XEmbed`, `InstagramEmbed` and the others are similar. `<SocialEmbed>` still recognises every platform and is about 27 KB. The package now ships one file per module, so bundlers can drop what an app does not import. A URL of another platform given to a platform component is now reported as `social-embeds: not a {Platform} post URL: …` instead of naming the other platform.
