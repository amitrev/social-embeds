# Global Samples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every sample post in `test/fixtures/`, the tests, the playground and the README with posts that follow the global sample rules, and ship it as 0.5.2.

**Architecture:** Data and tests only. Each fixture is recaptured with the same shape from a post that follows the rules; the tests that import it get the new expected values. Platforms are done in four groups, each a commit, so the suite is green between groups. The playground, `/many`, README and a patch changeset follow.

**Tech Stack:** Vitest fixtures imported with `?raw`, Next.js playground, Changesets.

**Spec:** [docs/superpowers/specs/2026-11-20-global-samples-design.md](../specs/2026-11-20-global-samples-design.md)

## Global Constraints

- Every sample: English; neutral (no politics, sport, news events, religion, controversy); no celebrities (a creator featured by an official account is fine); from the platform's own official account or its classic first post (`@jack` status 20, YouTube `jNQXAC9IVRw`, SoundCloud Forss _Flickermood_); public and lasting.
- Music: the platform's own podcast audio where the player is the same; otherwise a royalty-free or little-known, non-celebrity artist.
- A fixture keeps its shape: same variant, dialog options and wrapper. Byte for byte as the platform produced it; derived only where the spec allows, and marked "derived" in `test/fixtures/README.md`.
- `*-docs` fixtures are recaptured from a real dialog or oEmbed and renamed after the new source; where only docs show the shape, the chosen post goes into the docs markup (derived). Exception: `dailymotion/player-id-docs.html` keeps Dailymotion's docs pair `x8lr5`/`x84sh87` if `x84sh87` passes the rules.
- No new fixtures except where a recapture needs one to keep an existing test's shape.
- `docs/decisions.md` entries before this work are not edited; one new entry (D80) records the chosen post per fixture.
- No package behaviour change; a parser bug found on the way gets its own fix and changeset.
- Commit messages: Conventional Commits, no AI attribution line.
- Every task ends with `pnpm test`, `pnpm typecheck`, `pnpm lint` green.

## Review Focus

1. A recaptured fixture whose markup changed shape (platforms change their oEmbed output), with the test loosened to pass: each test must keep its original intent. Checked per task by comparing the assertion before and after (Task 3–6, Step 3).
2. Old post ids left anywhere: tests, playground, README. Checked in Task 7 with a grep for every replaced id.
3. SSR and fallback-content tests (`ssr.test.tsx`, X/Instagram/Threads/Bluesky `fallbackHtml`) asserting text from the new posts, not just "non-empty". Checked in Tasks 3 and 6.
4. `verify.test.ts`'s fixture table still covers every platform after renames. Checked in Task 7.
5. A demo sample that renders an error on the built playground. Checked in Task 7's browser pass.

---

### Task 0: Branch

- [ ] `git switch -c chore/global-samples` from `main`; commit the spec and this plan: `docs: add the global samples design and plan`.

### Task 1: Choose every post

No fixture changes yet.

**Files:** Modify `docs/decisions.md` (new section "Global samples (2026-11-20)", entry D80).

