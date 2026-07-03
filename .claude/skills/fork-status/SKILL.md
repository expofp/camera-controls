---
name: fork-status
description: Use when you want a read-only snapshot of the ExpoFP camera-controls fork — how far expofp is ahead of dev, whether dev is behind upstream, the current release version base, and which feat branches have already landed upstream.
---

# fork-status

## Overview

Read-only report on where the fork stands relative to upstream and its releases. Runs no
mutations — safe to invoke any time.

## When to use

- Before a sync or release, to see what's pending.
- To find `feat/*` branches that have landed upstream and can be dropped.

## Commands

```bash
# Refresh refs (read-only)
git fetch upstream --tags -q
git fetch origin --tags -q

# dev behind upstream? (commits to sync)
echo "dev is $(git rev-list --count origin/dev..upstream/dev) commits behind upstream/dev"

# expofp vs dev  (left = dev-only, right = expofp-only i.e. our patches + merges)
git rev-list --left-right --count origin/dev...origin/expofp

# Current release version base (nearest upstream tag reachable from expofp)
git describe --tags --abbrev=0 --match 'v[0-9]*' --exclude '*-expofp*' origin/expofp

# Latest release tag actually cut
git tag -l 'v*-expofp.*' | sort -V | tail -1
```

## Which feat branches have landed upstream

For each `feat/*` branch, `git cherry` shows whether its commits already exist upstream
(lines starting with `-` are already upstream and the branch can be retired):

```bash
for b in $(git branch --list 'feat/*' --format '%(refname:short)'); do
  echo "== $b =="
  git cherry -v upstream/dev "$b"
done
```

- `+ <sha> msg` → not yet upstream (PR still pending).
- `- <sha> msg` → already upstream; safe to delete the branch after the next `fork-sync`.

## Notes

- Purely informational; make no commits or pushes from this skill. It fetches
  remote-tracking refs only — it does **not** fast-forward the local `dev` mirror. If it
  reports `dev` behind upstream, run `fork-sync` (or `fork-feature`, which syncs first).
- Pair with `fork-sync` to act on what it reports.
