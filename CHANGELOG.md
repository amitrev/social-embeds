# social-embeds

## 0.2.1

### Patch Changes

- d19de4e: Instagram and Threads embeds no longer stay blank when the Facebook SDK finishes loading while their script is on its way, as on a page whose Facebook and Instagram embeds load at the same time.

## 0.2.0

### Minor Changes

- f586138: Add `maxHeight` for iframe embeds: the embed narrows to keep its aspect ratio, so a vertical video is at most that tall. `showText={false}` on `FacebookEmbed` now renders video embed code that shows the post text as the plain iframe, without the text and without the SDK.

### Patch Changes

- b81c544: Facebook video embed code that shows the post text (`show_text=true`) now renders through the SDK, so the text below the video is no longer cut off.

## 0.1.0

### Minor Changes

- 1872fb4: First release: `<SocialEmbed>` and the X, Instagram, Threads, Facebook, TikTok and YouTube components, which render a post from its embed code or URL, and `social-embeds/parser` with `parseEmbed` and `matchUrl`.
