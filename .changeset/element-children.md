---
'social-embeds': minor
---

`<social-embed>` no longer moves or removes its own children. A framework that renders children into it, such as React's `{loading && <p />}`, no longer crashes with `NotFoundError`. The children stay in place, unrendered; the embed shows through a shadow root holding only `<slot name="embed">`, and still renders into the light DOM. If other code removes the embed, for example a framework text update or a DOM morph, it renders again. The element now also reads embed code from an `html` attribute, which React 19, Vue and Svelte write before the tag is defined.
