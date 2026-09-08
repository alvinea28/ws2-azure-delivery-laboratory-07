# Plan review: bind one decision to one encrypted plan

> [!WARNING]
> **INSTRUCTOR ONLY — reference, not participant authorization.** This page
> describes a future authorized private-copy run. **All live operations remain
> unexecuted and blocked during authoring.** Keep `WORKSHOP_AZURE_ENABLED=false`
> until the instructor's approved readiness decision. Do not ask Copilot to run
> delivery, read state, decrypt a plan, or approve an environment.

**Start:** [start-here.md](start-here.md) · **Help:** [troubleshooting.md](troubleshooting.md)
**Prerequisites:** [instructor-preflight.md](instructor-preflight.md) · **Recovery:** [recovery.md](recovery.md)

## 1. Understand the five operations before opening Run workflow

The public template
[alvinea28/ws2-azure-delivery-laboratory-07](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07)
is inert. Only an instructor-approved **PRIVATE copy** can host live delivery.
The shipped workflow is **Trusted dev delivery (instructor enablement required)**.

| Event / operation | Exact job path after **Verify instructor gate configuration** | Meaning |
| --- | --- | --- |
| Manual `plan` | **Trusted dev plan** | Produce a reviewable encrypted plan; never apply it in this run |
| Manual `deploy`, or enabled push to `main` | **Trusted dev plan → Apply reviewed dev plan** | New deployment plan, independent `dev-apply` review, exact saved-plan apply |
| Manual `followup` | **Trusted dev plan → Confirm no-change** | Separately requested fresh observation; only exit 0 passes confirmation |
| Manual `destroy` | **Trusted dev plan → Destroy reviewed dev plan** | New destroy plan and separate independent cleanup approval |
| Manual `drift`, or schedule | **Trusted dev plan → Report drift without applying**, when exit 2 | Report changes through a drift issue; never remediate automatically |

The schedule is Tuesday **02:17 UTC** and maps to `drift`; GitHub schedules use
the default branch, so the approved private copy must have protected `main` as
default. A push maps to `deploy`. Manual dispatch defaults to `plan`.
Neither a dispatch click, a successful PR check, nor AgentAlvine progress is approval.

## 2. Find the exact run in GitHub

![GitHub reference showing the Actions navigation tab](images/github-actions.webp)

*REFERENCE — GitHub navigation example, CC BY 4.0; not a live run or Azure result.
[images/NOTICE.md](images/NOTICE.md).*

1. In the **private copy**, select **Actions** in the repository navigation.
2. Select **Trusted dev delivery (instructor enablement required)** in the workflow sidebar.
3. During the separately authorized live window only, the instructor selects **Run workflow**.
4. Select **Branch: main**, check the exact operation, and confirm the requested action with the authorized humans before dispatch.
5. Open the newly created run; compare its commit, event, operation, and attempt with the intended request.
6. Open **Verify instructor gate configuration**, then **Trusted dev plan**; stop at any failed prerequisite.
7. Return to the run **Summary** for the sanitized plan inventory and trusted plan/manifest digests.

![GitHub reference showing the workflow-selection sidebar](images/github-workflow-sidebar.webp)

*REFERENCE — the publisher selects CodeQL; choose the delivery workflow named
above, not CodeQL or New workflow. CC BY 4.0; [images/NOTICE.md](images/NOTICE.md).
This is a navigation example, not configured Azure infrastructure.*

## 3. Interpret Terraform's detailed plan result correctly

| Detailed exit code | Interpretation | Required response |
| --- | --- | --- |
| **0** | Successful plan with no changes | Eligible for **Confirm no-change** only in a separate `followup` run |
| **2** | Successful plan with changes | Review actual changes; not an execution error and not no-change |
| **1** | Planning failed | Stop; no usable plan may proceed to apply/destroy |
| Signal, missing, or unexpected result | Execution did not satisfy the contract | Stop and diagnose; never coerce it into 0 or 2 |

Output-only changes can produce exit 2 even when no managed-resource rows change.
For `followup`, exit 2 fails **Confirm no-change** and leaves acceptance open.
For `drift`, exit 2 triggers **Report drift without applying**; exit 0 skips that
report job. A planning error is neither an empty drift report nor successful cleanup.

## 4. Review the encrypted artifact on an approved human workstation

Saved plans include state snapshots. The workflow uploads only **plan.enc**, not
the plaintext plan or manifest. Encryption is **AES-256-GCM** with a random data
key wrapped by **RSA-OAEP/SHA-256**, using RSA **3072 bits or stronger**.
Ciphertext may be readable by private-repository readers or a PR-controlled
workflow; privacy alone is not the protection. PR workflows must never obtain
the private key or download plaintext plans, raw JSON, or state.

1. The independent reviewer confirms authorization, a restricted workstation, filesystem ACLs, and the pinned toolchain; do not use an ordinary learner/PR workspace or Copilot chat.
2. On this exact run's **Summary → Artifacts**, select the artifact whose name matches the run ID and attempt shown by **Trusted dev plan**.
3. Download only that encrypted archive through the approved private channel; reject a differently sourced or renamed artifact.
4. Extract its encrypted payload into the dedicated review checkout at the first path below. Do not commit any review material.

```text
.workshop/sealed/plan.enc          downloaded ciphertext
.workshop/private/reviewed.tfplan  plaintext created by the open helper
.workshop/private/manifest.json   plaintext created by the open helper
```

