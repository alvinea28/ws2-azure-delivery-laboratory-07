# Lab 07 · Activity 03 — Review and independently approve exact-plan deployment

[Review index](README.md) · [Previous activity](activity-02.md) · [Next activity](activity-04.md) · [Simulation evidence](simulation.md)

> [!NOTE]
> **Review copy, not a second progress tracker.** The complete canonical lesson follows. Learners follow the live **Exercise issue in their own private copy**, opened from that copy's README; AgentAlvine updates the same issue body. The public source preview awards no learner progress. This live activity remains blocked until genuine instructor prerequisites are met.

<!-- FULL-WS-LESSON:START -->
# Lab 07 · Step 3 — Independently review and apply this run's exact plan

**Goal:** Apply only this run's fresh, independently reviewed saved plan.

| Working context | Selection |
| --- | --- |
| Branches | Note: `lab/identity`; live: current protected `main` in the approved private writer |
| Edit | [exercise/plan-review.md](../exercise/plan-review.md) only |
| Workflow | **Trusted dev delivery (instructor enablement required)** / `deploy` |
| Tools | Node **24.16.0**, Terraform **1.16.1**, AzureRM **5.4.0**; unchanged locks |

> [!WARNING]
> **Public templates remain inert; live delivery is not solo.** Reconfirm every [Step 2 prerequisite](activity-02.md) and [instructor preflight](../docs/instructor-preflight.md). No self-approval, administrator bypass, learner enablement, local real init/state/apply/destroy or Copilot cloud tools. Missing controls mean **BLOCKED**.

## Do

### 1. Write the review note

On `lab/identity`, obtain synchronization help if previously merged. Open the note with **Ctrl+P**; replace `TODO` text with:

```markdown
# Exact-plan review
A fresh plan is created for this run's reviewed code, inputs, module, and state.
The saved-plan digest and manifest digest must both match the trusted summary.
Bindings include repository, source SHA, run ID/attempt, operation, dev root,
tenant/subscription, separate identities, workload RG, backend account/container/key,
provider/module locks, input hash, and the pinned Terraform/provider versions.
The maximum age is 2 hours; 1 day artifact retention does not extend that limit.
An independent reviewer, neither initiator nor deployed code author, inspects
the exact decrypted plan using instructor-approved access before approving dev-apply.
Changed bindings, a moved main, expired plans, or reruns require a new dispatch
and fresh independent approval. This note is not approval or proof of deployment.
```

**Why:** Digests/bindings identify the reviewed plan; notes and PR approval do not approve Azure mutation.

### 2. Commit and use the protected PR route

| Where | Action |
| --- | --- |
| VS Code | **Ctrl+S**; inspect diff; **+** stages only the note; inspect **Staged Changes** |
| Source Control | Commit `lab: describe exact-plan review`; **Push**, or first **Publish Branch** to existing `origin` |
| GitHub | Verify newest SHA and credential-free **Lab checks**; **Pull requests → New pull request**, same-copy **base: main**, **compare: lab/identity** |
| PR | Inspect **Files changed**; obtain required nonauthor review/current-head checks; coordinate protected merge with instructor |

Absent `main` means stop. Confirm current main's reviewed merged-PR association. Feedback needs new checks/review. Enabled main pushes can request `deploy`: coordinate runs, never auto-approve.

### 3. Request a fresh deploy plan

After merging, inspect **Code → main → latest commit**. Select **Actions → Trusted dev delivery (instructor enablement required) → Run workflow**, **Branch: main**, **operation: deploy**. Verify SHA/attempt **1**; never **Re-run jobs** or reuse Step 2's artifact.

Require **Verify instructor gate configuration** and **Trusted dev plan** to succeed. Leave **Apply reviewed dev plan** waiting at `dev-apply` for its independent reviewer.

![GitHub reference highlighting the Actions tab](../docs/images/github-actions.webp)

*REFERENCE — GitHub, CC BY 4.0; navigation, not deployment evidence. [Attribution](../docs/images/NOTICE.md).*

### 4. Independently inspect and approve the exact artifact

The reviewer must be neither run actor/triggering actor nor PR/deployed code author. On an approved workstation, follow [controlled encrypted review](../docs/delivery-configuration.md): decrypt this run's envelope through approved escrow, compare **both SHA-256 digests** with its trusted summary, and verify every binding listed in the note.

Inspect property-level changes/outputs—not sanitized addresses alone. Limit scope to assigned VNet/subnets/NSG/rules/associations in the existing RG; reject shared infrastructure/broader access. Confirm unchanged protected main/inputs/state/dependencies, age ≤ **2 hours**. **1 day** encrypted-artifact retention never extends validity. No keys, tokens, plaintext plans/state or sensitive images in Git/issues/Chat.

Only then: pending banner → **Review deployments → dev-apply → review comment → Approve and deploy**. Unavailable or unacceptable review stays blocked.

### 5. Observe apply and the gate

**Apply reviewed dev plan** rechecks current main, independent approval, digests, bindings and age immediately before applying that saved plan, without silently replanning. Have the instructor verify workload inventory; refresh the existing Exercise after completion.

**Expected / gate:** Note contains `fresh plan`, `digest`, `2 hours`, `independent reviewer`, no `TODO`; successful same-repository current-SHA main run, attempt **1**, after course start/preceding checkpoint, with **Trusted dev plan** and **Apply reviewed dev plan** both successful—not skipped, fixtures or older jobs.

**Recovery:** Record a sanitized blocker. Moved main, expired plan or changed binding requires a new dispatch and independent review, never reruns, edited manifests, disabled locks or broader roles.

**Next:** [Step 4: fresh followup](activity-04.md), then mandatory reviewed cleanup. Apply success alone proves neither.
<!-- FULL-WS-LESSON:END -->

## Original Cycle A/B outcome — 2026-09-08

- **Cycle A: pending genuine prerequisite.** No instructor-enabled trusted plan, protected-main route, independent encrypted-plan approval, or real apply was completed.
- **Cycle B: pending genuine prerequisite.** The fresh copy remained at **1/5** with `WORKSHOP_AZURE_ENABLED=false`; no cloud run or approval was fabricated.
- Review-note examples and offline fixture tests cannot satisfy the required same-run successful planning and apply jobs.

See [simulation.md](simulation.md) for original evidence and live-work limitations. The complete lesson is available for review, not evidence of execution.

[Previous activity](activity-02.md) · [Review index](README.md) · [Next activity](activity-04.md)
