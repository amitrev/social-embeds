---
'social-embeds': patch
---

TikTok, YouTube, Vimeo, Spotify, Twitch, Dailymotion, LinkedIn, Snapchat and Facebook video embeds now call `onError` when their frame does not load within 15 s, as the other iframe embeds do. Changing an iframe embed's `url` or `embed` now starts a fresh frame, with its placeholder, `onLoad`, timeout and starting height, instead of reusing the old one.
