# Dependency snapshot: one standalone module, one coherent pin

> [!WARNING]
> **INSTRUCTOR ONLY — reference, not participant authorization.** These are
> maintainer provenance requirements and future approved repin steps, not an
> instruction for Copilot to fetch private data, provision Azure, or read state.
> No refresh writes or live operations were performed during documentation authoring.
> Keep `WORKSHOP_AZURE_ENABLED=false`; live integration remains unexecuted/blocked.

**Start:** [start-here.md](start-here.md) · **Help:** [troubleshooting.md](troubleshooting.md)
**Readiness:** [instructor-preflight.md](instructor-preflight.md)

## 1. This repository includes the module; no other laboratory is required

The public template is
[alvinea28/ws2-azure-delivery-laboratory-07](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07).
Its complete [../module/](../module/) contains the network baseline and relative
subnet-security child module. [../vendor/network-baseline/](../vendor/network-baseline/)
is the verified offline copy supplied with the same lab. Participants do not need
to complete, publish, clone, or retain another laboratory to use the offline checks.

The intended canonical source has this structure, with a **real published** commit:

```text
git::https://github.com/alvinea28/ws2-azure-delivery-laboratory-07.git//module?ref=ACTUAL40SHA
```

`ACTUAL40SHA` is **not a valid pin**; the maintainer supplies the actual published
40-character lowercase hexadecimal commit. Never invent a digest or use a mutable
ref. The module revision differs from the private copy's deployment commit.

## 2. Keep the records distinct and consistent

| Record | Purpose | It does not provide |
| --- | --- | --- |
| [../module/](../module/) at the approved public commit | Complete authoritative source, including relative child-module paths | Participant release credit or Azure authorization |
| [../environments/dev/main.tf](../environments/dev/main.tf) | Exact Git repository, `module` subdirectory, and immutable revision | Git authentication or provider locking |
| [../module-lock.json](../module-lock.json) | Repository/revision/subdirectory/source and per-HCL-file SHA-256 inventory | Independent proof merely because metadata says verified |
| [../vendor/network-baseline/](../vendor/network-baseline/) | Approved normalized HCL bytes for credential-free consumer tests | A replacement live source chosen to evade retrieval checks |
| [../environments/dev/.terraform.lock.hcl](../environments/dev/.terraform.lock.hcl) | AzureRM **5.4.0** selection and verified provider package checksums | A Git module lock, state snapshot, or repository access grant |

Source, subdirectory, revision, inventory, hashes, and vendor bytes move **together
in one reviewed change**. Provider upgrades need separate justification. Git sources
use `?ref=`; the registry-only `version` argument is not a substitute.

## 3. What the offline learner command actually does

1. Open this private copy's clone in desktop VS Code; check **Explorer** and the terminal root.
2. Complete [toolchain.md](toolchain.md) and the local doctor before learner validation.
3. In **Terminal → New Terminal**, run the supplied consumer helper:

```powershell
node scripts/check-learner.mjs
```

For Lab 07, it calls [../scripts/prepare-offline.mjs](../scripts/prepare-offline.mjs),
which checks the canonical source against the lock and verifies the vendor file
inventory/hashes. Only a dedicated disposable root receives a local snapshot
source. The canonical dev backend is omitted, not initialized or rewritten.

The checker formats/checks, initializes with `-backend=false` and
`-lockfile=readonly`, validates, and runs provider-mocked **plan-only** tests.
The required cases are `consumer_preserves_named_topology` and
`reject_bad_consumer_cidr`. Zero/skipped/errored tests are not success.
Internet access may be needed for public provider downloads; “offline” here means
no Azure credentials, remote backend, state access, or private-module credential.

**Expected result:** actual consumer checks pass against the verified snapshot.
**Stop:** unexpected root configuration, symlinks, extra/missing HCL, changed hashes,
or a request for Azure login. Never initialize the canonical root to work around it.

## 4. Publish the source before trying to pin it

This is **initial authoring configuration**, not a learner release exercise.

1. The maintainer first reviews and publishes the complete module in this new public repository.
2. Record that actual commit privately/within the approved release process; it must already exist before a consumer source can point to it.
3. Obtain an approved local checkout of **that same repository** at the selected commit, with a credential-free `origin`.
4. Confirm its reviewed `module` subtree and required child files; do not point at the repository root or a different lab.
5. The later configuration commit refreshes source/lock/vendor to the earlier real module commit. Do not try to make a commit contain its own not-yet-known SHA.
6. Review and validate the configuration change before distributing a live-ready copy.

The initial authoring export is pinned to the real public module commit
[`4414e56b409a46785590741adcc48abea29905d7`](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07/commit/4414e56b409a46785590741adcc48abea29905d7)
in this repository's `module` subtree. All **eight** HCL files were compared to
that commit's Git objects; source, lock and vendor snapshot were generated
together and the two offline consumer cases passed. This is a supplied reference
checkpoint, not a participant release, human approval or Azure deployment.

## 5. Preview the approved repin; write only after review

These commands are for later authorized maintenance, **not executed during this
task**. From this Lab 07 clone's root, substitute the approved checkout path and
actual published SHA. Quote the checkout path if it contains spaces.

```powershell
node scripts/refresh-snapshot.mjs --checkout approvedcheckout --repository alvinea28/ws2-azure-delivery-laboratory-07 --revision ACTUAL40SHA --subdirectory module
```

