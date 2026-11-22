---
'social-embeds': minor
---

New `createSocialEmbed(platforms)`: a `<SocialEmbed>` that recognises only the platforms you list, so a bundler leaves the others out. With YouTube, X, Instagram, Facebook and TikTok it adds about 13 KB gzipped to an app, against about 28 KB for `<SocialEmbed>`, which recognises every platform. Each platform is exported under its id (`youtube`, `x`, `instagram`, …), and `genericIframe` adds generic iframe embeds. Call it in a `'use client'` module:

```tsx
'use client';
import { createSocialEmbed, genericIframe, x, youtube } from 'social-embeds';

export const SocialEmbed = createSocialEmbed([youtube, x, genericIframe]);
```
