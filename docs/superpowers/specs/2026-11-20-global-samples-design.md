# Global samples — design

2026-11-20. Replaces every sample post in the test fixtures, the playground (the live demo) and the README with posts that anyone, anywhere, can read without the post taking a side.

## Intent

The demo at `amitrev.github.io/social-embeds` and the repository are now public and aimed at users worldwide. Today some samples are Bulgarian, personal, political, from sport or from celebrities: a private person's Facebook post, a Bulgarian news reel, `r/bulgaria`, an Obama tweet, a football player's Snapchat, an 18+ Kick streamer. A visitor or contributor should see neutral, official content, and the tests should exercise the same posts the demo shows (maintainer, 2026-11-20).

## Rules for every sample (maintainer, 2026-11-20)

1. **English**: text, captions, titles.
2. **Neutral**: no politics, sport, news events, religion or anything controversial.
3. **No celebrities.** A post by an official account that features a creator or an ordinary person is fine, as long as that person is not a celebrity (maintainer, 2026-11-20).
4. **The right one**: from the platform's own official account (YouTube's channel, `@X`, `@telegram`, `@teamsnapchat`, `r/reddit`, LinkedIn's company page, Tumblr `@staff`, Bluesky `@bsky.app`, Twitch's `twitch`, Giphy's and SoundCloud's own accounts, Spotify's and Apple's editorial content, …). A platform's classic first post also qualifies: `@jack`'s first tweet, YouTube's "Me at the zoo", SoundCloud co-founder Forss's _Flickermood_.
5. **Lasting**: public, not likely to be deleted or made private.

## Goals

- Every fixture in `test/fixtures/` (51 files, 22 platforms) is recaptured from a post that follows the rules, and every test asserts on the new values.
- Every URL in `playground/samples.ts`, `playground/app/many/page.tsx`, the platform pages and the README examples follows the rules.
- The demo shows no error a visitor would blame on the package, other than the documented ones (the Bluesky handle sample, Dailymotion without a Player ID).

## Non-goals

- Rewriting git history: the old personal post stays in past commits.
- Changing `docs/decisions.md` entries: they are a dated record and keep the values they were written with. New entries reference the new fixtures.
- Changing package behaviour. This is data, tests and docs; a recapture that finds a parser bug gets its own fix and changeset.

## Anti-goals

- Weaker tests. Each fixture keeps its **shape**: the same embed variant, the same dialog options, the same wrapper. `x/oembed-options.html` stays an oEmbed response with `theme=dark&hide_thread=true&…`; `facebook/post-sdk-docs.html` stays SDK markup; `vimeo/responsive-docs.html` stays the responsive snippet. Only the content changes.
- Fabricated embed code. A fixture is still byte for byte what the platform produced. Where a source can only be derived (as `kick/player-channel.html` and `vimeo/responsive-docs.html` today), it stays derived and says so in `test/fixtures/README.md`.

## Approach

Every sample, recaptured (maintainer, 2026-11-20). Considered and rejected: replacing only the samples that break the rules (smaller, but leaves docs samples and third-party posts that the maintainer wants gone); a demo-only folder separate from the fixtures (tests and demo would show different posts).

## How it is built

