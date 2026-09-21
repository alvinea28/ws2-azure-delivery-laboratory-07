# Dependency snapshot: one standalone module, one coherent pin

> [!WARNING]
> **INSTRUCTOR/MAINTAINER.** `WORKSHOP_AZURE_ENABLED=false`; no authoring
> refresh/Git/Azure/identity/state/subscription operations. Repins require review,
> never grant Azure authorization/release credit.

**Setup once:** [start-here.md](start-here.md) · **Help:** [troubleshooting.md](troubleshooting.md) · **Readiness:** [instructor-preflight.md](instructor-preflight.md)

## 1. This repository includes the module; no other laboratory is required

Standalone network/subnet-security [module](../module/) and [snapshot](../vendor/network-baseline/)
are supplied. [Consumer](../environments/dev/main.tf)/[lock](../module-lock.json) self-pin
[4414e56b409a46785590741adcc48abea29905d7](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07/commit/4414e56b409a46785590741adcc48abea29905d7),
subdirectory `module`—not the deployment SHA or learner release.

## 2. Keep the records distinct and consistent

Source/HCL SHA-256 provenance ≠ [provider locking](../environments/dev/.terraform.lock.hcl).
Keep Windows/Linux hashes. Git needs immutable `?ref=`, not registry `version`.

## 3. What the offline learner command actually does

After [setup](start-here.md), clone root → **Terminal → New Terminal**:

```powershell
node scripts/check-learner.mjs
```

**Why:** `node` runs the [checker](../scripts/check-learner.mjs): [verify source/lock/vendor](../scripts/prepare-offline.mjs),
prepare disposable root, fmt/init/validate/mock-only plans. Internal flags:
`-backend=false` excludes backend; `-lockfile=readonly` preserves provider lock;
`-input=false` forbids prompts.

**Expected:** `consumer_preserves_named_topology`/`reject_bad_consumer_cidr` executed/passing;
zero/skipped/errors fail. Downloads may need internet, not Azure/App credentials/state.
Unexpected roots, symlinks, HCL/hash mismatch or login: **stop**, never real-root init.

## 4. Publish the source before trying to pin it

Supplied eight-file pin needs no refresh. Future maintenance: publish reviewed
source first; pin later—its own commit SHA is unknowable beforehand.

## 5. Preview the approved repin; write only after review

**Future authorized maintenance**, Lab 07 clone root; replace path/SHA placeholders:

```powershell
node scripts/refresh-snapshot.mjs --checkout "APPROVED-CHECKOUT-PATH" --repository alvinea28/ws2-azure-delivery-laboratory-07 --revision ACTUAL40SHA --subdirectory module
```

**Why:** `node` runs the [helper](../scripts/refresh-snapshot.mjs): checks Git objects,
prints **preview** metadata, no writes.

| Do (argument) | Why | Expected |
| --- | --- | --- |
| `--checkout` | Locate source | Quoted approved path, preserving spaces |
| `--repository` | Origin | Exact credential-free GitHub identity |
| `--revision` | Pin | Published 40-character lowercase hexadecimal SHA = HEAD |
| `--subdirectory module` | Export | Module plus relative child |
| Append `--write` after preview approval | Replace explicitly | Same command updates vendor/consumer/lock |

**Not crash-atomic**; interrupted output cannot deploy.

## 6. Git objects are the provenance authority

Checks HEAD/origin/tracked cleanliness/membership; compares complete working HCL
inventory/normalized bytes against **Git objects**. Hashes: **UTF-8, CRLF → LF;
EOF preserved**. Status/labels alone prove nothing.

[Three regressions](../tests-node/refresh-snapshot.test.mjs): committed export, hidden
edits, untracked HCL. [Installed/vendor checks](../scripts/module-snapshot.mjs) reject
inventory/hash mismatch, missing children, symlinks/escapes.

## 7. Review the coordinated diff in VS Code and GitHub

| Do | Why | Expected |
| --- | --- | --- |
| Source Control → Open Changes | Coherence | Source/revision/subdirectory/inventory/hashes/vendor together; relative children; backend/provider unchanged |
| Section 3/rejection checks | Execution | Passing cases, no zeros/skips |
| PR → Files changed / Checks | Author inspection, strict checks and resolved conversations; [zero source-PR approvals](pr-author-merge.md) | Live protected `main`; independent environment approval remains; template maintenance `dev` |

![GitHub reference: Files changed tab](images/github-pr-files.webp)

*Unmodified GitHub reference, not approval. [CC BY 4.0](images/NOTICE.md).*

## 8. Public source does not mean the live transport changed

Live [init](../scripts/delivery.mjs) still **requires `MODULE_READ_TOKEN`**: [workflow](../.github/workflows/delivery.yml)
issues short-lived App **Contents-read only**, pinned-repository token, never passed
to ordinary plan/apply subprocesses or PRs. Vendor/anonymous cloning cannot replace transport.

Custodian: **Settings → Developer settings → GitHub Apps → approved App → Permissions
& events → Repository permissions → Contents: Read-only**. Source owner: **Settings
→ Applications → Installed GitHub Apps → Configure** → this source only.

Missing access: owner escalation, not broader grants. **PRIVATE writer**/[key scopes](delivery-configuration.md)
remain; transport changes need reviewed code/tests.

## 9. Recovery and source attribution

Inspect mismatch; restore coherent approved source/lock/vendor or authorized refresh.
Verify/review → **new trusted plan**; no invented hashes/readonly bypass. Rollback
cannot restore state/reverse resources.

Baseline: Terraform **1.16.1** / AzureRM **5.4.0**. Lab 02 AVM: **AzureRM 4.81.0**,
separate root/lock/state; **not connected live, no AVM deployment claimed**.
No silent downgrade/shared ownership.

[Recovery](recovery.md) · [Plan review](plan-review.md) · Sources above;
images [notice](images/NOTICE.md)/[manifest](images/manifest.json).
