---
'social-embeds': patch
---

Platform components are smaller: `YouTubeEmbed` adds about 4.1 KB gzipped to an app instead of 6.1 KB, `TikTokEmbed` 3.4 KB instead of 5.5 KB, `XEmbed` 5.3 KB instead of 6.5 KB, and `FacebookEmbed` 7.4 KB instead of 8.8 KB. Components no longer bundle the HTML parser, tables covering every platform, other platforms' script loaders, Flickr's frame sizing, the height-message listener or Twitch's `parent` handling. An `embed` of another platform given to a platform component is now reported as `expected a {Platform} embed, got {id}`, with the other platform's id.
