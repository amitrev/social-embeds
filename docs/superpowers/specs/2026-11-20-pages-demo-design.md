# Public demo on GitHub Pages — design

Short design, 2026-11-20. Approved approach: export the existing playground.

## Intent

A public page where anyone can see every platform render and try their own embed code, linked from the README and npm. It makes the package usable by people outside the maintainer's projects (the "global" goal of wave 4).

## Goals

- The playground at `https://amitrev.github.io/social-embeds/`, every page as it runs locally.
- The demo always matches the version on npm.
- No change to how the playground runs locally (`next dev`, `next build` + `next start`) or in CI.

## Non-goals

- A new demo app, a custom domain, analytics, or a docs site.
- Deploying unreleased work from `main`.

## Anti-goals

- A demo that shows errors a visitor would blame on the package (Dailymotion's sample Player ID).
- A demo that renders a visitor's pasted HTML as HTML: the "your own embed code" box keeps showing unrecognised code as text.

## Approaches

1. **Static export of the playground (chosen).** Every page is already pre-rendered at build time, with no server routes, cookies or headers, and every internal link uses `next/link`. A `next.config.ts` with `output: 'export'` and `basePath` produces a static site.
2. A separate demo app: duplicates the samples and drifts from the playground. Dropped.
3. A rewrite in another framework: work without gain. Dropped.

## Decisions

- **When (maintainer, 2026-11-20):** on each release, when the maintainer publishes the GitHub release (`release: published`), building the release tag; plus `workflow_dispatch` to redeploy by hand.
- **Export only for Pages:** `next.config.ts` turns on `output: 'export'`, `basePath` and `trailingSlash: true` only when `PAGES_BASE_PATH` is set, so `next start` and CI keep working. `trailingSlash` makes each page a `…/index.html`, which Pages serves without guessing extensions.
- **Workflow:** `.github/workflows/pages.yml` — install, `pnpm build`, `pnpm --dir playground build` with `PAGES_BASE_PATH=/social-embeds`, then `actions/upload-pages-artifact` and `actions/deploy-pages`. Permissions `pages: write` and `id-token: write`, environment `github-pages`, a `pages` concurrency group. Actions pinned to commit SHAs, as the other workflows.
- **Content (my calls):** keep `/eager` and the script counter bar; add one intro line on the home page saying this is the live demo of the released package. Label the Dailymotion Player ID sample as Dailymotion's docs sample whose stream may be refused after a few plays. The README links the demo, and its Dailymotion section says playback with a publisher's own Player ID is not yet tested.
- **Maintainer steps (repository settings, not done by the builder):** Settings → Pages → Source: GitHub Actions. Settings → Environments → `github-pages` → allow the tag pattern `v*`, since a release deploy runs from the tag.

## Left to the builder

- Verify the export locally: serve `playground/out` under `/social-embeds/` and click through the home page, a platform page, `/many` and a 404.
- The intro line's wording.
