---
name: fork-sync
description: Use when pulling new upstream changes into the ExpoFP camera-controls fork — fast-forwarding the pristine dev mirror and merging upstream into the expofp trunk, stopping for the human on any conflict.
---

# fork-sync

## Overview

Sync upstream into the fork in two moves: keep `dev` a **pristine fast-forward mirror** of
`upstream/dev`, then **merge `dev` into `expofp`**. Conflicts only ever surface at the
second step, against our `fork/*` patches.

**Never auto-resolve a conflict.** Do not use `-X ours`/`-X theirs`, do not guess. On any
conflict, stop and hand the working tree to the human — the whole point of isolating the
merge here is that a person adjudicates our patches against upstream.

## When to use

- Upstream has new commits you want in the fork.
- Before cutting a release that should include upstream fixes.

## Steps

1. **Fetch upstream** (tags included — the release version base is derived from them):
   ```bash
   git fetch upstream --tags
   ```

2. **Fast-forward the pristine mirror.** `--ff-only` fails loudly if `dev` was ever
   committed to directly (it must never be):
   ```bash
   git checkout dev
   git merge --ff-only upstream/dev
   git push origin dev
   ```
   If this fails: `dev` is contaminated. Stop and report — do not force it.

3. **Merge into the trunk.** A plain merge stops on conflict by default; that is intended:
   ```bash
   git checkout expofp
   git merge dev
   ```
   - **Clean merge** → continue to step 4.
   - **Conflict** → STOP. Leave the working tree as-is and hand it to the human with the
     conflicted paths (`git diff --name-only --diff-filter=U`). Do not resolve it yourself.

4. **Release.** Pushing `expofp` triggers CI, which cuts a new tag whose version base now
   reflects the newer upstream:
   ```bash
   git push origin expofp
   ```

## Red flags — STOP

- About to type `-X ours`, `-X theirs`, or `-s ours` → don't. Hand off instead.
- `merge --ff-only` on `dev` failed → `dev` is no longer pristine; report, don't force.
- Tempted to `git checkout --theirs`/`--ours` on a conflicted file → hand off.

**Resolving conflicts against `fork/*` patches is a human judgment call, not an automation step.**

## Notes

- The version base and index are computed by CI from git history — nothing to bump here.
- `feat/*` changes already merged upstream de-duplicate automatically during step 3.
