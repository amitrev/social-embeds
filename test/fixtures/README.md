# Fixtures

Real embed codes, stored byte for byte as the platform produced them. Prettier ignores this directory so they stay unchanged. Tests import them with Vite's `?raw` suffix.

| File                                           | Source                                                                                         | Collected  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| `x/oembed-basic.html`                          | `publish.x.com/oembed?url=https://x.com/jack/status/20`                                         | 2026-11-03 |
| `x/oembed-options.html`                        | same, with `theme=dark&hide_thread=true&hide_media=true&align=center&lang=es&dnt=true&maxwidth=400` | 2026-11-03 |
| `x/oembed-link.html` | `publish.x.com/oembed?url=https://x.com/XDevelopers/status/1460323737035677698` | 2026-11-20 |
| `x/oembed-hashtag.html` | `publish.x.com/oembed?url=https://x.com/XDevelopers/status/1293593516040269825` | 2026-11-20 |
| `youtube/share.html`                           | YouTube share dialog → Embed, video `jNQXAC9IVRw`                                               | 2026-11-03 |
| `youtube/share-start.html`                     | same, "Start at" ticked                                                                        | 2026-11-03 |
| `youtube/share-nocookie-controls-start.html`   | same, plus "Enable privacy-enhanced mode" ticked and "Show player controls" unticked           | 2026-11-03 |
| `youtube/oembed.html`                          | `youtube.com/oembed?url=https://www.youtube.com/watch?v=jNQXAC9IVRw&format=json`                | 2026-11-03 |
| `threads/oembed.html`                          | `graph.threads.net/v1.0/oembed?url=https://www.threads.com/@instagram/post/DfQSavwEs5C`         | 2026-11-03 |
| `threads/oembed-maxwidth.html`                 | same, with `maxwidth=400`                                                                      | 2026-11-03 |
| `tiktok/oembed-player.html` | `tiktok.com/oembed?url=https://www.tiktok.com/@tiktok/video/7704834703446117662` | 2026-11-20 |
| `tiktok/webapp-share-player.html` | TikTok website share dialog → Embed, `@tiktok` video `7704834703446117662`, pasted by the maintainer | 2026-11-20 |
| `instagram/post-captioned.html` | `instagram.com/api/v1/oembed/?url=https://www.instagram.com/p/Df75lxnmIrF/&maxwidth=540` (@instagram), the `html` field | 2026-11-20 |
| `facebook/post-iframe.html` | Facebook page post `facebook/posts/1710463914458955` → Embed, pasted by the maintainer | 2026-11-20 |
| `facebook/video-iframe-reel.html` | Facebook page reel `1523911562856332` → Embed, "Include full post" ticked, pasted by the maintainer | 2026-11-20 |
| `facebook/post-sdk-docs.html` | derived: Meta's [Embedded Posts](https://developers.facebook.com/docs/plugins/embedded-posts) "Add Code Manually" steps 2–3, with the Facebook page's post `1710463914458955` | 2026-11-20 |
| `facebook/video-sdk-docs.html`                 | Meta's [Embedded Videos](https://developers.facebook.com/docs/plugins/embedded-video-player) "Full Code Example", `<body>` content | 2026-11-03 |
| `telegram/widget-configurator.html`            | `core.telegram.org/widgets/post` configurator, post `telegram/83`, defaults                    | 2026-11-18 |
| `telegram/widget-configurator-options.html`    | same, "Always hide" author photo, red accent, dark theme                                       | 2026-11-18 |
| `snapchat/profile-share.html`                  | snapchat.com profile `@teamsnapchat` → Share → Embed                                           | 2026-11-18 |
| `snapchat/lens-share.html` | snapchat.com Lens `6451403405463552` "Dog Lens" by Snapchat → Share → Embed | 2026-11-20 |
| `pinterest/widget-docs.html` | derived: Pinterest [widgets](https://developers.pinterest.com/docs/web-features/widgets/) docs' `pinit.js` tag and Pin widget anchor, with Pinterest's own pin `424605071145752542` | 2026-11-20 |
| `pinterest/oembed-iframe.html` | `pinterest.com/oembed.json?url=https://www.pinterest.com/pin/424605071145752542/`, the `html` field | 2026-11-20 |
| `reddit/post-share.html` | Reddit post → Share → Embed, r/reddit `11zso11` by an admin, pasted by the maintainer | 2026-11-20 |
| `reddit/comment-share.html` | Reddit comment → Share → Embed, `jde89cx` in r/reddit `11zso11`, pasted by the maintainer | 2026-11-20 |
| `linkedin/post-collapsed.html` | LinkedIn company page post `urn:li:ugcPost:7528828146767409153` → Embed this post, "less text", pasted by the maintainer | 2026-11-20 |
| `linkedin/post-full.html` | same post → Embed this post, full post, pasted by the maintainer | 2026-11-20 |
| `spotify/oembed-track.html` | `open.spotify.com/oembed?url=https://open.spotify.com/track/0LrHzQHk5gYGbMsoVbKDuS` (Kevin MacLeod, royalty-free), the `html` field | 2026-11-20 |
| `spotify/oembed-episode.html`                  | same, `episode/7makk4oTQel546B0PZlDM5`                                                          | 2026-11-19 |
| `spotify/oembed-playlist.html` | same, `playlist/37i9dQZF1DX4sWSpwq3LiO` (Spotify's Peaceful Piano) | 2026-11-20 |
| `spotify/oembed-show-video.html` | same, `show/4OsuS4G6ukepPsjme51uFt` (Spotify News, a video show; its title is the newest episode's) | 2026-11-20 |
| `vimeo/oembed.html`                            | `vimeo.com/api/oembed.json?url=https://vimeo.com/76979871`, the `html` field                    | 2026-11-19 |
| `vimeo/responsive-docs.html`                   | Vimeo help center's responsive snippet, without the autoplay parameters it appends with a second `?` (derived) | 2026-11-19 |
| `twitch/docs-channel.html` | derived: Twitch's [embed docs](https://dev.twitch.tv/docs/embed/video-and-clips/) live channel example, with Twitch's own channel `twitch` | 2026-11-20 |
| `twitch/docs-video.html` | derived: same, VOD example, with Twitch's video `1816688726` | 2026-11-20 |
| `twitch/docs-collection.html` | derived: same, collection example, with Twitch's collection `ryMlWIJaBxf2aQ` | 2026-11-20 |
| `dailymotion/player-id-docs.html`             | Dailymotion's [iframe docs](https://developers.dailymotion.com/docs/iframe-web), the responsive example with Player ID `x8lr5` | 2026-11-19 |
| `dailymotion/oembed.html` | `dailymotion.com/services/oembed?url=https://www.dailymotion.com/video/x84qh50` (Dailymotion's demo video), the `html` field (no Player ID: 403, D63) | 2026-11-20 |
| `bluesky/oembed.html` | `embed.bsky.app/oembed?url=https://bsky.app/profile/bsky.app/post/3mxu3hsnebc2v`, the `html` field | 2026-11-20 |
| `soundcloud/oembed-track.html`                 | `soundcloud.com/oembed?format=json&url=https://soundcloud.com/forss/flickermood`, the `html` field | 2026-11-20 |
| `soundcloud/oembed-playlist.html`              | same, `forss/sets/soulhack`                                                                     | 2026-11-20 |
| `soundcloud/oembed-user.html`                  | same, `forss`                                                                                   | 2026-11-20 |
| `soundcloud/share-visual.html`                 | soundcloud.com `forss/flickermood` → Share → Embed, visual player                              | 2026-11-20 |
| `soundcloud/share-classic.html`                | same, classic player                                                                            | 2026-11-20 |
| `applemusic/share-album.html` | music.apple.com album `1357820591` (Chad Crouch, *Birds of Oaks Bottom: Piano Solos*) → … → Copy Embed Code | 2026-11-20 |
| `applemusic/share-song.html` | same album, track "Great Blue Heron" `1357820597` → … → Copy Embed Code | 2026-11-20 |
| `applepodcasts/share-episode.html`             | podcasts.apple.com episode `1000802907981` of `id1200361736` → … → Embed Episode → Copy Embed Code | 2026-11-20 |
| `tumblr/oembed.html` | `www.tumblr.com/oembed/1.0?url=https://staff.tumblr.com/post/828009069026721792`, the `html` field | 2026-11-20 |
| `kick/player-channel.html` | derived: Kick's player URL for its own channel, `player.kick.com/kick`, in an iframe; Kick has no embed dialog (D75) | 2026-11-20 |
| `giphy/embed-fixed.html` | giphy.com GIF `l41YlHs99JsSptZf2` by GIPHY Studios Originals → Embed, Responsive off | 2026-11-20 |
| `giphy/embed-responsive.html` | same, Responsive on | 2026-11-20 |

Snapchat Spotlight embed code is derived from the profile and Lens codes (`docs/decisions.md` D50). Variants that no current source produces are derived inside the tests from these files: the legacy `twitter.com` hosts, X `data-conversation`/`data-align`, the Facebook video iframe without the post text, and Instagram permalink and caption variants. The TikTok blockquote tests use the structure from brief §3 (see `docs/decisions.md` D11).
