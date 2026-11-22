---
'social-embeds': patch
---

A platform `<script>` tag that never runs no longer stops X, Instagram, Threads, Facebook or Pinterest embeds. Tags written through `innerHTML` or `dangerouslySetInnerHTML`, as in CMS article HTML after a client-side navigation, made every embed of that platform fail with `… did not initialise` until a full reload. The package now adds its own tag at most 3 s after the page has loaded.
