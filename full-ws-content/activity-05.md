# Lab 07 · Activity 05 — Observe separately authorized cleanup and retain shared resources

[Review index](README.md) · [Previous activity](activity-04.md) · [Setup](00-start-here.md) · [Simulation evidence](simulation.md)

> [!NOTE]
> **Review copy, not a second progress tracker.** The complete canonical lesson follows. Learners follow the live **Exercise issue in their own private copy**, opened from that copy's README; AgentAlvine updates the same issue body. The public source preview awards no learner progress. This live activity remains blocked until genuine instructor prerequisites are met.

<!-- FULL-WS-LESSON:START -->
# Lab 07 · Step 5 — Observe separately authorized full cleanup

**Goal:** Remove the entire provisioned lab workload through its approved state, retaining shared infrastructure.

| Working context | Selection |
| --- | --- |
| Repository / branch | Same approved private single writer / current protected `main` |
| Files | No edits: preserve [environments/dev/main.tf](../environments/dev/main.tf) and [module-lock.json](../module-lock.json) |
| Workflow | [cleanup.yml](../.github/workflows/cleanup.yml): **Trusted dev cleanup (explicit owner authorization required)**; [non-runnable reference](../solutions/cleanup.yml) |
| Tools | Node **24.16.0**, Terraform **1.16.1**, AzureRM **5.4.0** |

> [!WARNING]
> **Public templates remain inert; no execution during authoring.** After an approved live exercise, **full cleanup is mandatory before moving on or declaring the live session complete**. Failed, skipped or uncertain cleanup stays open. No local real init/state/destroy, targeted deletion, broad RG deletion or Copilot cloud tools.

## Do

### 1. Confirm authorization and scope

After the applicable real deployment and fresh followup, an authenticated **current repository admin** must explicitly authorize owned-scope full cleanup and dispatch it. One authorized owner is sufficient; **no independent cleanup reviewer** is required. Reconfirm [all live prerequisites](activity-02.md): unchanged protected main, distinct identities, private backend/container leases, state concurrency, restricted allowed-workflow runner, main-only environments with no Required reviewers and no admin bypass. This is separate from bootstrap/budget authorization and never implied by an ordinary main push or Exercise progress.

Only private non-template **alvine-aurelio-org/ws2-sim-20260921-azure-delivery-laboratory-07**,
ID **1379149907**, is eligible. Consult [configuration status](../docs/delivery-configuration.md)
for expected controls or existing private observations; no new readiness or Azure
verification is claimed here. These are conditional instructions, not a request
to dispatch while unready, create main, repin the allowlist or invent values.

| Entire managed workload | Retained resources and ownership |
| --- | --- |
| Assigned VNet and named subnets, including deployed `app` | Existing/shared workload RG |
| NSG, explicit rules and subnet associations | Backend account/container, identities, runner/group and shared networks |

“Scoped” means **all managed resources in this approved root/state**, never `-target`. The dedicated workflow shares delivery's state, concurrency, environments and identities. It validates, creates/encrypts a fresh full-state destroy plan and applies exactly those bytes. Delivery's menu is **followup only**; ordinary main never cleans up and regular pushes reject destroy/replacements. No local `terraform destroy` substitute.

### 2. Choose ONE dispatch route

**Browser, using that authorized admin account:** approved private copy → **Actions → Trusted dev cleanup (explicit owner authorization required) → Run workflow → Branch: main**. Enter required **string** input **authorization** exactly as `destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>`, substituting the actual current full 40-character SHA and owned state lock ID. There is **no operation input**. Confirm this separate owned-scope cleanup decision, then **Run workflow**.

![GitHub reference showing the workflow-selection sidebar](../docs/images/github-workflow-sidebar.webp)

*REFERENCE — GitHub, CC BY 4.0; CodeQL is an example, not cleanup evidence. [Attribution](../docs/images/NOTICE.md).*

**CLI alternative:** PowerShell **5.1 or 7**, only after Action 1 and the current admin's explicit authorization. Use that authenticated GitHub CLI session; [official installation](https://github.com/cli/cli#installation) if missing. No tokens in Chat, PRs or files. Obtain the actual current full main SHA and owned lock ID through the approved private process; local syntax checks do not prove readiness or admin rights. If the browser already dispatched, **do not also run this block**.

```powershell
$cleanupRepo = 'alvine-aurelio-org/ws2-sim-20260921-azure-delivery-laboratory-07'
$mainSha = (Read-Host 'Current full protected-main SHA, verified by the authorized owner').Trim()
$stateLockId = (Read-Host 'Owned WS2_STATE_LOCK_ID, verified by the authorized owner').Trim()
if ($mainSha -cnotmatch '^[a-f0-9]{40}$' -or $stateLockId -notmatch '^[A-Za-z0-9-]{3,80}$') {
    throw 'Use the actual full SHA and owned lock ID; do not guess or use placeholders.'
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'GitHub CLI is missing. Use the browser route or official installation guidance; stop here.'
}
$authorization = 'destroy:1379149907:{0}:{1}' -f $mainSha, $stateLockId
gh workflow run cleanup.yml --repo $cleanupRepo --ref main --field "authorization=$authorization"
if ($LASTEXITCODE -ne 0) {
    throw 'Cleanup dispatch failed. Stop, reconcile Actions with the owner, and do not retry automatically.'
}
Write-Output 'Authorized cleanup requested; this is not completed cleanup. Inspect the new run and actual inventory.'
```

