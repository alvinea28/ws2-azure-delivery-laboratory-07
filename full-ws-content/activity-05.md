# Lab 07 · Activity 05 — Review scoped destruction and retain shared resources

[Review index](README.md) · [Previous activity](activity-04.md) · [Setup](00-start-here.md) · [Simulation evidence](simulation.md)

> [!NOTE]
> **Review copy, not a second progress tracker.** The complete canonical lesson follows. Learners follow the live **Exercise issue in their own private copy**, opened from that copy's README; AgentAlvine updates the same issue body. The public source preview awards no learner progress. This live activity remains blocked until genuine instructor prerequisites are met.

<!-- FULL-WS-LESSON:START -->
# Lab 07 · Step 5 — Independently review scoped cleanup

| Before you start | This step |
| --- | --- |
| Goal | Retire only the reviewed dev workload and confirm retained shared resources |
| Repository / branch | The same approved private single-writer copy / current protected `main` |
| Files | No edits; preserve the reviewed [environments/dev/main.tf](../environments/dev/main.tf) and [module-lock.json](../module-lock.json) |
| Prerequisite | Successful deployment and fresh `followup` for the applicable baseline or capstone revision |
| Workflow / operation | **Trusted dev delivery (instructor enablement required)** / `destroy` |
| Required live jobs | **Trusted dev plan** and **Destroy reviewed dev plan** |
| Review | A new independent `dev-apply` approval, neither initiator nor deployed code author |
| Toolchain / lifetime | Node **24.16.0**, Terraform **1.16.1**, AzureRM **5.4.0**; **2 hours** plan age, **1 day** encrypted-artifact retention |

> [!WARNING]
> This operation deletes the reviewed workload. **The public template always remains inert.** Proceed only with instructor go-ahead in the approved private copy and unchanged protections. Do not run local destroy, broad RG deletion, real local initialization, state pull, active force-unlock, or Copilot cloud tools.

> [!IMPORTANT]
> **Full cleanup of the Azure workload actually provisioned is mandatory after each live exercise, before moving to another exercise or declaring the live session complete.** Use the same approved root/state. Completion requires the real cleanup jobs, empty managed state and instructor-confirmed Azure inventory. If cleanup fails or remaining resources are uncertain, keep the activity open and escalate; do not claim completion.

## 1. Confirm readiness and the cleanup boundary

1. Re-read [docs/instructor-preflight.md](../docs/instructor-preflight.md) and [docs/delivery-configuration.md](../docs/delivery-configuration.md) with the instructor.
2. Confirm this exact repository remains the one state writer; do not start another copy for cleanup.
3. Open the current **Exercise** body and verify the real applicable deployment and fresh no-change jobs succeeded. Offline Lab 08 completion alone does not satisfy that prerequisite.
4. Obtain the instructor's go-ahead to retire the assigned workload now, rather than assuming a no-change result permits deletion.
5. In **Code** select protected `main`, inspect its current SHA, and compare source, dependency, state, and inputs with the reviewed deployed revision.
6. Reconfirm private backend reachability, separate identities, container-scoped lease access, state concurrency, restricted allowed-workflow runner, main-only environments, and independent reviewers.
7. Confirm self-review is prevented and administrator bypass is disabled. If any setting or reviewer is missing, halt and record **BLOCKED** without dispatching.

| Managed workload — eligible only after exact-plan review | Retained resources — not managed by this root |
| --- | --- |
| Assigned VNet | Existing team/workload resource group |
| Named subnets, including `app` if actually deployed | Backend storage account and assigned container |
| Composed NSG and explicit rules | Plan/apply identities and their ownership |
| Subnet/NSG associations | Trusted runner, runner group, and shared network infrastructure |

The instructor confirms retained-resource owners and final inventory. Never delete shared resources to make a checker or state display look empty.

Here, **scoped** means **the entire Terraform-managed workload in this approved lab root/state**, not a partial `-target` deletion. The workflow creates a fresh Terraform `plan -destroy`, encrypts the saved plan, and applies **that exact independently reviewed saved plan**. It is not an ungated local `terraform destroy` or broad resource-group deletion. The existing/shared resource group, backend account/container, identities and runner remain retained.

## 2. Start a new destroy-plan run

