---
'social-embeds': patch
---

Iframe embeds that do not load within 15 s of coming near the viewport now report `social-embeds: {title} did not load` through `onError` and the element's `error` event. A frame the browser blocked, such as TikTok, Snapchat or LinkedIn under Firefox's tracking protection, used to stay on its placeholder with no event. A load that arrives later still calls `onLoad`.
