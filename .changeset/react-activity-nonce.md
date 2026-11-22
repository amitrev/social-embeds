---
'social-embeds': patch
---

Script embeds no longer render twice, or call `onLoad` twice, when React's `<Activity>` hides and shows them (Next.js 16 `cacheComponents`). `onError` is no longer called twice for the same error under StrictMode. The scripts the package adds now carry the page's CSP nonce, copied from its first `<script nonce>`. Instagram and Threads embeds inside a shadow root, where their script cannot reach, now report that at once instead of after about 50 s.
