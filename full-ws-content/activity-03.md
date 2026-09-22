# Lab 07 · Activity 03 — Explain and observe automatic exact-plan deployment

[Review index](README.md) · [Previous activity](activity-02.md) · [Next activity](activity-04.md) · [Simulation evidence](simulation.md)

> [!NOTE]
> **Review copy, not a second progress tracker.** The complete canonical lesson follows. Learners follow the live **Exercise issue in their own private copy**, opened from that copy's README; AgentAlvine updates the same issue body. The public source preview awards no learner progress. This live activity remains blocked until genuine instructor prerequisites are met.

<!-- FULL-WS-LESSON:START -->
# Lab 07 · Step 3 — Explain and observe automatic exact-plan deployment

**Goal:** Commit the exact-plan note, observe a later real apply, and inspect Azure properties.

Keep every [Step 2 prerequisite](activity-02.md); public/unapproved copies remain offline. No local apply, state access, reviewer wait or credentials in PR checks.

### 1. Write your note after Step 2

After Step 2 is recorded, create **lab/plan-review** from **current main** in VS Code. Edit only [exercise/plan-review.md](../exercise/plan-review.md); preserve existing learner work, remove `TODO`, and explain these points:

```markdown
# Exact-plan review
A fresh plan binds this run's reviewed SHA, inputs, module and owned state.
The saved-plan digest and manifest digest must match the trusted summary.
The maximum age is 2 hours; 1 day artifact retention does not extend validity.
Protected-main validation and planning lead to automatic exact-plan apply
of those saved bytes in the same run, without replanning or a reviewer wait.
Full destruction needs separate cleanup authorization from the current
repository admin. Neither this note nor Exercise progress authorizes Azure.
```

### 2. Publish the real note PR

Repeat [Step 1's four offline checks](activity-01.md#4-run-offline-checks-and-publish). **Source Control → inspect diff → Stage Changes** for the note only → **Commit → Publish Branch/Push**. GitHub **Pull requests → New pull request → base: main → compare: lab/plan-review**. Inspect **Files changed**, wait for current checks, resolve conversations, then **Merge pull request → Confirm merge** as the author.

### 3. Observe this later exact-plan run

Open **Actions → Trusted dev delivery (instructor enablement required)** and this later **push / main** run: current SHA, **attempt 1**. After scoped preflight and same-SHA validation, **Trusted dev plan → Apply exact dev saved plan** must succeed in the **same run**. No Step 2 artifact reuse, no second deploy dispatch and no credentialled rerun. Keep plan/state contents and decryption keys private.

![GitHub reference: open Actions](../docs/images/github-actions.webp)

*REFERENCE — GitHub, CC BY 4.0; navigation, not Azure evidence. [Attribution](../docs/images/NOTICE.md).*

### 4. Inspect the actual Azure configuration

With authorized access, open [Azure portal](https://portal.azure.com) → **Directories + subscriptions → assigned directory/subscription → Resource groups → assigned RG → actual VNet / NSG**. Obtain names from the owner/run's scoped outputs, **not guessed names**.

| Click | Compare with the reviewed configuration |
| --- | --- |
| VNet / NSG **Overview**, **JSON View** if needed | Exact resource ID, approved region, `provisioningState: Succeeded` |
| VNet → **Address space** | Approved address-space CIDRs |
| VNet → **Subnets** → each subnet | Stable keys/names, prefixes and NSG associations |
| VNet → **JSON View** → `properties.subnets` | Each subnet's `defaultOutboundAccess: false` |
| NSG → **Inbound security rules / Outbound security rules** | Direction/access/priority/protocol/ports/source/destination match reviewed inputs/module |
| NSG → **Subnets** | Associations match the VNet's subnet list |
| VNet / NSG → **Tags** | All required tags and values match approved inputs |

Compare resource IDs with the run and keep observations private. Subnets are nested, not separate RG rows. Green Actions and output IDs are **not actual configuration proof**. Make the single benign update only in [Step 4](activity-04.md).

**Expected:** The complete note and actual completed current-SHA plan/apply run, after course start/Step 2, satisfy the unchanged gate; fixtures, skipped/old jobs or combined runs do not. Portal observations remain separate from AgentAlvine's metadata.

**Recovery:** Stop on mismatches; ask the owner to reconcile. Changed/expired bindings need a fresh authorized plan, never edited manifests, broader roles or reruns.
<!-- FULL-WS-LESSON:END -->

## Original Cycle A/B outcome — 2026-09-08

- **Cycle A: pending genuine prerequisite.** No instructor-enabled trusted plan, protected-main route, independent encrypted-plan approval, or real apply was completed.
- **Cycle B: pending genuine prerequisite.** The fresh copy remained at **1/5** with `WORKSHOP_AZURE_ENABLED=false`; no cloud run or approval was fabricated.
- Review-note examples and offline fixture tests cannot satisfy the required same-run successful planning and apply jobs.

See [simulation.md](simulation.md) for original evidence and live-work limitations. The complete lesson is available for review, not evidence of execution.

[Previous activity](activity-02.md) · [Review index](README.md) · [Next activity](activity-04.md)
