# ExpoFP fork of `camera-controls`

This is ExpoFP's fork of [yomotsu/camera-controls](https://github.com/yomotsu/camera-controls).
It exists so we can carry our own changes, contribute cleanly back upstream, and
consume the package as a git dependency in internal TypeScript projects.

## Branch model

| Branch | Role | Rule |
|---|---|---|
| `dev` | Pristine mirror of `upstream/dev`. Base for upstream PRs and the source we sync from. | **Never commit here.** Fast-forward to upstream only. |
| `expofp` | Integration trunk — upstream + our merged changes. Releases are cut from here. | Our default branch. Source-only (no `dist/`). |
| `feat/<name>` | One focused change destined for an upstream PR. | Branch from **`dev`** (kept fast-forwarded to `upstream/dev`) so the PR diff is only that change. |
| `fork/<name>` | Permanent ExpoFP-only change (never goes upstream). | Branch **from `expofp`**. |

`git push upstream` is disabled locally (`git remote set-url --push upstream DISABLED`);
PRs to upstream go through `gh --repo yomotsu/camera-controls`.

## Consuming the fork

Pin an immutable release tag:

```json
"dependencies": {
  "camera-controls": "github:expofp/camera-controls#v3.1.3-expofp.1"
}
```

The tag's commit contains a prebuilt `dist/`, so `npm install` neither rebuilds nor
pulls devDependencies. `npm` records the resolved commit in your lockfile, so installs
are reproducible until you deliberately bump the pin.

## Releases (automated)

Every push to `expofp` triggers `.github/workflows/release.yml`, which:

1. runs `lint` + `build` as a gate (a broken merge produces **no** tag),
2. computes the next tag `v<upstream-base>-expofp.<N>`, where `<upstream-base>` is the
   nearest upstream release tag reachable from `expofp` and `<N>` auto-increments per base,
3. commits the built `dist/` and pushes it **as a tag only** — the `expofp` branch stays
   source-only — then opens a GitHub Release.

The version base resets automatically when you sync a newer upstream (e.g. `v3.1.3-expofp.4`
→ after syncing upstream `v3.2.0` → `v3.2.0-expofp.1`).

## Common operations

These are wrapped by repo skills in `.claude/skills/` (`fork-feature`, `fork-sync`,
`fork-status`). The underlying commands:

```bash
# Start an upstream-bound change (sync the pristine mirror first)
git fetch upstream --tags
git checkout dev && git merge --ff-only upstream/dev && git push origin dev
git checkout -b feat/my-change

# Start a fork-only change
git checkout -b fork/my-change expofp

# Sync from upstream
git fetch upstream --tags
git checkout dev && git merge --ff-only upstream/dev && git push origin dev
git checkout expofp && git merge dev        # resolve conflicts by hand; then push to release
git push origin expofp
```