1. Open **Actions** in this authorized private repository.
2. Select **Trusted dev delivery (instructor enablement required)** in the workflow sidebar.
3. Select **Run workflow**.
4. Set **Use workflow from: Branch main** and **operation: destroy**.
5. Recheck repository, branch, operation, and instructor go-ahead before selecting the green **Run workflow** button.
6. Refresh the run list, open the **new run**, and verify the current reviewed SHA and attempt **1**.
7. Do not select **Re-run jobs**, **Re-run failed jobs**, or **Re-run all jobs** on any earlier plan, apply, or cleanup run.
8. Watch **Verify instructor gate configuration**, then **Trusted dev plan**. This creates a new encrypted **destroy plan**, not a replay of the follow-up artifact.
9. Leave **Destroy reviewed dev plan** waiting at `dev-apply` until the actual independent reviewer completes the next section.

![GitHub reference showing the workflow-selection sidebar](../docs/images/github-workflow-sidebar.webp)

*REFERENCE — GitHub publisher example, CC BY 4.0. The highlighted **CodeQL** is an example label, not the workflow to run or proof of cleanup. [Sources and attribution](../docs/images/NOTICE.md).*

### PowerShell CLI alternative — the same guarded workflow

**GitHub CLI is needed only for this alternative**; the browser procedure above remains available. If needed, use the [official GitHub CLI installation instructions](https://github.com/cli/cli#installation) through your organization's approved process. Use your own authorized GitHub CLI session and trusted browser sign-in, not an Azure CLI token or a secret pasted into chat.

Run the complete block below in **PowerShell 5.1 or 7 only after all section 1 gates and instructor go-ahead**, targeting the same approved **PRIVATE Lab 07 writer**, never the public template or a Lab 08 copy. Confirm the exact private repository with the instructor first: the format check does not prove privacy, protection or authorization. Choose **one** dispatch route; if the browser route already started a run, do not also run this block.

```powershell
$deliveryRepo = Read-Host 'Instructor-approved PRIVATE Lab 07 repository (OWNER/NAME)'
$deliveryRepo = $deliveryRepo.Trim()
if ($deliveryRepo -notmatch '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$' -or
	$deliveryRepo -match '(^|/)(owner|name|repo|repository|your[-_].*|replace[-_].*|example)(/|$)') {
	throw 'Enter the actual instructor-approved private OWNER/NAME, not a URL or placeholder.'
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
	throw 'GitHub CLI is missing. Use the browser route or official installation guidance; stop here.'
}
gh workflow run delivery.yml --repo $deliveryRepo --ref main --field operation=destroy
if ($LASTEXITCODE -ne 0) {
	throw 'Destroy workflow dispatch failed. Stop, inspect Actions with the instructor, and do not retry automatically.'
}
Write-Output 'Destroy workflow requested; cleanup is not complete. Follow the new run in Actions and retain independent review.'
```

A successful CLI exit confirms only the dispatch request, not destruction. Open the **new run** in that private repository's Actions page, follow browser steps 6–9, complete section 3's independent review, and wait for both real **Trusted dev plan** and **Destroy reviewed dev plan** jobs to succeed. Section 4's empty managed-state check and instructor inventory are still mandatory; failed, skipped or uncertain cleanup leaves the activity open.

Neither route auto-approves or bypasses authentication, environment protection or independent review. Do not auto-retry a dispatch, rerun credentialled jobs, cancel an active writer or unlock its state. If dispatch status is uncertain, inspect Actions with the instructor before considering a new run.

## 3. Review this destroy plan independently

The authorized reviewer follows the controlled encrypted-review procedure in the delivery configuration document:

1. Open this run's **Summary** and identify operation `destroy`, current source SHA, module revision, intended state, and run/attempt.
2. Obtain this run's encrypted envelope from **Artifacts** and inspect it only through the approved workstation/escrow process.
3. Compare both saved-plan and manifest SHA-256 digests with the trusted summary; verify the code, toolchain, provider/module locks, inputs, identities, and backend bindings.
4. Inspect property-level changes and outputs, not only the sanitized counts. All managed changes must be within the assigned VNet/subnets/NSG/rules/associations and existing workload RG.
5. Confirm the destroy plan permits only deletes or no-ops for that workload, with no shared infrastructure, replacements, creates, or unauthorized targets.
6. Check `main` remains protected and unchanged and the plan is no more than **2 hours** old. Encrypted artifacts last **1 day**, which does not extend validity.
7. If acceptable, return to this run's pending banner → **Review deployments**, select **dev-apply**, enter the cleanup review decision, and select **Approve and deploy**. GitHub uses that button label even though the approved operation here is cleanup.

The reviewer must not be the run actor/triggering actor, PR author, or deployed code author.
A previous deploy approval, successful follow-up, issue comment, Copilot answer, or administrator bypass is not a cleanup approval.
If anything is unacceptable, leave it unapproved and involve the instructor. Changed/expired bindings require a new run and fresh independent review.
Never expose private keys, decrypted plans, raw tokens, state, plan JSON, or sensitive screenshots in a repository, PR, issue, or Chat.

## 4. Observe the real cleanup and retained-resource confirmation

1. Watch **Destroy reviewed dev plan** after the actual approval.
2. Inspect the current-main/independent-approval check and exact saved-plan verification. The workflow must not implicitly replan before mutation.
3. Wait for the job to apply that reviewed destroy plan and perform its own empty managed-workload-state verification.
4. Read the sanitized **scoped cleanup confirmed** summary. Do not pull or edit state locally to verify it yourself.
5. Ask the instructor to confirm final Azure inventory and the retained resources and owners from section 1. The workflow's empty-state check does not independently prove all retained-resource ownership.
6. If the job fails, is skipped, or reports remaining managed addresses, keep cleanup open. Never delete the resource group, state blob, or shared infrastructure as a shortcut.
7. Refresh the existing **Exercise** issue body after the actual workflow completes.

## Expected result and precise gate

AgentAlvine requires an actual completed successful delivery run in this same repository on `main`, at the current observed SHA, attempt **1**, created after course start and the preceding checkpoint.
Both **Trusted dev plan** and **Destroy reviewed dev plan** must succeed in that run. A fixture, an old run, skipped cleanup, or the follow-up plan cannot substitute.
The course discovers real job metadata itself; no manual run-ID entry, evidence PR, checkbox edit, or check command is needed.
The instructor's retained-resource confirmation remains an explicit human verification, not an inference from an offline test or empty state.

Keep these outcomes separate when describing completion:
- The workflow confirmed no remaining managed addresses in this workload's state.
- The instructor confirmed the real retained-resource inventory and ownership.
- Neither observation authorizes deleting the state container, identities, runner, or resource group later.

## Stuck? Preserve an honest pending status

Use an ordinary comment on the existing exercise, adapting the wording to the actual observation:

```markdown
Cleanup status: BLOCKED — no successful scoped cleanup is claimed.
Reason: describe only the sanitized failed gate, unavailable reviewer, or remaining workload.
Retained-resource confirmation: pending instructor inventory and ownership checks.
Next action: instructor-reviewed correction, then a new run and independent review if needed.
```

Do not cancel or unlock an active writer to clear a lease, widen roles, expose private state, or bypass review. Missing prerequisites mean halt, not weaken the workflow.
If Lab 08 is taken later, return to this **same chosen writer** for a new reviewed `v1.1.0` exact pin and `deploy` → `followup` → `destroy` cycle. The closed baseline checklist is not proof of that later revision.
If no live work was authorized, state that clearly: offline preparation is useful, but real Lab 07 completion remains pending.

**Full beginner help:** [start-here.md](../docs/start-here.md) · [git-workflow.md](../docs/git-workflow.md) · [copilot-guide.md](../docs/copilot-guide.md) · [toolchain.md](../docs/toolchain.md) · [troubleshooting.md](../docs/troubleshooting.md).
<!-- FULL-WS-LESSON:END -->

## Original Cycle A/B outcome — 2026-09-08

- **Cycle A: pending genuine prerequisite.** No authorized deployment/follow-up or independently reviewed live destroy occurred; retained-resource inventory was not claimed verified.
- **Cycle B: pending genuine prerequisite.** The fresh copy likewise stopped at **1/5**, with `WORKSHOP_AZURE_ENABLED=false` and no cloud run.
- No scoped-cleanup or empty-state success is inferred from mocks. Real cleanup and retained-resource ownership remain separate instructor-verified responsibilities.

See [simulation.md](simulation.md) for original evidence and the live-work boundary. Offline Lab 08 completion cannot complete this pending activity.

[Previous activity](activity-04.md) · [Review index](README.md)
