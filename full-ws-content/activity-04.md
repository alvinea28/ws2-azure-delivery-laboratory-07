# Lab 07 · Activity 04 — Confirm a fresh no-change result

[Review index](README.md) · [Previous activity](activity-03.md) · [Next activity](activity-05.md) · [Simulation evidence](simulation.md)

> [!NOTE]
> **Review copy, not a second progress tracker.** The complete canonical lesson follows. Learners follow the live **Exercise issue in their own private copy**, opened from that copy's README; AgentAlvine updates the same issue body. The public source preview awards no learner progress. This live activity remains blocked until genuine instructor prerequisites are met.

<!-- FULL-WS-LESSON:START -->
# Lab 07 · Step 4 — Make one benign update and confirm no-change

**Goal:** Apply one tag-only update, inspect it, then confirm no-change.

Use the approved private writer after [Step 3](activity-03.md)'s deployment/inspection; retain every [Step 2 control](activity-02.md). Public/unapproved copies stay offline.

### 1. Make the approved tag update

Agree an **owner-approved non-reserved tag** within the existing budget/lifetime. Create **lab/benign-update** from deployed current main; preserve existing work. In [environments/dev/main.tf](../environments/dev/main.tf), module `network`, replace only `tags = var.tags` with:

```hcl
tags = merge(var.tags, { workshop_iteration = "02" })
```

Preserve reserved `var.tags`, source pin, locks, names, CIDRs, subnet keys, rules, topology, backend and ownership. Lab07 has **no `locals.tags`**. If this tag is disallowed/already present, stop for a genuine owner-approved change; no empty commit or second baseline update.

### 2. Check and merge the real change

At clone root:

```powershell
npm test
npm run kit:check
npm run workflow:check
node scripts/check-learner.mjs
```

**Source Control → inspect diff → Stage Changes → Commit → Publish Branch/Push**. Open a PR with **base: main**, **compare: lab/benign-update**; inspect changed files, wait for current checks, resolve conversations, then **Merge pull request → Confirm merge** as author within the authorized window.

In its new **push / main** run, require validation, **Trusted dev plan → Apply exact dev saved plan**. Expect actual in-place updates: **creates 0, deletes 0, replacements 0**, with the same VNet/subnet/NSG resource IDs. Reopen the Azure portal resources → **Tags**: verify `workshop_iteration = "02"` and preserved required tags/topology.

![GitHub reference: inspect the PR diff](../docs/images/github-pr-files.webp)

*REFERENCE — GitHub, CC BY 4.0; not your update evidence. [Attribution](../docs/images/NOTICE.md).*

### 3. Request followup, not another deployment

**Actions → Trusted dev delivery (instructor enablement required) → Run workflow → main → operation: followup** only. Open the **new run**, **attempt 1**, at the latest deployed SHA; never rerun old jobs. Require fresh plan **exit 0** and **Confirm no-change**; exit **2 is not no-change**, **1** is an error. Followup never applies; scheduled drift is report-only.

**Expected:** The actual completed current-SHA main run after course start/preceding checkpoint has **Trusted dev plan** and **Confirm no-change** successful in the same run. Old/skipped/fixture jobs do not count; no new score.

**Recovery:** Stop on unexpected changes/access errors; ask the owner, never suppress refresh, unlock state or widen roles.

**Next:** [Step 5 cleanup](activity-05.md). Optional later capstone work needs a fresh revision-bound cycle, not historical results.
<!-- FULL-WS-LESSON:END -->

## Original Cycle A/B outcome — 2026-09-08

- **Cycle A: pending genuine prerequisite.** No real deployment preceded a separate follow-up, and no actual no-change job was completed.
- **Cycle B: pending genuine prerequisite.** The fresh copy remained offline at **1/5**; no `followup` cloud run occurred and `WORKSHOP_AZURE_ENABLED=false` remained the boundary.
- No baseline or optional capstone no-change is claimed. An offline fixture, plan-only result, or another revision cannot satisfy this activity.

See [simulation.md](simulation.md) for original records and live prerequisites; no whole-lab counts are assigned to this pending activity.

[Previous activity](activity-03.md) · [Review index](README.md) · [Next activity](activity-05.md)