- [ ] **Step 1: For each of the 51 fixtures** (grouped in the table below), pick a post from the platform's official account that has the shape the fixture needs, check it against the rules, and check its embed shape matches (for example, a tweet that contains a link for `x/oembed-link.html`, one with a hashtag for `x/oembed-hashtag.html`).
- [ ] **Step 2: Pick the demo and README URLs** the same way (`playground/samples.ts` `URLS`, `playground/app/many/page.tsx`, the platform pages' extra sections, README examples). Reuse fixture posts where the type matches.
- [ ] **Step 3: Write D80**: a table of fixture or sample → new post URL → account → why it fits; the docs fixtures' new names; Dailymotion's `x84sh87` check; any platform that fell back to its docs sample or kept its fixture, and why.
- [ ] **Step 4: Ask the maintainer for the pastes** (stop here until they arrive): LinkedIn Embed (full and "less text"), Facebook Embed for the post, the video and the reel, TikTok's website share Embed, Reddit Share → Embed for the post and the comment, Threads Embed. Name the exact post URL for each.
- [ ] **Step 5: Commit** `docs: choose the global sample posts` (D80 only).

| Group                         | Fixtures                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A — script platforms (Task 3) | `x/*` (4), `instagram/post-captioned`, `threads/*` (2), `facebook/*` (4)                                                                       |
| B — wave 1–2 iframes (Task 4) | `tiktok/*` (2), `youtube/*` (4), `telegram/*` (2), `snapchat/*` (2), `linkedin/*` (2), `reddit/*` (2), `pinterest/*` (2)                       |
| C — wave 3 (Task 5)           | `spotify/*` (4), `vimeo/*` (2), `twitch/*` (3), `dailymotion/*` (2)                                                                            |
| D — wave 4 (Task 6)           | `bluesky/oembed`, `soundcloud/*` (5), `applemusic/*` (2), `applepodcasts/share-episode`, `tumblr/oembed`, `kick/player-channel`, `giphy/*` (2) |

### Task 2: Capture

- [ ] **Step 1:** Capture every fixture that needs no sign-in, as before (oEmbed `html` field, Share/Embed dialog, docs), into a scratch directory, not yet over the fixtures.
- [ ] **Step 2:** When the maintainer's pastes arrive, save them the same way, byte for byte (no trailing newline added).
- [ ] **Step 3:** For each capture, confirm `parseEmbed` returns non-null and the same `platform`, `kind` and `variant` as the old fixture: `node -e` against `dist/parser.js`, or a throwaway Vitest file in the scratch directory. A capture whose shape differs is a finding: pick another post, or rule and record it in D80.

### Tasks 3–6: Swap fixtures and update tests, one group each

Same steps for each group (A, B, C, D):

**Files:** the group's fixtures in `test/fixtures/{platform}/`, their rows in `test/fixtures/README.md`, and every test that imports them (map: `grep -rl "fixtures/{platform}/" test`), including `test/parser/verify.test.ts`, `test/parser/parse-embed.test.ts`, `test/components/social-embed.test.tsx`, `ssr.test.tsx` and the per-wave component tests.

- [ ] **Step 1: Swap the fixtures** (rename `*-docs` files per D80 and update their imports).
- [ ] **Step 2: Run** `pnpm exec vitest run` — expected: FAIL in exactly the tests that assert on the old values (ids, URLs, sizes, fallback text, options).
- [ ] **Step 3: Update each failing assertion to the new post's values**, keeping its intent: an assertion that checked a specific option, size or fallback string checks the new post's equivalent, never a looser matcher. Inline URLs in these tests that name a replaced post move to the new post; format-only synthetic URLs stay.
- [ ] **Step 4: Run** `pnpm test && pnpm typecheck && pnpm lint` — expected: PASS.
- [ ] **Step 5: Commit** `test: move {group} fixtures to global sample posts`.

Group notes:

- **A:** `ssr.test.tsx` asserts the X link post's fallback text; it moves to the new post's text. `x/oembed-options.html` keeps the same oEmbed query options.
- **B:** `youtube/*` keep `jNQXAC9IVRw` (classic first post) unless recapture finds a reason to change; `telegram/*` stay on `t.me/telegram`.
- **C:** Spotify's track fixture becomes a Spotify Original episode only if it renders the same compact 152 px player; otherwise a little-known artist's track. Twitch fixtures move to the `twitch` channel and its own video and collection.
- **D:** SoundCloud keeps Forss for the track fixtures; Apple Music's album and song move to a little-known, non-celebrity artist; Apple Podcasts moves to an Apple-made podcast episode; Kick to Kick's own channel; Giphy to `@giphy`.

### Task 7: Playground, README, release, browser check

**Files:** `playground/samples.ts`, `playground/app/many/page.tsx`, `playground/app/[platform]/page.tsx`, `README.md`, `.changeset/global-samples.md`.

- [ ] **Step 1:** Move every demo and README URL to the D80 posts.
- [ ] **Step 2: Grep for leftovers.** Every replaced id from D80's "old" column (for example `266031293945503744`, `440322224407314432`, `vasil.popov`, `r/bulgaria`, `1xz8iq4`, `xqc`, `erling.haaland`, `1440857781`, `1200361736`, `scout2015`, `DfPQchkG1tg`, `99360735500167749`, `40464143`) — expected: no match outside `docs/decisions.md` entries before D80 and CHANGELOG.md.
- [ ] **Step 3:** `verify.test.ts`'s fixture table names a fixture for every platform; add any that a rename dropped.
- [ ] **Step 4:** `.changeset/global-samples.md`: `'social-embeds': patch` — "README examples use official, neutral sample posts."
- [ ] **Step 5: Browser check** of `next build` + `next start`: every platform page and `/many`, each section brought into view; no `onError` message except the documented Bluesky handle sample and Dailymotion's Player ID sample. Record in D80.
- [ ] **Step 6:** `pnpm test && pnpm typecheck && pnpm lint && pnpm format:check` (ignore untracked `.claude/` and `.superpowers/`) — PASS. Commit `docs: use global sample posts in the playground and README`.
- [ ] **Step 7:** Whole-branch review, then hand back for push and PR. After merge: Version Packages PR → 0.5.2 → the maintainer approves on npm and publishes the GitHub release, which deploys the demo; then check the live demo.
