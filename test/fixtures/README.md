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
| `instagram/post-captioned.html`                | `instagram.com/api/v1/oembed/?url=https://www.instagram.com/p/DfPQchkG1tg/&maxwidth=540`, the `html` field | 2026-11-11 |
| `facebook/post-iframe.html`                    | Facebook post menu → Embed, pasted by the maintainer                                           | 2026-11-03 |
| `facebook/video-iframe-reel.html`              | Facebook reel menu → Embed, "Include full post" ticked, as published in a news article        | 2026-11-11 |
| `facebook/post-sdk-docs.html`                  | Meta's [Embedded Posts](https://developers.facebook.com/docs/plugins/embedded-posts) "Add Code Manually" steps 2–3; its sample post has since been removed | 2026-11-03 |
| `facebook/video-sdk-docs.html`                 | Meta's [Embedded Videos](https://developers.facebook.com/docs/plugins/embedded-video-player) "Full Code Example", `<body>` content | 2026-11-03 |
| `telegram/widget-configurator.html`            | `core.telegram.org/widgets/post` configurator, post `telegram/83`, defaults                    | 2026-11-18 |
| `telegram/widget-configurator-options.html`    | same, "Always hide" author photo, red accent, dark theme                                       | 2026-11-18 |
| `snapchat/profile-share.html`                  | snapchat.com profile `@teamsnapchat` → Share → Embed                                           | 2026-11-18 |
| `snapchat/lens-share.html`                     | snapchat.com Lens `61141491143` → Share → Embed                                                | 2026-11-18 |
| `pinterest/widget-docs.html`                   | Pinterest [widgets](https://developers.pinterest.com/docs/web-features/widgets/) docs: the `pinit.js` tag and the Pin widget anchor, joined | 2026-11-18 |
| `pinterest/oembed-iframe.html`                 | `pinterest.com/oembed.json?url=https://www.pinterest.com/pin/99360735500167749/`, the `html` field | 2026-11-18 |
| `reddit/post-share.html`                       | Reddit post → Share → Embed, r/bulgaria `1xz8iq4`, pasted by the maintainer                    | 2026-11-18 |
| `reddit/comment-share.html`                    | Reddit comment → Share → Embed, same post, pasted by the maintainer                            | 2026-11-18 |
| `linkedin/post-collapsed.html`                 | LinkedIn post → Embed this post, "less text", pasted by the maintainer                         | 2026-11-18 |
| `linkedin/post-full.html`                      | LinkedIn post → Embed this post, full post, pasted by the maintainer                           | 2026-11-18 |
| `spotify/oembed-track.html`                    | `open.spotify.com/oembed?url=https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC`, the `html` field | 2026-11-19 |
| `spotify/oembed-episode.html`                  | same, `episode/7makk4oTQel546B0PZlDM5`                                                          | 2026-11-19 |
| `spotify/oembed-playlist.html`                 | same, `playlist/37i9dQZF1DXcBWIGoYBM5M`                                                         | 2026-11-19 |
| `spotify/oembed-show-video.html`               | same, `show/4rOoJ6Egrf8K2IrywzwOMk` (a video show)                                              | 2026-11-19 |
| `vimeo/oembed.html`                            | `vimeo.com/api/oembed.json?url=https://vimeo.com/76979871`, the `html` field                    | 2026-11-19 |
| `vimeo/responsive-docs.html`                   | Vimeo help center's responsive snippet, without the autoplay parameters it appends with a second `?` (derived) | 2026-11-19 |
| `twitch/docs-channel.html`                     | Twitch's [embed docs](https://dev.twitch.tv/docs/embed/video-and-clips/), live channel example   | 2026-11-19 |
| `twitch/docs-video.html`                       | same, VOD example                                                                               | 2026-11-19 |
| `twitch/docs-collection.html`                  | same, collection example                                                                        | 2026-11-19 |
| `dailymotion/player-id-docs.html`             | Dailymotion's [iframe docs](https://developers.dailymotion.com/docs/iframe-web), the responsive example with Player ID `x8lr5` | 2026-11-19 |
| `dailymotion/oembed.html`                      | `dailymotion.com/services/oembed?url=https://www.dailymotion.com/video/xbxskia`, the `html` field (no Player ID: 403, D63) | 2026-11-19 |
| `bluesky/oembed.html`                          | `embed.bsky.app/oembed?url=https://bsky.app/profile/bsky.app/post/3n2mkgfb4tk2d`, the `html` field | 2026-11-20 |
| `soundcloud/oembed-track.html`                 | `soundcloud.com/oembed?format=json&url=https://soundcloud.com/forss/flickermood`, the `html` field | 2026-11-20 |
| `soundcloud/oembed-playlist.html`              | same, `forss/sets/soulhack`                                                                     | 2026-11-20 |
| `soundcloud/oembed-user.html`                  | same, `forss`                                                                                   | 2026-11-20 |
| `soundcloud/share-visual.html`                 | soundcloud.com `forss/flickermood` → Share → Embed, visual player                              | 2026-11-20 |
| `soundcloud/share-classic.html`                | same, classic player                                                                            | 2026-11-20 |
| `applemusic/share-album.html`                  | music.apple.com album `1440857781` → … → Copy Embed Code                                        | 2026-11-20 |
| `applemusic/share-song.html`                   | same album, track "Better Together" → … → Copy Embed Code                                      | 2026-11-20 |
| `applepodcasts/share-episode.html`             | podcasts.apple.com episode `1000802907981` of `id1200361736` → … → Embed Episode → Copy Embed Code | 2026-11-20 |
| `tumblr/oembed.html`                           | `www.tumblr.com/oembed/1.0?url=https://staff.tumblr.com/post/832577330595643392`, the `html` field | 2026-11-20 |
| `kick/player-channel.html`                     | derived: Kick's player URL `player.kick.com/xqc` in an iframe; Kick has no embed dialog (D75)   | 2026-11-20 |
| `giphy/embed-fixed.html`                       | giphy.com GIF `JIX9t2j0ZTN9S` → Embed, Responsive off                                           | 2026-11-20 |
| `giphy/embed-responsive.html`                  | same, Responsive on                                                                             | 2026-11-20 |

Snapchat Spotlight embed code is derived from the profile and Lens codes (`docs/decisions.md` D50). Variants that no current source produces are derived inside the tests from these files: the legacy `twitter.com` hosts, X `data-conversation`/`data-align`, the Facebook video iframe without the post text, and Instagram permalink and caption variants. The TikTok blockquote tests use the structure from brief §3 (see `docs/decisions.md` D11).