Without `--write`, the helper prints proposed provenance metadata for inspection.
The origin must identify the new public repository without embedded credentials;
HEAD must equal the approved revision and tracked changes must be absent.
Reject unresolved placeholders, mismatched origin, untracked injected HCL,
symlink/path escapes, missing child files, or an unapproved source revision.

**Only after reviewing the exact Git-object provenance and intended source**,
the maintainer repeats the same arguments with the explicit write option:

```powershell
node scripts/refresh-snapshot.mjs --checkout approvedcheckout --repository alvinea28/ws2-azure-delivery-laboratory-07 --revision ACTUAL40SHA --subdirectory module --write
```

The write replaces vendor contents and updates the canonical source and module
lock. Treat the result as one indivisible review unit, **not** a crash-atomic
transaction: an interrupted refresh can leave inconsistent files. Do not deploy
that partial set. Restore the last approved set or repeat the authorized refresh,
then verify and review every changed file. Never hand-invent or patch digest fields.

## 6. Git objects are the provenance authority

Required acceptance is an engine comparison against the **actual Git objects**
at the approved revision/subdirectory, not just a 40-character string, a clean
status, or the current working-tree bytes. Normalize UTF-8 HCL from CRLF to LF
while preserving EOF, then derive the hashes from the verified content.

> [!IMPORTANT]
> **Verified export boundary:** [../scripts/refresh-snapshot.mjs](../scripts/refresh-snapshot.mjs)
> checks HEAD, origin, tracked cleanliness and membership, then compares the
> complete HCL inventory and normalized bytes against the actual approved Git
> tree/blob objects. Hashes are derived from those verified committed bytes,
> with EOF preserved. Hidden working-tree changes and untracked HCL are rejected
> by real temporary-Git regression tests in
> [../tests-node/refresh-snapshot.test.mjs](../tests-node/refresh-snapshot.test.mjs).
> [../scripts/module-snapshot.mjs](../scripts/module-snapshot.mjs) separately
> verifies the installed/vendored copy against that coherent manifest.

Review changed/extra/missing content, SHA/subdirectory mismatches, symlinks, hidden
working-tree alterations, and false provenance. Regenerating a manifest to match
tampered files is not approval; the commit and Git objects remain authoritative.

## 7. Review the coordinated diff in VS Code and GitHub

1. Open **Source Control** and each changed file with **Open Changes**.
2. Inspect the canonical source, module-lock repository/revision/subdirectory, complete hash inventory, and every vendored HCL diff together.
3. Confirm the child-module paths remain relative and the canonical backend/provider settings did not change.
4. Run the approved offline helper and relevant positive/rejection tests; retain actual results, not expected counts.
5. Push the intended configuration branch and request a nonauthor/instructor review into the private copy's protected `main` before live use.
6. In **Pull requests → the PR → Files changed**, compare that same set and current required checks. A source-template maintenance change publishes on `dev`, not an unreviewed live branch.

![GitHub reference highlighting a pull request's Files changed tab](images/github-pr-files.webp)

*REFERENCE — GitHub example, CC BY 4.0; not an approved repin, actual Azure
configuration, or participant release. [images/NOTICE.md](images/NOTICE.md).*

## 8. Public source does not mean the live transport changed

The baseline source is public and its supplied snapshot can be exercised offline.
However, [../.github/workflows/delivery.yml](../.github/workflows/delivery.yml)
still creates a short-lived GitHub App installation token, and
[../scripts/delivery.mjs](../scripts/delivery.mjs) still **requires** `MODULE_READ_TOKEN`
for initialization. The token is limited to the pinned repository's Contents-read
transport and is not provided to normal Terraform plan/apply subprocesses or PRs.

The App custodian checks **Settings → Developer settings → GitHub Apps → the
approved App → Permissions & events → Repository permissions → Contents: Read-only**.
Under the source owner's **Settings → Applications → Installed GitHub Apps →
Configure**, verify access is limited to this public source repository. Missing
installation access goes to its owner; do not create or broaden an App through Copilot.

Prove this unchanged App-read path in instructor preflight; an anonymous clone is
not proof. Key locations are in [delivery-configuration.md](delivery-configuration.md).
Replacing transport requires separate reviewed code/tests. Live delivery remains
in a **PRIVATE copy**, regardless of source visibility.

## 9. Recovery and source attribution

Keep Terraform **1.16.1**, AzureRM **5.4.0**, and the supplied Windows/Linux provider
hashes. Missing platform verification is a maintainer issue, not a reason to remove
readonly locking. Source rollback requires a coherent reviewed source/lock/vendor
set and a **new** trusted plan; it does not restore state or reverse resources.
See [recovery.md](recovery.md) and [plan-review.md](plan-review.md).

Original explanation grounded in [../scripts/refresh-snapshot.mjs](../scripts/refresh-snapshot.mjs) and [../scripts/module-snapshot.mjs](../scripts/module-snapshot.mjs),
with offline behavior from [../scripts/prepare-offline.mjs](../scripts/prepare-offline.mjs) and [../scripts/check-learner.mjs](../scripts/check-learner.mjs).
Image provenance: [images/NOTICE.md](images/NOTICE.md) and [images/manifest.json](images/manifest.json).
