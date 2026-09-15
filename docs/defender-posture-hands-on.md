# Lab 07 · Defender posture: inspect, remediate and clean up

**Goal:** Apply the [Microsoft IaC DevSecOps flow](https://learn.microsoft.com/en-us/azure/architecture/solution-ideas/articles/devsecops-infrastructure-as-code) to actual deployed posture. **Terraform AVM remains primary**, but the parent workspace's isolated AVM profile is **not an automatic replacement** for this AzureRM **5.4.0** baseline or another state writer. Microsoft Sentinel is excluded.

> **Unexecuted instructions:** documentation, mocks and AgentAlvine progress authorize no cloud operations. Public templates remain inert; protected live Azure controls stay in policy.

## 1. Do — confirm an eligible live baseline

Use the **existing approved private Lab 07 writer**, not another copy. Finish [setup](start-here.md) and [own Azure inputs](azure-setup.md). Confirm [preflight](instructor-preflight.md) and [live controls](../.github/steps/02.md): current protected `main`, distinct identities, private backend, restricted runner and independent encrypted-plan review. Missing readiness means **BLOCKED**, not learner enablement.

Require actual eligible [deploy](../.github/steps/03.md) and separate [followup](../.github/steps/04.md) runs for the applicable revision—not historical/mock/skipped proof. Confirm Defender onboarding, exact assigned RG, read access and approved region. Applications require their own region/permissions; a VNet supplies neither. **No paid Defender plans without explicit cost consent.**

**Why/Expected:** a real approved workload. **Fix:** instructor resolves access/region/readiness; no role expansion or substitute deployment.

## 2. Do — inspect the exact workload

In **Defender for Cloud → Inventory**, filter approved subscription, **exact resource group** and resource name/type. Compare VNet/NSG/subnets with actual Azure RG inventory; exclude shared resources.

Open **Recommendations** with the same scope filters. Select an actual finding; verify **Affected resources** matches your workload. Inspect status, severity, assessment time, affected properties and remediation. Record sanitized observations privately.

**Why:** DevOps findings assess repository code; runtime posture assesses deployed resources. **Expected/Fix:** UI processing/finding availability varies; missing findings mean observation only, not completed remediation. Check scope/coverage. A VNet alone **does not guarantee threat alerts**; zero alerts **do not prove monitoring**. Never simulate threats or open inbound internet.

## 3. Do — remediate through the same Terraform writer

Choose an instructor-approved finding within workload ownership. Map its property to the [dev caller](../environments/dev/main.tf) and [input contract](../environments/dev/variables.tf). Correct Terraform on a controlled task branch: [inspect diff, commit/push](git-workflow.md), credential-free checks, reviewed PR to protected `main`. Module changes need approved release/pin/snapshot review; editing the vendor copy cannot update the pinned source.

**Why/Expected:** reproducible repair through the **same writer/root/state**. Use Step 3 for a **new deploy**: fresh plan → independent exact-plan review → apply; Step 4 for a **new followup**, current applicable SHA, attempt **1**. [Plan review](plan-review.md) explains bindings. Never reuse plans, self-approve or rerun credentialled jobs.

**Fix:** if remediation exceeds baseline/ownership/policy, stop. Do not substitute AVM roots, edit controls or use portal **Quick fix** to create drift.

## 4. Do — verify the result, not an expectation

Inspect successful apply and **Confirm no-change** jobs, the deployed property, and the same recommendation/resource after reassessment.

**Expected/Fix:** observe before/after timestamps/status; Terraform success does not prove Defender refreshed. Pending stays pending; investigate persistent findings rather than dismissing them. Keep private source/run URLs, SHAs, observations and blockers as a **manual activity record, not an AgentAlvine grader claim**. Never publish actual IDs, secrets, raw state or sensitive screenshots.

## 5. Cleanup — mandatory after live work

Follow [Step 5's browser route or explained CLI alternative](../.github/steps/05.md). Request a **new full destroy** at current applicable protected-main SHA, attempt **1**, same writer/root/state: fresh encrypted plan and **separate independent approval**. No targets, broad RG deletion or state editing.

Require successful plan/destroy jobs and **empty managed-state proof plus real Azure inventory**, including retained owners. Dispatch or stale Defender Inventory is not deletion proof.

Remove only authorized **dedicated lab security resources exclusively created for this activity**. Preserve shared backend/container, RG, identities, runner and **original Defender settings**; never disable subscription Defender.

**Expected/Fix:** confirm workload removal; failed/skipped/uncertain cleanup stays open with the instructor.
