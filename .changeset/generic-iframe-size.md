---
'social-embeds': patch
---

`GenericIframeEmbed` no longer bundles every platform's parser: it adds about 5 KB gzipped to an app instead of about 16 KB. It still refuses an iframe that a named platform serves.
