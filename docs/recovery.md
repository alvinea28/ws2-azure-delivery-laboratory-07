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
run → Summary: compare event/operation/SHA/attempt/status; [job map](plan-review.md#1-understand-the-five-operations-before-opening-run-workflow).
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
| Pin/subdirectory/App token | Fetch | Contents-read; public still requires App |
| Source/lock/eight-file Git objects | Snapshot | Coherent reviewed refresh; no invented hashes |
| OIDC issuer/audience/subject/context | Trust | Exact mapping; no wildcards/JWT logs/secret fallback |
| Distinct principals/RG/direct+inherited roles | Workload denial | RG Reader/Contributor for plan/apply; no subscription rights |
| Entra/team-container/both Blob Data Contributor grants | Backend | Scoped correction; no key/SAS fallback |
| Runner resolver/private DNS/endpoint | Connectivity | Private path; never expose storage |
| Routes/firewall/endpoint/TLS trust | Timeout | No certificate bypass |
| Writer/process/state/other copies | Lease | Coordinate; no unlock/break/disabled locking |
| Same-run/both digests/bindings/age/main | Plan | Fresh plan/review; no artifact substitution/extended validity |
| Eligible human/history/merged-main PR | Approval | Independent; no self-review/admin/comment substitute |
| Operations/backend consistency | Partial mutation | Instructor; no blind replay/import/state edits |
| Properties/outputs | Followup/drift exit 2 | Explain; drift reports, neither applies |

403/timeout alone identify no cause.

## 5. Handle stale plans and partial mutations differently

**Before mutation:** reviewed correction → **new trusted run/plan/review**. Encrypted
artifact **1 day** ≠ plan validity **2 hours**. Moved main/expiry invalidates approval;
apply **exact saved plan**, no implicit replan.

**Possible mutation:** instructor proves stopped writers/consistent backend before
new plan/independent approval. Git rollback cannot establish Azure state.

No local real plan/apply/destroy, state pull/show/download, workspace shortcuts,
manual Blob edits/disabled locks, or tokens/keys/plaintext plans in chat.

## 6. Escalate locks; do not teach a force-unlock shortcut

**No force-unlock shortcut.** Exceptional orphan-lock/backend-version recovery needs
explicit incident authorization, all-writers-stopped proof and exact private lock/state
identification. Owner privately records rationale/outcome; restored state changes
tracking. Then fresh plan/property review/independent approval.

## 7. Correct code through the reviewed Git route

[Git route](git-workflow.md): task branch → diff/checks → instructor/nonauthor review
→ protected `main`. Preserve tests/source/lock/vendor/provider/controls; Copilot sees
sanitized source only.

[New run/independent review](plan-review.md), never **Re-run failed jobs / Re-run all jobs**:
credentialled attempt **1 only**. Solo Labs 01/05 never relax live approval.

## 8. Close only what was actually verified

| Do | Why | Expected |
| --- | --- | --- |
| Check repaired revision | Offline proof | Executed positive/rejection passes, not cloud proof |
| Verify new successful apply/instructor inventory | Deployment | Separate `followup`: exit 0 **and Confirm no-change** success |
| Record drift cause/impact/owner/decision | Ownership | No automatic fix |
| New independently approved full destroy, same root/state | Cleanup | Plan/destroy success, empty managed state **and** final private inventory |

**Full workload cleanup mandatory before live completion; no targets/state deletion.**
Retain shared RG/backend account/container/identities/roles/runner with owners.
Failed/skipped/uncertain deletion/health stays open; progress ≠ acceptance.

## Source attribution

[Delivery](../scripts/delivery.mjs), [approval](../scripts/approval.cjs), [policy](../scripts/plan-policy.mjs),
[workflow](../.github/workflows/delivery.yml), [settings](delivery-configuration.md),
[roles](identity-state.md), [images](images/NOTICE.md); no publisher rerun exception.
