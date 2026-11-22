---
'social-embeds': patch
---

Platform components are smaller again: each now bundles only the URL half of its platform's parser, not the code that reads embed code, which only `parseEmbed` needs. `TikTokEmbed` adds about 3.1 KB gzipped instead of 3.5 KB, `YouTubeEmbed` 3.9 KB instead of 4.1 KB and `FacebookEmbed` 6.8 KB instead of 7.5 KB. `<SocialEmbed>` and the element grow by about 0.2 KB.
