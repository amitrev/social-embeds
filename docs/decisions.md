# Decisions

Evidence-backed decisions and findings required by the project brief (§10). Each entry records what was decided, why, and the evidence.

## Tooling (Milestone 1, 2026-11-03)

### D1. Node.js: `engines.node >=22`, CI on 22, 24 and 26

The brief specified Node 20+ with CI on 20 and 22. Changed with maintainer approval.

- Node 20 reached end of life on 2026-04-30 ([nodejs/Release schedule](https://github.com/nodejs/Release/blob/main/schedule.json)).
- Current tool releases exclude Node 20:
  - tsdown 0.23.4: `^22.18.0 || ^24.11.0 || >=26.0.0`
  - vitest 5.1.0: `^22.12.0 || ^24.0.0 || >=26.0.0`
  - @changesets/cli 3.0.3: `^22.11 || ^24 || >=26`
- Supported lines on 2026-11-03: 22 (maintenance, EOL 2027-04-30), 24 (maintenance, EOL 2028-04-30), 26 (active LTS since 2026-10-28).

### D2. `'use client'` is checked by `scripts/check-directives.mjs`

§5.3 asks for the directive to be verified with publint and `@arethetypeswrong/cli`. Neither tool checks directives: publint reports "All good!" whether or not the directive is present, and neither package's source mentions `use client`.

The script runs in CI after the build. It fails unless `dist/index.js` starts with `'use client'` and no other emitted `.js` file carries it. Both negative cases were tested (directive removed from `index.js`; directive added to `parser.js`) and fail as expected.

Rolldown keeps a top-level directive only when the module is an entry module ([Rolldown: directives](https://rolldown.rs/in-depth/directives)). Consequences:

- The directive lives only in `src/index.ts`. Component files must not carry their own.
- The build prints a `MODULE_LEVEL_DIRECTIVE` warning for `src/index.ts`. The output is still correct, as the check proves.

### D3. TypeScript 6.0.3, not 7.x

`typescript@latest` is 7.0.2, but typescript-eslint 8.72.1 declares the peer range `typescript >=4.8.4 <6.1.0`.

### D4. Dev dependencies required by listed tools

- `vite` 8.3.5: required peer of Vitest 5 (`peerDependenciesMeta.vite.optional: false`).
- `@testing-library/dom` 10.4.2: required peer of `@testing-library/react` 16.
- `@eslint/js` 10.0.1: ESLint's own recommended core rules (approved).

### D5. `@arethetypeswrong/cli` runs with `--profile esm-only`

The default `strict` profile fails any ESM-only package (`node10`: "Resolution failed"; `node16` from CJS: ESM via dynamic import only). `--profile esm-only` ignores those two resolutions, which matches §2 (no CommonJS build).

### D6. The parser is DOM-free at compile time

`tsconfig.parser.json` type-checks `src/parser` with `lib: ["ES2022"]` and `types: []`. Any use of `document`, `window`, `DOMParser` or Node globals there fails `pnpm typecheck` (§5.1).

### D7. pnpm 12 minimum release age

pnpm 12 gates packages younger than its minimum release age. vitest 5.1.0 (published 2026-11-02) was inside that window at install time, so pnpm added `minimumReleaseAgeExclude` entries for `vitest`, `@vitest/mocker` and `@vitest/spy` 5.1.0 to `pnpm-workspace.yaml`. Remove them in Milestone 2, once 5.1.0 has cleared the gate.

### D8. Release workflow deferred to Milestone 8

The npm trusted-publisher configuration is bound to the workflow filename and the maintainer's npm account. To verify in Milestone 8 against the official npm and pnpm docs:

- how `changeset publish` → `pnpm publish` performs the OIDC exchange, and which versions are required;
- that a failed exchange cannot fall back silently;
- whether a trusted publisher can be configured before the first publish.

### D9. `CODE_OF_CONDUCT.md` in Milestone 8

§9 lists it, but no milestone did.

## Platform behaviour

### D10. Facebook `fb-video` div embed code renders through the SDK

§3 limits the `fb-video` SDK path to URL input, and §5.4 renders video embed code "as the iframe that came in". But §4.1 requires parsing `fb-video` divs, which contain no iframe. Resolved by the maintainer on 2026-11-03: parse as `kind: 'video'`, `variant: 'sdk'`, with its `data-*` options. Same reasoning as URL input: the aspect ratio is unknown.

## Open VERIFY items

| ID  | Item                                            | Milestone |
| --- | ----------------------------------------------- | --------- |
| V1  | Threads manual initialisation (§3)              | 5         |
| V2  | TikTok manual initialisation (§3)               | 5         |
| V3  | Facebook post URL shapes the SDK accepts (§4.2) | 2         |
| V4  | Default `maxWidth` per platform (§6)            | 4, 5      |
| V5  | Fluid-width attribute per platform (§6.1)       | 5         |
