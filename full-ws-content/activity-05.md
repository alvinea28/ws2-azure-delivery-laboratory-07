# Lab 07 · Activity 05 — Observe separately authorized cleanup and retain shared resources

[Review index](README.md) · [Previous activity](activity-04.md) · [Setup](00-start-here.md) · [Simulation evidence](simulation.md)

> [!NOTE]
> **Review copy, not a second progress tracker.** The complete canonical lesson follows. Learners follow the live **Exercise issue in their own private copy**, opened from that copy's README; AgentAlvine updates the same issue body. The public source preview awards no learner progress. This live activity remains blocked until genuine instructor prerequisites are met.

<!-- FULL-WS-LESSON:START -->
# Lab 07 · Step 5 — Observe separately authorized full cleanup

**Goal:** Remove the whole owned workload, then verify actual Azure absence.

### 1. Obtain separate cleanup authorization

After [followup](activity-04.md), the **current repository admin** makes a **separate explicit full owned-workload cleanup decision**. Reconfirm [Step 2 readiness](activity-02.md); no independent cleanup reviewer. Earlier deployment/bootstrap/Exercise permission is not this decision. Public/unapproved copies stay offline.

### 2. Dispatch once in the browser

That admin opens **Actions → Trusted dev cleanup (explicit owner authorization required) → Run workflow → main**. Enter required string **authorization** as `destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>`.

The owner supplies verified current **40-character SHA** and owned **state lock ID** values; **never submit placeholders** or guess. **No operation input**. Confirm, then **Run workflow** once. Open the new current-SHA **attempt 1** run; never rerun credentialled jobs.

![GitHub workflow-selection reference](../docs/images/github-workflow-sidebar.webp)

*REFERENCE — GitHub, CC BY 4.0; example labels, not cleanup evidence. [Attribution](../docs/images/NOTICE.md).*

### 3. Observe exact full destruction

[cleanup.yml](../.github/workflows/cleanup.yml) uses delivery's same root/state, identities, environments and concurrency: an encrypted saved full destroy plan, applied as exact bytes.

**Verify separate dev cleanup authorization → Validate reviewed delivery revision → Trusted dev plan → Apply exact authorized dev destroy plan**.

Require only owned-workload deletes/no-ops; no creates/replacements. Plan validity is **2 hours**, encrypted-artifact retention **1 day**; never expose plaintext/state/keys. No `-target`, broad RG deletion or state-file deletion. Ordinary main pushes never clean up.

### 4. Verify absence and retained ownership

Require workflow **empty managed-state** verification. Also [Azure portal](https://portal.azure.com) → assigned directory/subscription → **Resource groups → assigned RG → Refresh**: actual VNet/NSG absent, nested subnets/associations gone. Empty state alone is **not Azure absence proof**. Retain shared RG, backend account/container, identities, runner and shared networks.

**Expected:** Actual completed cleanup after course start/preceding checkpoint: both named jobs successful in the same run, not old/skipped/fixture jobs. AgentAlvine observes metadata, not Azure inventory/authorization.

**Recovery:** Keep failed/uncertain cleanup open; escalate to the owner, with no force-unlock, wider roles or local destroy. Reconcile uncertain dispatch before retrying.

**Next:** Close live work only after cleanup/inventory; [future recovery help](../docs/recovery.md) is optional reference.
<!-- FULL-WS-LESSON:END -->

## Original Cycle A/B outcome — 2026-09-08

- **Cycle A: pending genuine prerequisite.** No authorized deployment/follow-up or independently reviewed live destroy occurred; retained-resource inventory was not claimed verified.
- **Cycle B: pending genuine prerequisite.** The fresh copy likewise stopped at **1/5**, with `WORKSHOP_AZURE_ENABLED=false` and no cloud run.
- No scoped-cleanup or empty-state success is inferred from mocks. Real cleanup and retained-resource ownership remain separate instructor-verified responsibilities.

See [simulation.md](simulation.md) for original evidence and the live-work boundary. Offline Lab 08 completion cannot complete this pending activity.

[Previous activity](activity-04.md) · [Review index](README.md)
