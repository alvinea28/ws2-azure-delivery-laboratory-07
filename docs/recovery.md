# Recovery: stop safely, diagnose narrowly, start a new run

> [!WARNING]
> **INSTRUCTOR ONLY.** `WORKSHOP_AZURE_ENABLED=false` until [preflight](instructor-preflight.md).
> No authoring Azure/identity/state/subscription operations/recovery. Failure,
> Copilot and AgentAlvine never authorize bypasses.

**Setup once:** [start-here.md](start-here.md) · **Local help:** [troubleshooting.md](troubleshooting.md) · **Own account inputs:** [azure-setup.md](azure-setup.md)

## 1. Decide whether this is offline setup or an actual live incident

**Evidence before changes.** Templates inert; live recovery: approved **PRIVATE
single writer**, protected `main`.

| Do | Why | Expected |
| --- | --- | --- |
| Setup/snapshot | Offline | [Help](troubleshooting.md)/[dependencies](dependency-snapshot.md), no state/backend |
| Gates/runner | Authorization | Missing [settings](delivery-configuration.md): blocked |
| Live failure/stall | Evidence | Writer safety first |

## 2. Find the failing job without publishing sensitive logs

Private **Actions → Trusted dev delivery (instructor enablement required)** → exact
run → Summary: compare event/operation/SHA/attempt/status; [job map](plan-review.md#1-understand-events-and-operations).
For cleanup use **Trusted dev cleanup (explicit owner authorization required)**,
not the delivery menu. Neither path is enabled by this recovery guide.
Missing summary ≠ no mutation.

![GitHub reference: Actions tab](images/github-actions.webp)

*Unmodified GitHub reference, not recovery proof. [CC BY 4.0](images/NOTICE.md).*

Keep sanitized error/code/module revision/job metadata **privately**. No published
author/account IDs, backend values, private links, raw logs/JSON/state/secrets/screenshots.

## 3. Establish writer status before changing anything

Instructor verifies Actions **and actual runner processes**, exact account/container/key,
lease owners. Preserve `WS2_STATE_LOCK_ID`, `cancel-in-progress: false`, Blob leases,
restricted **exact-workflow** runners. Unknown consistency: pause dispatches/escalate;
never cancel active mutation. Time/UI disconnect proves nothing. Flag ≠ kill switch;
repository concurrency cannot exclude other copies.

## 4. Diagnose at the failed boundary

| Do: inspect evidence | Why | Expected / prohibition |
| --- | --- | --- |
| Hosted validation/reference/inventory | Before credentials | Repair the reviewed source; run the [offline checker](workflow-authoring.md#3-check-the-constructed-code-locally-then-through-credential-free-ci); never skip validation or add a second writer |
| Pin/subdirectory/App token | Fetch | Contents-read; public still requires App |
| Source/lock/eight-file Git objects | Snapshot | Coherent reviewed refresh; no invented hashes |
| OIDC issuer/audience/subject/context | Trust | Exact mapping; no wildcards/JWT logs/secret fallback |
| Distinct principals/RG/direct+inherited roles | Workload denial | RG Reader/Contributor for plan/apply; no subscription rights |
| Entra/team-container/both Blob Data Contributor grants | Backend | Scoped correction; no key/SAS fallback |
| Runner resolver/private DNS/endpoint | Connectivity | Private path; never expose storage |
| Routes/firewall/endpoint/TLS trust | Timeout | No certificate bypass |
| Writer/process/state/other copies | Lease | Coordinate; no unlock/break/disabled locking |
| Same-run/both digests/bindings/age/main | Plan | Fresh authorized plan; no artifact substitution/extended validity |
| Exact private ID/name, live rules, current main/run/SHA/attempt, merged PR, same-run jobs and environments | Scoped authorization | No Required reviewers or admin bypass; no issue/comment substitute |
| Operations/backend consistency | Partial mutation | Instructor; no blind replay/import/state edits |
| Properties/outputs | Followup/drift exit 2 | Explain; drift reports, neither applies |

403/timeout alone identify no cause.

## 5. Handle stale plans and partial mutations differently

**Before mutation:** reviewed correction → **new authorized run/exact plan**. Encrypted
artifact **1 day** ≠ plan validity **2 hours**. Moved main/expiry invalidates the saved plan;
apply **exact saved plan**, no implicit replan.

**Possible mutation:** instructor proves stopped writers/consistent backend before
new authorized run/plan. Git rollback cannot establish Azure state.

No local real plan/apply/destroy, state pull/show/download, workspace shortcuts,
manual Blob edits/disabled locks, or tokens/keys/plaintext plans in chat.

## 6. Escalate locks; do not teach a force-unlock shortcut

**No force-unlock shortcut.** Exceptional orphan-lock/backend-version recovery needs
explicit incident authorization, all-writers-stopped proof and exact private lock/state
identification. Owner privately records rationale/outcome; restored state changes
tracking. Then a fresh authorized run with property validation and exact-plan application.

## 7. Correct code through the reviewed Git route

[Git route](git-workflow.md): task branch → author inspection/current checks/resolved
conversations → [author-merged PR](pr-author-merge.md) → protected `main`. Zero PR
approvals is not self-approval; no manual deployment reviewer is required in this
exact private route. Missing main/readiness means offline handoff, not inventing a branch.
Preserve tests/source/lock/vendor/provider/controls; Copilot sees
sanitized source only.

[New authorized run/exact plan](plan-review.md), never **Re-run failed jobs / Re-run all jobs**:
credentialled attempt **1 only**. Scope, budget, lifetime and bootstrap authorization
remain separate from educational progress.

A separately authorized reviewed **main push** creates the fresh deploy run; do not
dispatch another deploy or invent a fake change just to trigger it. Delivery's manual
menu offers followup only. Cleanup retries require the current authenticated repo
admin's separate owned-scope authorization and a fresh dispatch of [cleanup.yml](../.github/workflows/cleanup.yml),
required string `authorization` = `destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>`,
no operation input or independent cleanup reviewer. Admin/actor/sender/trigger IDs,
current SHA/state and same-run validation/exact destroy plan are checked. If there is no approved recovery
change/run path, remain blocked with the instructor rather than bypassing freshness.

## 8. Close only what was actually verified

| Do | Why | Expected |
| --- | --- | --- |
| Check repaired revision | Offline proof | Executed positive/rejection passes, not cloud proof |
| Verify new successful apply/instructor inventory | Deployment | Separate `followup`: exit 0 **and Confirm no-change** success |
| Record drift cause/impact/owner/decision | Ownership | No automatic fix |
| New separately owner-authorized full cleanup, same root/state | Cleanup | Plan/destroy success, empty managed state **and** final private inventory |

**Full workload cleanup mandatory before live completion; no targets/state deletion.**
Retain shared RG/backend account/container/identities/roles/runner with owners.
Cleanup keeps delivery's state/concurrency/environments/identities; ordinary main
never cleans up and destroy/replacements on regular pushes fail.
Failed/skipped/uncertain deletion/health stays open; progress ≠ acceptance.

## Source attribution

[Delivery](../scripts/delivery.mjs), [approval](../scripts/approval.cjs), [policy](../scripts/plan-policy.mjs),
[workflow](../.github/workflows/delivery.yml), [settings](delivery-configuration.md),
[roles](identity-state.md), [images](images/NOTICE.md); no publisher rerun exception.
