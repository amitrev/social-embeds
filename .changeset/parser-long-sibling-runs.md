---
'social-embeds': patch
---

`parseEmbed` and `parseIframe` no longer throw `RangeError: Maximum call stack size exceeded` on very large embed code, such as hundreds of thousands of sibling elements. They return `null` or the embed, as documented.
