---
'social-embeds': patch
---

`<social-embed>` now restyles in place when `width`, `max-width`, `height`, `max-height` or `eager` changes, instead of reloading the embed. `eager="false"` now means off, and React 19's `eager` now means on. Embed code written straight inside the element, without a `<template>`, now renders. Placeholder copies no longer duplicate `id`s.
