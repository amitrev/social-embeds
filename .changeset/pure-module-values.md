---
'social-embeds': patch
---

Platform components and `createSocialEmbed` no longer carry every platform's parser in Next.js builds. Under Turbopack a platform component added at least 15 KB gzipped to a page and now adds 3 to 7 KB, as under webpack (`YouTubeEmbed` 4.5 KB instead of 15.8 KB). `createSocialEmbed([youtube])` adds about 7 KB instead of 17 KB under both bundlers.
