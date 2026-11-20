---
'social-embeds': patch
---

Telegram, Reddit, Bluesky and Tumblr embeds with `lazy={false}` no longer call `onError` for a missing height before they come near the viewport.