**Why — every command/check:**

| Part | Meaning |
| --- | --- |
| `$cleanupRepo` | Exact approved repository name; runtime additionally verifies immutable ID **1379149907**, privacy and non-template status |
| `Read-Host` / `.Trim()` | Read the verified current full main SHA and owned lock ID, not secrets; remove surrounding whitespace |
| `-cnotmatch` / `-notmatch` / `-or` | Reject malformed SHA or lock ID; passing syntax is not admin/scope authorization |
| `Get-Command` / `-ErrorAction SilentlyContinue` | Detect `gh` without noisy lookup errors; missing CLI triggers `throw` |
| `-f` | Build the exact `destroy:<repoID>:<current full main SHA>:<WS2_STATE_LOCK_ID>` string |
| `gh workflow run` | Request the dedicated [cleanup workflow](../.github/workflows/cleanup.yml), not delivery or local Terraform |
| `--repo $cleanupRepo` | Explicit approved writer; never infer from the current folder |
| `--ref main` | Select protected main, not a task/default branch |
| `--field "authorization=$authorization"` | Send the required STRING authorization as one argument; no operation input |
| `$LASTEXITCODE`, `-ne 0`, `throw` | Stop on failed dispatch; no automatic retry |
| `Write-Output` | Reminder: accepted request is **not completed cleanup** |

For either route, open the **new** cleanup run: current main SHA, attempt **1**. Require **Verify separate dev cleanup authorization**, **Validate reviewed delivery revision**, **Trusted dev plan**, then **Apply exact authorized dev destroy plan**. There is no reviewer wait. Uncertain dispatch? Reconcile Actions with the owner before another request; never rerun credentialled jobs.

### 3. Understand the authorization and exact destroy plan

The historical [approval.cjs](../scripts/approval.cjs) delegates to [deployment-authorization.cjs](../scripts/deployment-authorization.cjs), not an approvals API. It checks current admin permission, matching actor/sender/trigger IDs, exact private identity, live rules, current SHA/state, merged-PR association and successful validation/plan in this same run. The required authorization string cannot be reused after main or the state lock ID changes. See [saved-plan integrity](../docs/plan-review.md) for both SHA-256 digests and code/tool/lock/input/identity/backend bindings.

Inspect property-level changes/outputs: only assigned-workload deletes/no-ops, no creates, replacements or shared infrastructure. Protected main must remain unchanged; plan age ≤ **2 hours**, encrypted-artifact retention **1 day**. No plaintext plans/state, keys, tokens or sensitive screenshots in Git/issues/Chat.

The separately authorized owner's explicit dispatch is the cleanup decision, not a later approval button. No independent cleanup reviewer is required. An earlier deploy, no-change result, Copilot response or issue checkbox cannot supply this separate authorization. The same-run exact saved-plan checks still run before mutation.

### 4. Verify cleanup, not just dispatch

The workflow must recheck current main/authorization/bindings and apply the exact saved plan without replanning. Require both **Trusted dev plan** and **Apply exact authorized dev destroy plan** to succeed, its **empty managed-state** verification, and the instructor's separate **Azure inventory and retained-owner confirmation**. Never pull/edit state or delete shared resources to fake emptiness.

**Expected / gate:** Refresh the existing Exercise. AgentAlvine requires the same-repository **cleanup.yml** current-SHA main run, attempt **1**, after course start/preceding checkpoint, with both named jobs successful in that same run. A delivery run, wrong path, skipped/old/fixture jobs or jobs combined from different runs cannot substitute. This metadata-only observation is not independent Azure verification or authorization; no manual evidence/progress protocol. Empty state does not prove retained ownership.

**Observer wiring prerequisite:** before live enablement, the workflow owner must
verify that [AgentAlvine's completion-event subscription](../.github/workflows/agentalvine.yml)
includes **Trusted dev cleanup (explicit owner authorization required)**. Course
metadata and unit tests alone do not install this wiring or prove an automatic
issue update. Missing wiring remains pending with the owner; do not dispatch
delivery, edit progress or fabricate a completion event to compensate.

**Recovery:** Keep failed/uncertain cleanup **BLOCKED** and escalate. Never cancel/unlock an active writer, widen roles or expose storage. Changed/expired plans require a new explicit owner authorization/dispatch bound to current main/state and a fresh exact destroy plan. Retain shared RG/backend/identities/runner; no cleanup on ordinary main.

**Next:** Close live work only after full cleanup/inventory. Optional later Lab 08 live work needs this same writer and a newly reviewed release/exact-pin/deploy/followup/destroy cycle; offline study alone leaves live completion pending.
<!-- FULL-WS-LESSON:END -->

## Original Cycle A/B outcome — 2026-09-08

- **Cycle A: pending genuine prerequisite.** No authorized deployment/follow-up or independently reviewed live destroy occurred; retained-resource inventory was not claimed verified.
- **Cycle B: pending genuine prerequisite.** The fresh copy likewise stopped at **1/5**, with `WORKSHOP_AZURE_ENABLED=false` and no cloud run.
- No scoped-cleanup or empty-state success is inferred from mocks. Real cleanup and retained-resource ownership remain separate instructor-verified responsibilities.

See [simulation.md](simulation.md) for original evidence and the live-work boundary. Offline Lab 08 completion cannot complete this pending activity.

[Previous activity](activity-04.md) · [Review index](README.md)
