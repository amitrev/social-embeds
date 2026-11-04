# Releasing

Releases go out from GitHub Actions through [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) and [staged publishing](https://docs.npmjs.com/staged-publishing). There is no npm token: npm trusts one workflow file in this repository, and that workflow can only stage a version. A maintainer approves it on npm with two-factor authentication, and only then does it go live. The package gets a provenance attestation that links it to the commit and the run that built it.

## How a release works

`.github/workflows/release.yml` runs on every push to `main`:

1. **select-mode** checks the repository. If there are changesets, the mode is `version`. If `package.json` has a version that is not on npm yet, the mode is `publish`. Otherwise it does nothing. It also checks for a `v{version}` git tag, which marks a version that is already staged.
2. **version** opens or updates the "Version Packages" pull request. It runs `changeset version`, which bumps `package.json`, writes `CHANGELOG.md` and deletes the changesets.
3. When that pull request is merged, **pack** runs the CI checks, builds and packs the tarball. It has no publish rights, and it is skipped when the version is already staged.
4. **stage** runs in the `npm` environment and is the only job that may request an OIDC token. `npm stage publish` exchanges GitHub's OIDC token for a short-lived npm token and stages the tarball with provenance. The job then pushes the `v{version}` tag and creates a draft GitHub release from the `CHANGELOG.md` entry. Its summary shows the stage id.
5. **You approve** the staged version on npm. It goes live as `latest`. Then you publish the draft GitHub release.

The stage job holds no npm token, and `setup-node` is not given a registry, so if the OIDC exchange fails there are no credentials to fall back on and the job fails. The short-lived token can stage but cannot approve: approval always needs a maintainer's two-factor authentication.

Changesets cannot stage yet ([changesets/changesets#2025](https://github.com/changesets/changesets/issues/2025)), so the workflow uses Changesets for versions and the changelog, and npm for staging. Staging needs npm 11.15.0 or later; the Node.js 24 on GitHub's runners ships it.

## Approving a release

When the stage job has finished:

1. On npmjs.com, open **social-embeds → Staged Packages**, check the version and click **Approve**. npm asks for your two-factor code. Or from a terminal, logged in to npm:

   ```sh
   npm stage approve <stage-id>
   ```

2. On GitHub, open **Releases**, edit the draft `v{version}` and click **Publish release**.

To drop a staged version instead, reject it (`npm stage reject <stage-id>` or **Reject** on npmjs.com), then delete its draft release and its `v{version}` tag. Until the tag is gone, the workflow will not stage that version again.

## One-time setup

npm lets you add a trusted publisher only to a package that already exists, so the name is first claimed with a placeholder. Do the steps in this order.

### 1. GitHub settings

1. **Settings → Actions → General → Workflow permissions:** turn on "Allow GitHub Actions to create and approve pull requests". The version job needs it to open the "Version Packages" pull request.
2. **Settings → Environments → New environment:** name it `npm`. Under "Deployment branches and tags", allow only `main`.

### 2. Placeholder `0.0.0` on npm

From an empty folder outside the repository, with an npm account that has two-factor authentication for writes:

```sh
npm login
```

```sh
printf '{\n  "name": "social-embeds",\n  "version": "0.0.0",\n  "description": "Placeholder. Install 0.1.0 or later.",\n  "license": "MIT",\n  "repository": "github:amitrev/social-embeds"\n}\n' > package.json
```

```sh
npm publish --access public
```

The placeholder contains only `package.json`. npm may also list a `0.0.0-stage` version: that is npm's own placeholder for staged publishing. The first real release, 0.1.0, is the first one from the workflow, with provenance.

### 3. Trusted publisher

On npmjs.com, open **social-embeds → Settings → Trusted Publisher → GitHub Actions** and enter, exactly (the fields are case-sensitive):

| Field                | Value           |
| -------------------- | --------------- |
| Organization or user | `amitrev`       |
| Repository           | `social-embeds` |
| Workflow filename    | `release.yml`   |
| Environment name     | `npm`           |

Under **Allowed actions**, leave **`npm publish`** unticked: the workflow only stages, and `npm stage publish` is always allowed. npm itself marks direct publishing as not recommended.

Or from the command line, with npm 11.15.0 or later:

```sh
npx npm@latest trust github social-embeds --repo amitrev/social-embeds --file release.yml --env npm --allow-stage-publish
```

A new trusted publisher expires unless it is used successfully within 2 days, so do step 5 within that time.

### 4. Disallow tokens

**social-embeds → Settings → Publishing access:** select "Require two-factor authentication and disallow tokens" and save. This does not affect trusted publishing.

### 5. First release

Merge the "Version Packages" pull request for 0.1.0 and [approve the staged version](#approving-a-release). Then check that:

- the npm page of `social-embeds@0.1.0` shows a provenance badge linking to the workflow run, or `npm view social-embeds@0.1.0 dist.attestations` lists it;
- `latest` is 0.1.0 (`npm view social-embeds dist-tags`).

Then retire the placeholders and the local login:

```sh
npm deprecate social-embeds@0.0.0 "Placeholder, not a release. Install 0.1.0 or later."
```

```sh
npm deprecate social-embeds@0.0.0-stage "Placeholder, not a release. Install 0.1.0 or later."
```

```sh
npm logout
```

## When the stage job fails

- **401, 403 or `ENEEDAUTH`:** the trusted publisher does not match the run. Check the four fields above against the repository owner, its name, the workflow file name and the job's `environment`, then re-run the failed job.
- **The trusted publisher expired** (not used within 2 days): delete it on npmjs.com, add it again, and re-run the failed workflow.
- **Staged, but the tag or draft release step failed:** the version is staged on npm, but without the tag the next push would try to stage it again. Re-running the job would fail, because the version is already staged. Create both by hand instead, with the release commit's SHA:

  ```sh
  gh api repos/amitrev/social-embeds/git/refs -f ref=refs/tags/v<version> -f sha=<commit>
  ```

  ```sh
  gh release create v<version> --repo amitrev/social-embeds --draft --verify-tag --title v<version>
  ```

- **No "Version Packages" pull request:** check the Actions setting in step 1.
