---
'social-embeds': minor
---

Add a generic iframe embed and seven platforms.

- **Generic iframe:** embed code that no platform claims, but that holds one iframe, now renders, for Google Maps, Deezer, Loom, CodePen and any other site that gives iframe code. Only checked attributes reach the page: `src` must be `https:`, `allow` keeps media features only, and no script runs. `GenericIframeEmbed`, `parseIframe` and `ParsedIframe` are new; `parseIframe` is exported from `social-embeds/parser`. Plain URLs to unknown sites still render nothing.
- **Platforms:** Truth Social, Imgur, Tenor, Streamable, Strava, Flickr and Rumble, each with a component (`TruthSocialEmbed`, `ImgurEmbed`, `TenorEmbed`, `StreamableEmbed`, `StravaEmbed`, `FlickrEmbed`, `RumbleEmbed`) and URL or embed code input, in `<SocialEmbed>` and `<social-embed>`. A Rumble page URL needs a lookup, so use its embed code. Strava's style option is the prop `embedStyle`.
- **`Platform` has seven new values** (`'truthsocial'`, `'imgur'`, `'tenor'`, `'streamable'`, `'strava'`, `'flickr'`, `'rumble'`). An exhaustive `switch` over `Platform` stops compiling until it handles them.
- **Behaviour change:** iframe code that `<SocialEmbed>` used to hand to `fallback` now renders. Non-iframe code and iframes that are rejected still reach `fallback`.
