# GitHub Pages Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the playground as a static site at `https://amitrev.github.io/social-embeds/`, deployed on each GitHub release.

**Architecture:** `playground/next.config.ts` switches the Next.js build to a static export under a base path when `PAGES_BASE_PATH` is set. A new `pages.yml` workflow builds the package and the playground from the release tag and deploys `playground/out` with GitHub's Pages actions. Local runs and CI are unchanged.

**Tech Stack:** Next.js 16 static export, GitHub Actions (`actions/configure-pages`, `upload-pages-artifact`, `deploy-pages`), pnpm 12.

**Spec:** [docs/superpowers/specs/2026-11-20-pages-demo-design.md](../specs/2026-11-20-pages-demo-design.md)

## Global Constraints

- Base path exactly `/social-embeds`; site URL `https://amitrev.github.io/social-embeds/`.
- Export only when `PAGES_BASE_PATH` is set; `next dev`, `next build` + `next start` and `ci.yml` keep working unchanged.
- Triggers exactly `release: types: [published]` and `workflow_dispatch`.
- Actions pinned to commit SHAs with the version as a comment: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`, `pnpm/action-setup@73e46992e05b19abd31f2f3c20e0e7370d762115 # v6.1.1`, `actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0`, `actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0`, `actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0`, `actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1`.
- Pasted embed code is never rendered as HTML on the demo (it is not today; do not change `try-embed.tsx`'s fallback).
- No repository settings are changed by the builder; the maintainer does the two Pages settings (spec, "Maintainer steps").
- Commit messages: Conventional Commits, no AI attribution line.

## Review Focus

1. A page reached by a full reload at its exported URL (`/social-embeds/youtube/`), not only by client navigation, renders. Checked in Task 1's local serve.
2. A URL that does not exist (`/social-embeds/nope/`) shows the exported 404, not a GitHub default page. Checked in Task 1.
3. Script and asset URLs carry the base path (no request to `/_next/…` at the server root). Checked in Task 1 with the network log.
4. `pnpm --dir playground build` without `PAGES_BASE_PATH` still produces a server build that `next start` serves. Checked in Task 1.
5. Twitch's `parent` on the demo is the Pages host, which Twitch accepts for HTTPS pages. Checked after the first real deploy (Task 3), since localhost cannot show it.

---

### Task 1: Static export behind `PAGES_BASE_PATH`, demo content

**Files:**

- Create: `playground/next.config.ts`
- Modify: `playground/app/page.tsx` (intro line), `playground/app/[platform]/page.tsx` (`DailymotionWithPlayerId` label), `.gitignore` (`playground/out/` if not covered)

- [ ] **Step 1: Write `playground/next.config.ts`**

```ts
import type { NextConfig } from 'next';

// Set only by the Pages workflow: a static export served under the repository's path.
const basePath = process.env.PAGES_BASE_PATH;

const config: NextConfig = basePath
  ? { output: 'export', basePath, trailingSlash: true }
  : {};

export default config;
```

- [ ] **Step 2: Content.** Home page: first paragraph becomes one line saying this is the live demo of the released `social-embeds` package, with links to the npm page and the GitHub repository; keep the existing build note as a second paragraph for local use. Dailymotion section: add that `x8lr5` is the sample from Dailymotion's docs and its stream may be refused after a few plays (D69).
- [ ] **Step 3: Build the export.** Run: `pnpm build && PAGES_BASE_PATH=/social-embeds NEXT_TELEMETRY_DISABLED=1 pnpm --dir playground build`. Expected: exit 0, `playground/out/index.html`, `playground/out/youtube/index.html`, `playground/out/many/index.html`, `playground/out/404.html` exist.
- [ ] **Step 4: Serve it under the base path and check in the browser.** Serve a scratch directory whose `social-embeds/` is a copy of `playground/out` on port 4173 (the scratchpad `serve.mjs` from wave 4, `.claude/launch.json` "probe" pointed at that directory). Check, for Review Focus 1–3: `/social-embeds/` renders with working nav links; a full reload of `/social-embeds/youtube/` renders its embeds; `/social-embeds/nope/` shows the export's 404; the network log has no request to `http://localhost:4173/_next/` without the base path; the console has no errors.
- [ ] **Step 5: Plain build unchanged.** Run: `pnpm --dir playground build` (no `PAGES_BASE_PATH`). Expected: exit 0 and the route table lists `/[platform]` as SSG, as before. (Review Focus 4.)
- [ ] **Step 6: Commit**

```bash
git add playground/next.config.ts playground/app .gitignore
git commit -m "feat(playground): export a static demo under PAGES_BASE_PATH"
```

### Task 2: Pages workflow

**Files:**

- Create: `.github/workflows/pages.yml`

- [ ] **Step 1: Write the workflow.** `name: Pages`; triggers per Global Constraints; `permissions: { contents: read, pages: write, id-token: write }`; `concurrency: { group: pages, cancel-in-progress: false }`. Job `build` on `ubuntu-latest`: checkout (default ref, which is the release tag on `release` events), pnpm setup, setup-node with `node-version: 24` and `cache: pnpm`, `pnpm install --frozen-lockfile`, `pnpm build`, `configure-pages`, `pnpm --dir playground build` with `env: { PAGES_BASE_PATH: /social-embeds, NEXT_TELEMETRY_DISABLED: 1 }`, `upload-pages-artifact` with `path: playground/out`. Job `deploy` `needs: build`, `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`, step `deploy-pages` with `id: deployment`.
- [ ] **Step 2: Lint the workflow.** Run: `pnpm exec prettier --check .github/workflows/pages.yml`. Expected: pass. If `actionlint` is installed locally, run it too; otherwise note that it was not run.
- [ ] **Step 3: Commit**

```bash
git add .github/workflows/pages.yml
git commit -m "ci: deploy the playground to GitHub Pages on each release"
```

### Task 3: Docs and first deploy

**Files:**

- Modify: `README.md` (a "Live demo" link under the intro; in the Dailymotion section, that playback with a publisher's own Player ID is not yet tested), `docs/releasing.md` (step 5: publishing the GitHub release also deploys the demo; the two Pages settings)

- [ ] **Step 1: Write the docs.** Run `pnpm exec prettier --check README.md docs/releasing.md`. Expected: pass.
- [ ] **Step 2: Commit**

```bash
git add README.md docs/releasing.md
git commit -m "docs: link the live demo and describe its deploy"
```

- [ ] **Step 3: Hand back** for push and PR. After merge and the maintainer's two Pages settings, the first deploy is a `workflow_dispatch` run of `Pages` (or the next release). Check the live site for Review Focus 5: Twitch's frame `src` has `parent=amitrev.github.io` and the channel renders.

## Follow-up (after the demo is live, separate work)

- Replace Bulgaria-specific samples with globally known posts (maintainer, 2026-11-20): Reddit `r/bulgaria`, the personal Facebook post, and any other local samples in `playground/samples.ts`, `/many`, and their fixtures where a fixture is the only source.
