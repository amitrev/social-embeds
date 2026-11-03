# Releasing

Releases go out from GitHub Actions through [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC). There is no npm token: npm trusts one workflow file in this repository, and the package gets a provenance attestation that links it to the commit and the run that built it.

## How a release works

`.github/workflows/release.yml` runs on every push to `main`:

1. **select-mode** checks the repository. If there are changesets, the mode is `version`. If `package.json` has a version that is not on npm yet, the mode is `publish`. Otherwise it does nothing.
2. **version** opens or updates the "Version Packages" pull request. It runs `changeset version`, which bumps `package.json`, writes `CHANGELOG.md` and deletes the changesets.
3. When that pull request is merged, **pack** runs the CI checks, builds and packs the tarball. It has no publish rights.
4. **publish** runs in the `npm` environment and is the only job that may request an OIDC token. Its `changeset publish` runs `pnpm publish` on the packed tarball. pnpm exchanges GitHub's OIDC token for a short-lived npm token, publishes with provenance, and the action then creates the git tag and the GitHub release.

The job holds no npm token, and `setup-node` is not given a registry, so if the OIDC exchange fails there are no credentials to fall back on. pnpm then logs `Skipped OIDC: …` and the publish fails; it cannot go out by another route.

## One-time setup

npm lets you add a trusted publisher only to a package that already exists, so the name is first claimed with a placeholder. Do the steps in this order.

### 1. GitHub settings

1. **Settings → Actions → General → Workflow permissions:** turn on "Allow GitHub Actions to create and approve pull requests". The version job needs it to open the "Version Packages" pull request.
2. **Settings → Environments → New environment:** name it `npm`. Under "Deployment branches and tags", allow only `main`. Optionally add yourself as a required reviewer; every publish then waits for your approval.

### 2. Placeholder `0.0.0` on npm

From an empty folder outside the repository, with an npm account that has two-factor authentication:

```sh
npm login
```

```sh
printf '{\n  "name": "social-embeds",\n  "version": "0.0.0",\n  "description": "Placeholder. Install 0.1.0 or later.",\n  "license": "MIT",\n  "repository": "github:amitrev/social-embeds"\n}\n' > package.json
```

```sh
npm publish --access public
```

The placeholder contains only `package.json`. The first real release, 0.1.0, is the first one published from the workflow, with provenance.

### 3. Trusted publisher

On npmjs.com, open **social-embeds → Settings → Trusted Publisher → GitHub Actions** and enter, exactly (the fields are case-sensitive):

| Field                | Value           |
| -------------------- | --------------- |
| Organization or user | `amitrev`       |
| Repository           | `social-embeds` |
| Workflow filename    | `release.yml`   |
| Environment name     | `npm`           |

Or from the command line, with npm 11.15.0 or later:

```sh
npx npm@latest trust github social-embeds --repo amitrev/social-embeds --file release.yml --env npm --allow-publish
```

A new trusted publisher expires unless a publish succeeds within 2 days, so do step 5 within that time.

### 4. Disallow tokens

**social-embeds → Settings → Publishing access:** select "Require two-factor authentication and disallow tokens" and save. This does not affect trusted publishing.

### 5. First release

Merge the "Version Packages" pull request for 0.1.0. When the publish job has finished:

- the npm page of `social-embeds@0.1.0` shows a provenance badge linking to the workflow run, or `npm view social-embeds@0.1.0 dist.attestations` lists it;
- the job log has no `Skipped OIDC` line.

Then retire the placeholder and the local login:

```sh
npm deprecate social-embeds@0.0.0 "Placeholder, not a release. Install 0.1.0 or later."
```

```sh
npm logout
```

## When the publish job fails

- **401, 403 or `ENEEDAUTH`** with `Skipped OIDC` in the log: the trusted publisher does not match the run. Check the four fields above against the repository owner, its name, the workflow file name and the job's `environment`.
- **The trusted publisher expired** (no successful publish within 2 days): delete it on npmjs.com, add it again, and re-run the failed workflow.
- **No "Version Packages" pull request:** check the Actions setting in step 1.
