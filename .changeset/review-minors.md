---
'social-embeds': patch
---

Tighten wave 4 parsing from the release review:

- Tumblr embed code whose frame names a different blog than its post link is rejected.
- A SoundCloud `secret_token` given as a player parameter is kept with the track.
- Option keys that name a player's content are dropped in any letter case.
- A Bluesky URL with a malformed DID reports "not a supported post URL" instead of asking for embed code.
- `kick.com/clips`, `kick.com/video` and `kick.com/videos` are no longer read as channels.