5. The authorized reviewer sets `PLAN_KEY_PATH` to the securely escrowed private-key **file path**, never to key text. In PowerShell this is the `$env:PLAN_KEY_PATH` process variable; do not put PEM material in commands or chat.
6. Using the trusted [../scripts/plan-envelope.mjs](../scripts/plan-envelope.mjs) helper, the human opens the envelope with `node scripts/plan-envelope.mjs open` in that restricted checkout.
7. Compute SHA-256 of the decrypted **binary plan** and **manifest bytes** using the approved local hashing UI/tool, and compare both with this run's trusted summary. Do not compare an envelope/archive hash to a plan hash.
8. Use the instructor-prepared Terraform **1.16.1** / AzureRM **5.4.0** local saved-plan inspection environment to examine properties and outputs; this is human review, not a new Azure plan or a state pull.
9. Compare the identities, scope, module revision, inputs, timestamps, and actions below. If any proof is missing, reject rather than approve from a summary alone.
10. Remove decrypted review files and downloads according to the approved workstation retention process. Keep only a sanitized private decision record; escrow custody follows instructor policy.

If inspection lacks provider schemas or tool support, stop and ask the instructor
to prepare the approved local review environment. Do not initialize the real backend
or retrieve state to make saved-plan inspection work.

`PLAN_DECRYPTION_PRIVATE_KEY` is an Actions secret in **dev-apply only**; the
other authorized copy is human reviewer escrow. Planning receives only the public
key. Neither the reviewer procedure nor the key-generation helper was executed
during this documentation task. Artifact retention is **1 day**; plan validity
is **2 hours**, checked after the approval wait and again before mutation.

## 5. Verify the binding, not merely a matching filename

| Bound value / independent control | Required comparison before apply or destroy |
| --- | --- |
| Repository, commit, run ID, attempt, operation | This private copy, exact reviewed `main` SHA, current run, attempt **1**, correct deploy/destroy intent |
| Root and environment | Canonical dev root and environment, never another root, path, or workspace |
| Tenant, subscription, RG, plan/apply clients | Approved sandbox tuple and two distinct principals |
| Backend | Exact account **and** container **and** key; a matching key alone is insufficient |
| Module-lock digest | Same repository/revision/subdirectory/source/file hashes; actual installed source verified against the snapshot |
| Provider-lock and inputs digests | Same committed lock and approved serialized workload inputs used for planning |
| Toolchain | Terraform **1.16.1**, AzureRM **5.4.0**; workflow provides the intended Linux x64 execution platform |
| Plan and manifest SHA-256 | Actual bytes match the independent trusted plan-job outputs and each other |
| Creation time | Valid, not future-dated, and no more than **2 hours** old at consumption |
| Current protected `main` | Still the planned commit after approval and again after initialization, immediately before mutation |
| Workflow and artifact source | Selected-workflow runner policy and same-run workflow dependency; not arbitrary caller-supplied artifacts |
| State continuity | Terraform's own saved-plan stale-state checks and Blob locking remain active |

The manifest serializes the configuration tuple plus toolchain/lock/input digests.
Workflow-path and platform restrictions are enforced by trusted workflow/settings,
not separate manifest fields. The expected digests come from this run's trusted
plan job, not a learner-edited manifest. If `main`, inputs, source, locks, or state
change, stop and create a fresh plan with fresh review; no implicit replanning.

## 6. Approve only after property-level human review

The scope is network workload only: VNet, named subnets, NSG, rules, and subnet
associations. Read actual additions, updates, replacements, deletes, and outputs;
do not copy expected counts from mocked tests. Review unexpected CIDRs, ingress,
lost associations, replacements, and any shared-resource action as stop conditions.

1. The eligible nonauthor reviewer returns to the **same run → Review deployments**.
2. Select the pending `dev-apply` deployment only after inspecting that run's plan.
3. Confirm **Required reviewers**, **Prevent self-review**, no admin bypass, and the main-only branch rule remain effective.
4. Confirm the approver is neither an associated merged-PR author nor the run actor/triggering actor; a bot or issue comment is not an approval.
5. Approve or reject with a sanitized rationale. Missing independence means stop and arrange another eligible human.

After the gate, the job **Confirm current main and independently approved run**
checks actual approval history and the merged-main PR association. Apply/destroy
then decrypts, verifies bindings, initializes with the proper identity, checks
installed source, rechecks current `main`/age/digests, and applies the **same binary**.
It must not generate a replacement plan. See [delivery-configuration.md](delivery-configuration.md)
for settings and [identity-state.md](identity-state.md) for scope.

## 7. Verify results without declaring premature completion

| Result | Required next observation |
| --- | --- |
| **Apply reviewed dev plan** succeeded | Its output-ID checks cover intended workload scope/topology; instructor confirms inventory privately |
| Deployment finished | Request a **new**, separate `followup`; prior plan exit 0 is not this observation |
| **Confirm no-change** succeeded | Fresh follow-up plan reported exit 0; no mutation is authorized by that result |
| Cleanup requested | New `destroy` run, new destroy plan, separate independent `dev-apply` approval |
| **Destroy reviewed dev plan** succeeded | Workflow confirms no managed addresses in workload state; instructor still confirms final inventory and retained owners |

Retain the shared RG, backend/container, identities, roles, and runner. Never
delete state as cleanup. Failed, stale, moved-main, wrong-attempt, or uncertain
runs need [recovery.md](recovery.md); **never rerun credentialled jobs**.

## Source attribution

Original explanation grounded in [../.github/workflows/delivery.yml](../.github/workflows/delivery.yml),
[../scripts/plan-policy.mjs](../scripts/plan-policy.mjs), [../scripts/delivery.mjs](../scripts/delivery.mjs),
[../scripts/approval.cjs](../scripts/approval.cjs), and [../scripts/plan-envelope.mjs](../scripts/plan-envelope.mjs).
Image provenance/license: [images/NOTICE.md](images/NOTICE.md) and [images/manifest.json](images/manifest.json).
GitHub's source page for two reference images discusses reruns; **its rerun action
is not permitted for this lab's credentialled delivery workflow**.