- **Research first.** For each platform, pick a candidate post from the official account that has the shape each fixture needs (a tweet with a link, a tweet with a hashtag, a Facebook page video and reel, a Snapchat Lens and Spotlight, a Reddit post and a comment, …), check it against the rules, and record it. One `docs/decisions.md` entry lists the chosen post per fixture, with its URL and why it fits.
- **Capture.** As before: the platform's oEmbed endpoint, Share/Embed dialog or docs, cookie banners declined. The maintainer pastes what needs a sign-in: LinkedIn's Embed dialog, Facebook's post and reel Embed dialogs, TikTok's website share dialog.
- **Update tests** platform by platform, each a commit: fixture, its README row, the parser and component tests that import it, the routing table in `social-embed.test.tsx`, the verify table, the SSR test.
- **Fixtures copied from platform docs** (my call): the nine `*-docs` fixtures (Facebook SDK post and video, Pinterest widget, Twitch channel, video and collection, Dailymotion Player ID, Vimeo responsive) are recaptured from a real Embed dialog or oEmbed response where one produces the same shape, and renamed after their new source. Where only the docs show that shape, the chosen post is put into the docs markup and the fixture is marked "derived" in `test/fixtures/README.md`, as `vimeo/responsive-docs.html` is today.
- **No new fixtures** (my call): a demo sample that is a URL only (Instagram reel, Snapchat Spotlight, Spotify album, Apple Podcasts show, …) stays a URL; URL parsing is covered by `matchUrl` tests. A fixture is added only where a recapture needs a second file to keep an existing test's shape.
- **Dailymotion's Player ID** (my call): the maintainer has no Dailymotion Studio, and D63 forbids pairing another account's Player ID with another video. So `dailymotion/player-id-docs.html` keeps Dailymotion's own docs pair (`x8lr5`, `x84sh87`), the one docs sample left, if that video passes the rules; its "Playback error" is the documented one (D69). `dailymotion/oembed.html` moves to a video from Dailymotion's own channel.
- **A platform with no official post of the needed shape** (my call): use the platform's developer-docs sample, derived as above; if there is none, keep the current fixture if it passes the rules, and say so in the decisions entry.
- **Maintainer pastes**: LinkedIn (both fixtures), Facebook (post, video and reel Embed dialogs), TikTok's website share dialog, Reddit's Share → Embed (both fixtures were pasted before) and Threads (its oEmbed endpoint needs an app token).
- **Music** (maintainer, 2026-11-20): a song or album always has an artist. Use the platform's own podcast audio where it gives the same player (a Spotify Original episode for the compact 152 px player); otherwise a royalty-free or little-known, non-celebrity artist (Apple Music's 175 px song player and its album). SoundCloud keeps Forss, its classic first track.
- **Inline test URLs** (my call): a hand-written URL in a test that names a real post which breaks the rules is changed to the new post. Synthetic URLs that test a format (`/@/video/{id}`, a made-up Reddit id) stay.
- **Playground, `/many` and README** move to the same posts.
- **Release** (maintainer, 2026-11-20): a patch changeset for the new README samples ships the work as 0.5.2. Publishing that GitHub release updates the npm README and deploys the demo.
- **Browser check** of the built playground before merging, and of the live demo after the 0.5.2 release, as in waves 3 and 4.

## Candidate sources (to verify in research)

| Platform       | Candidate                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------- |
| X              | `@jack` status 20 (basic, options); `@X` posts with a link and with a hashtag             |
| YouTube        | "Me at the zoo" (`jNQXAC9IVRw`)                                                           |
| Instagram      | an `@instagram` post and reel                                                             |
| Threads        | a `@threads` post                                                                         |
| Facebook       | posts, a video and a reel from the Facebook or Meta page                                  |
| TikTok         | a `@tiktok` video                                                                         |
| Telegram       | `t.me/telegram` posts                                                                     |
| Snapchat       | `@teamsnapchat` profile; a Snapchat-made Lens; a Spotlight from an official account       |
| LinkedIn       | posts from LinkedIn's company page                                                        |
| Reddit         | an `r/reddit` announcement and a comment under it                                         |
| Pinterest      | a pin from `@pinterest`                                                                   |
| Spotify        | Spotify-made playlist, show and episode (a Spotify Original); a track: see open questions |
| Vimeo          | a Vimeo staff video (`76979871` is Vimeo's own)                                           |
| Twitch         | the `twitch` channel, one of its videos and a clip                                        |
| Dailymotion    | a video from Dailymotion's own channel                                                    |
| Bluesky        | `@bsky.app` posts                                                                         |
| SoundCloud     | Forss _Flickermood_ (classic), or SoundCloud's own account                                |
| Apple Music    | an Apple Music editorial playlist; album and song: see open questions                     |
| Apple Podcasts | an Apple-made podcast (for example Apple's event podcast) and an episode                  |
| Tumblr         | `@staff`                                                                                  |
| Kick           | Kick's own channel, if it has one                                                         |
| Giphy          | a GIF from `@giphy`                                                                       |

## Left to the builder

- The exact post per fixture, within the rules, recorded in the decisions entry.
- Commit order across platforms.
