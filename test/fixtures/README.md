# Fixtures

Real embed codes, stored byte for byte as the platform produced them. Prettier ignores this directory so they stay unchanged. Tests import them with Vite's `?raw` suffix.

| File                                           | Source                                                                                         | Collected  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| `x/oembed-basic.html`                          | `publish.x.com/oembed?url=https://x.com/jack/status/20`                                         | 2026-11-03 |
| `x/oembed-options.html`                        | same, with `theme=dark&hide_thread=true&hide_media=true&align=center&lang=es&dnt=true&maxwidth=400` | 2026-11-03 |
| `x/oembed-link.html`                           | `publish.x.com/oembed?url=https://twitter.com/BarackObama/status/266031293945503744`            | 2026-11-03 |
| `x/oembed-hashtag.html`                        | `publish.x.com/oembed?url=https://twitter.com/TheEllenShow/status/440322224407314432`           | 2026-11-03 |
| `youtube/share.html`                           | YouTube share dialog → Embed, video `jNQXAC9IVRw`                                               | 2026-11-03 |
| `youtube/share-start.html`                     | same, "Start at" ticked                                                                        | 2026-11-03 |
| `youtube/share-nocookie-controls-start.html`   | same, plus "Enable privacy-enhanced mode" ticked and "Show player controls" unticked           | 2026-11-03 |
| `youtube/oembed.html`                          | `youtube.com/oembed?url=https://www.youtube.com/watch?v=jNQXAC9IVRw&format=json`                | 2026-11-03 |
| `threads/oembed.html`                          | `graph.threads.net/v1.0/oembed?url=https://www.threads.com/@instagram/post/DfQSavwEs5C`         | 2026-11-03 |
| `threads/oembed-maxwidth.html`                 | same, with `maxwidth=400`                                                                      | 2026-11-03 |
| `tiktok/oembed-player.html`                    | `tiktok.com/oembed?url=https://www.tiktok.com/@scout2015/video/6718335390845095173`             | 2026-11-03 |
| `tiktok/webapp-share-player.html`              | TikTok website share dialog → Embed, pasted by the maintainer                                  | 2026-11-03 |
| `instagram/post-captioned.html`                | Instagram post menu → Embed, "Include caption" on, pasted by the maintainer                    | 2026-11-03 |
| `facebook/post-iframe.html`                    | Facebook post menu → Embed, pasted by the maintainer                                           | 2026-11-03 |
| `facebook/video-iframe-reel.html`              | Facebook reel menu → Embed, "Include full post" ticked, as published in a news article        | 2026-11-11 |
| `facebook/post-sdk-docs.html`                  | Meta's [Embedded Posts](https://developers.facebook.com/docs/plugins/embedded-posts) "Add Code Manually" steps 2–3 | 2026-11-03 |
| `facebook/video-sdk-docs.html`                 | Meta's [Embedded Videos](https://developers.facebook.com/docs/plugins/embedded-video-player) "Full Code Example", `<body>` content | 2026-11-03 |

Variants that no current source produces are derived inside the tests from these files: the legacy `twitter.com` hosts, X `data-conversation`/`data-align`, the Facebook video iframe without the post text, and Instagram permalink and caption variants. The TikTok blockquote tests use the structure from brief §3 (see `docs/decisions.md` D11).
