# Contributing

Thanks for helping with `social-embeds`. This project follows a [Code of Conduct](./CODE_OF_CONDUCT.md).

## Setup

You need Node.js 22 or later and pnpm, at the version pinned in `package.json` (`corepack enable` installs it).

```sh
pnpm install
```

| Command                 | What it does                                                          |
| ----------------------- | --------------------------------------------------------------------- |
| `pnpm build`            | Builds `dist/` with tsdown                                            |
| `pnpm typecheck`        | Type-checks the package, and the parser without DOM types             |
| `pnpm lint`             | ESLint                                                                |
| `pnpm format`           | Prettier (`pnpm format:check` only checks)                            |
| `pnpm test`             | Vitest: parser tests in Node, loader and component tests in happy-dom |
| `pnpm check:directives` | After a build: only `dist/index.js` starts with `'use client'`        |
| `pnpm check:publint`    | publint                                                               |
| `pnpm check:attw`       | Are the Types Wrong, ESM-only profile                                 |

CI runs all of them on Node 22, 24 and 26.

## Layout

- `src/parser/`: `social-embeds/parser`. Pure functions over strings: no React, no DOM, no Node APIs (`tsconfig.parser.json` enforces this). Each platform lives in `src/parser/platforms/`.
- `src/loader/`: loads each platform script once per page.
- `src/components/`: the React components. Script-based platforms use `ScriptEmbed` with a driver from `drivers.ts`; iframe platforms use `IframeEmbed`.
- `test/fixtures/`: real embed codes, byte for byte, with their source in `test/fixtures/README.md`.
- `playground/`: a Next.js app for checking embeds in a real browser.
- `docs/decisions.md`: what each platform actually does, with evidence. Read the entries for a platform before changing it.

## Running the playground

The playground uses the built package, so build first:

```sh
pnpm build
pnpm --dir playground dev
```

Open http://localhost:3000. There is one page per platform (embed code, post URLs, a post parsed on the server and a box for your own input), and `/many` with 20 embeds. The bar at the bottom counts platform scripts; each count must stay at 0 or 1, also while you navigate between pages. Run `pnpm build` again after changing `src/`.

Keep the browser window visible while you check embeds. Browsers stop painting hidden tabs, and then X never sizes its posts and lazy embeds never start.

## Adding a platform

1. **Find out what the platform really does.** Get real embed code for public posts from the platform's Embed dialog or oEmbed endpoint, and read its script where the docs are silent. Write what you find, with evidence, in `docs/decisions.md`.
2. **Fixtures.** Save each embed code variant unchanged in `test/fixtures/{platform}/` and add a row to `test/fixtures/README.md`.
3. **Parser.** Add `src/parser/platforms/{platform}.ts` implementing `PlatformParser`: `parse` for embed code, `match` for URLs, the platform's own script, and the whitelist that rebuilds fallback content. Register it in `src/parser/platforms/index.ts`, add the name to `Platform` in `src/parser/types.ts` and its `kind`/`variant` pairs to `src/parser/verify.ts`. Test every variant in `test/parser/`.
4. **Component.**
   - Script-based: add the script to `src/loader/platform-scripts.ts`, a driver to `src/components/drivers.ts` (how to render the container and how to tell it has rendered), and a component that renders `ScriptEmbed`. Write the platform markup without the class its script looks for; the driver adds it when the embed renders (decision D39).
   - Iframe: add a component that renders `IframeEmbed`.
   - Export it from `src/index.ts`, route to it in `src/components/social-embed.tsx`, and test it in `test/components/`.
5. **Playground.** Add the platform's samples to `playground/samples.ts` and check it in a browser, including after client navigation and on a page with other platforms.
6. **README.** Add the platform to the Platforms table, with its URL formats, options and limitations, and an example.
7. **Changeset.** Run `pnpm changeset` (see below).

## Changesets and releases

Every pull request that changes the published package needs a changeset:

```sh
pnpm changeset
```

Pick the bump (patch for fixes, minor for new features, major for breaking changes) and write a one-line summary for the changelog. Commit the generated file in `.changeset/` with your change. Changes to tests, docs or the playground alone need none.

Releases are automated by `.github/workflows/release.yml`:

1. When changesets reach `main`, the workflow opens or updates a "Version Packages" pull request that bumps the version and updates `CHANGELOG.md`.
2. Merging that pull request publishes the new version to npm through trusted publishing, with provenance, and creates the GitHub release and tag. No npm token is involved.

The maintainer's one-time setup is in [docs/releasing.md](./docs/releasing.md).
