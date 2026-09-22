# Lab 07 · Full workshop content for review

[Repository landing](../README.md) · [Complete setup](00-start-here.md) · [Azure inputs and login](azure-setup.md) · [Simulation and verification](simulation.md)

**Goal:** Review all five complete lessons; follow **your private copy's Exercise** for grading. This is a static mirror, not another exercise. Marker-bounded bodies preserve canonical text/examples, with only outside-fence Markdown links rebased. [Course manifest](../.github/agentalvine/course.json).

## Required hands-on activity — visible phase checklist

Use the [existing workflow-authoring guide](../docs/workflow-authoring.md), part of activities 01–02, not a new course or optional reading assignment.

| Phase | Do / expected output |
| --- | --- |
| **Construct** | VS Code **File → New Text File → YAML**; use the [non-runnable reference](../solutions/delivery.yml) section by section: header, preflight, validation, plan, automatic apply, followup/drift; replace only the complete canonical file in one save while false |
| **Validate** | Identity map plus Node/kit/workflow/two consumer mocks; inspect current-SHA **Workshop quality / Lab checks**, not a skipped delivery run |
| **Owner readiness** | Inspect settings, scoped secret names and runner access; owner authorizes target, budget/currency, lifetime and bootstrap, then verifies OIDC/state/leases/keys/module App |
| **Automatic private apply** | Checks-passing author-merged PR → protected-main push → same-SHA validation → encrypted saved plan → automatic exact-plan apply; no approvals API, reviewer wait or second deploy button |
| **Verify/update** | [Actual Azure configuration and benign HCL tag update](../docs/workflow-authoring.md#6-hands-on-verify-configuration-and-make-a-benign-update), in-place change, no replacement and the same resource IDs; output IDs alone are not configuration proof |
| **Followup/cleanup** | Delivery's manual menu: **followup only**, exit 0; current admin separately authorizes [cleanup.yml](../.github/workflows/cleanup.yml), required `destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>`, no operation input; verify empty managed state plus actual inventory |

These phases retain the five original checkpoint meanings and award no manual progress. Ordinary main never cleans up. Historical outcomes below remain unchanged and do not attest this task.

**Additional hands-on:** [Defender runtime posture, Terraform remediation and cleanup](defender-posture-hands-on.md), the full guide with rebased links. Requires actual eligible deploy/followup in the existing approved writer; unexecuted instructions add no historical proof or automatic grade.

> [!WARNING]
> **Public templates and unapproved copies remain inert.** Only the exact private identity in [configuration](../docs/delivery-configuration.md) is eligible; do not repin the allowlist. Preserve [all live controls](activity-02.md): strict checks, main-only environments with no Required reviewers/admin bypass, scoped OIDC, locked state and encrypted exact plans. [Mandatory full cleanup](activity-05.md) is separately admin-authorized. The separate AVM **4.81** profile is not baseline **5.4.0** live delivery. No new live proof is claimed.

Keep false and default dev; missing main/readiness means offline handoff, not invented settings or a PR to nonexistent main. Only after owner baseline/readiness review may protected main be established while disabled. Public source maintenance stays on dev. The [configuration guide](../docs/delivery-configuration.md) describes expected public setup, not private observations.

## Do — one copy, one Exercise

1. Use [setup](00-start-here.md) to install tools/check accounts, create one **Private** copy, clone **its own URL**, and open that clone. Already copied? Do not copy again. No earlier lab or Azure account is needed offline.
2. Open your copy's **Exercise**; start on `lab/workflow-authoring`. Construct the single disabled workflow, complete the identity map, save/commit/push, and inspect current Actions checks. Live work needs the instructor-approved protected-main route, never an invented branch or approval.
3. Refresh the **same issue body**: AgentAlvine supplies feedback and the next activity automatically. No manual checkbox, run-ID submission or evidence PR.

**Expected:** Offline identity study can advance; missing live prerequisites remain blocked. [Azure inputs/login](azure-setup.md) are optional account preparation, not provisioning permission; local/PR checks stay credential-free.

**Recovery:** If Exercise is missing, inspect [startup troubleshooting](../docs/troubleshooting.md#agentalvine-or-the-exercise-is-missing), then only in your copy use **Actions → AgentAlvine → Run workflow → Check progress**, actual default branch (normally `dev`). This reconciles the guide; it does not run delivery or bypass pending gates. Never select learner Preview or create duplicate issues.

The original titles and pending reasons below include the **then-required independent review**. They are historical, not current reviewer blockers; follow the linked current activities for automatic apply and dedicated cleanup. No original result is rewritten.

## Complete activity sequence and original A/B status

**Historical, 2026-09-08: A 1/5; B 1/5.** `WORKSHOP_AZURE_ENABLED=false`; no protected main, completed cloud preflight or cloud run was claimed. “Verified” below is not a new learner's progress.

| Activity | Complete lesson | Cycle A | Cycle B |
| --- | --- | --- | --- |
| Setup | [Full first-time setup](00-start-here.md) | Guidance; not a progress checkpoint | Guidance; not a progress checkpoint |
| 01 | [Map identity and state without enabling Azure](activity-01.md) | Verified offline | Verified offline |
| 02 | [Observe an actual trusted dev plan](activity-02.md) | Pending instructor/cloud prerequisites | Pending instructor/cloud prerequisites |
| 03 | [Review and independently approve exact-plan deployment](activity-03.md) | Pending real plan, independent review and apply | Pending real plan, independent review and apply |
| 04 | [Confirm a fresh no-change result](activity-04.md) | Pending applicable deployment and follow-up | Pending applicable deployment and follow-up |
| 05 | [Review scoped destruction and retain shared resources](activity-05.md) | Pending reviewed live cleanup and inventory | Pending reviewed live cleanup and inventory |

**Next:** [Activity 01](activity-01.md), or your Exercise's current activity. [Simulation evidence](simulation.md) retains original counts; mocks cannot complete live stages.

## Live public source preview — read-only, not learner progress

The [source Exercise #1](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07/issues/1) is instructor **Preview**, not learner grading. The **2026-09-14 read-only observation** confirmed step 0, **0/5**. “Live” means a real GitHub page, not Azure delivery.

![Actual Lab 07 public source Exercise preview — 2026-09-14, not a completed simulation](images/exercise-preview.png)

*Captured on 2026-09-14 from the actual public GitHub Exercise #1: read-only instructor Preview, step 0 (0/5). [images/provenance.json](images/provenance.json) records the PNG SHA-256 and exact capture timestamp. This current source Preview is not a September 8 participant screenshot, either private 1/5 outcome, or Azure proof.*

[Historical local verification](simulation.md#fresh-2026-09-14-verified-results) · [Original private Lab 07 records](https://github.com/alvine-aurelio-org/ws2-public-rebuild-20260908-evidence/blob/dev/full-ws-content/lab-07/README.md). Screenshots supplement records; they do not replace them.
