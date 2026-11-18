---
'social-embeds': patch
---

A component now rejects an `embed` whose `url` is not the exact URL `matchUrl` returns for it, and calls `onError`. Embeds from `parseEmbed` and `matchUrl` are unaffected; an embed built by hand with another form of the same URL is no longer rendered.
