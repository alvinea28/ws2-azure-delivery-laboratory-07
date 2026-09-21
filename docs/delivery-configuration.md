# Delivery configuration: exact GitHub locations and gates

> [!WARNING]
> **INSTRUCTOR ONLY; PRIVATE copy; public templates inert.**
> `WORKSHOP_AZURE_ENABLED=false` pending [independent authorization](instructor-preflight.md#6-keep-the-enablement-decision-honest).
> No authoring Azure/identity/state/subscription/live-configuration operations.

**Setup:** [start-here.md](start-here.md) · [azure-setup.md](azure-setup.md) · [troubleshooting.md](troubleshooting.md)

## 1. Find repository settings, not account settings

Assigned owner/**Private** badge → repository **Settings** (or **…**), not account.
No access → administrator.

![GitHub reference highlighting the repository Settings tab](images/github-settings.webp)

*Unmodified GitHub reference, CC BY 4.0; not proof. [Attribution](images/NOTICE.md).*

## 2. Establish the private copy's default and protected main

While disabled: **Code → branch selector → View all branches → New branch** creates
missing `main` from reviewed baseline. **Settings → General → Default branch → main
→ Update**; verify **Code**. Template maintenance: `dev`.

**Settings → Branches → Add classic branch protection rule → main**
(or equivalent active organization **Rules → Rulesets**):

| Do | Why | Expected |
| --- | --- | --- |
| Require PR + ≥1 nonauthor approval; dismiss stale approvals; approve most recent reviewable push | Fresh review | No direct pushes |
| **Test learner module** (**Lab checks**), **kit** (**Workshop quality**); up-to-date branches; conversation resolution | Current checks | Select available contexts; fix failures, never drop gates |
| **Do not allow bypassing the above settings**; force pushes/deletions **off** | Protect history | No administrator/actor bypass |

PR checks: **no Azure/OIDC/App credentials/backend/state**, never live jobs.
Instructor reviews workflows/scripts/provenance/security; **Code Owners** requires
verified routing/support.

Both required check workflows run the [workflow-authoring checker](../scripts/check-workflow.mjs).
Require [construction of the one canonical delivery workflow](workflow-authoring.md)
while disabled; its [complete reference](../solutions/delivery.yml) is outside the live
workflow directory. Unknown or changed companion workflows fail closed, even if they
look harmless. A legitimate control update needs reviewed code/reference pins, not
a learner bypass. Markdown explanations are not part of those control fingerprints.

## 3. Review changes into protected main

[Git route](git-workflow.md) → **Pull requests → New pull request**: **base: main**,
**compare: task branch**. Instructor/nonauthor: **Files changed** (pin/snapshot/provider
lock/controls) + current **Checks**. Deployment SHA must match protected merged-main PR,
not bootstrap.

![GitHub reference showing the pull request Files changed tab](images/github-pr-files.webp)

*GitHub reference, CC BY 4.0; not approval. [Attribution](images/NOTICE.md).*

**Enabled main push = deploy**, not plan-only. PR review never replaces independent
[saved-plan approval](plan-review.md). **Solo education in 01/05 never permits live 07 self-approval.**

The **same run** performs hosted preflight and exact-SHA credential-free validation
before privileged planning, then waits for independent `dev-apply` approval and
applies that saved plan. No second deploy dispatch; only followup/destroy are manual.
Never count a disabled/template/branch-skipped run as live completion.

## 4. Create and protect both environments before any workflow use

**Settings → Environments → New environment → Configure environment**: `dev-plan`, `dev-apply`.

| Do | Why | Expected |
| --- | --- | --- |
| Deployment branches and tags → Selected branches and tags → Add rule → **Branch: main** | Trusted code | One custom rule; no tags/wildcards/extras |
| Required reviewers → independent human/team; **Prevent self-review** on; administrator bypass off → Save protection rules | Independent decisions | Both environments; reopen/verify |

Unrestricted/**Protected branches only** fails. Code checks both branch policies,
but reviewer/self-review/bypass only for `dev-apply`; instructor separately verifies
all three review settings for `dev-plan`.
Missing features/APIs → **BLOCKED**.

## 5. Repository variables: the Variables tab, not Secrets

**Settings → Secrets and variables → Actions → Variables → New repository variable
→ Name → Value → Add variable**. Instructor-approved values; no account/backend
values here or divergent environment overrides.

| Name | Why / required value |
| --- | --- |
| `WORKSHOP_AZURE_ENABLED` | `false`; instructor-only |
| `WS2_STATE_LOCK_ID` | Stable writer: 3–80 letters/digits/hyphens |
| `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | Approved sandbox |
| `AZURE_PLAN_CLIENT_ID`, `AZURE_APPLY_CLIENT_ID` | Separate OIDC; RG Reader / RG-only Contributor |
| `STATE_STORAGE_ACCOUNT`, `STATE_CONTAINER`, `STATE_KEY` | Existing private backend; key suffix `.tfstate`; default workspace |
| `WORKLOAD_RG` | Existing assigned RG |
| `WORKLOAD_INPUTS_JSON` | Exactly `name`, `resource_group_name`, `location`, `address_space`, `subnets`, `tags`; RG = `WORKLOAD_RG`; tags `environment=dev`, `workshop=ws2` |
| `MODULE_APP_CLIENT_ID` | GitHub App: pinned-source Contents-read |
| `PLAN_ENCRYPTION_PUBLIC_KEY` | RSA public key, **≥3072 bits** |

Instructor updates reviewed settings **before new runs**, never during review.

## 6. Environment secrets: a different settings page

**Settings → Environments → exact environment → Environment secrets → Add secret**.
Custodian: trusted UI entry; verify names/scopes, never expose values.

| Environment | Secret | Restriction |
| --- | --- | --- |
| `dev-plan`, `dev-apply` | `MODULE_APP_PRIVATE_KEY` | Same App; fresh short-lived read token |
| `dev-apply` **only** | `PLAN_DECRYPTION_PRIVATE_KEY` | After independent approval; never planning |

Private keys: never repository/inherited organization secrets, PRs/caches/Git/issues/
terminal input/Copilot; separate approved human escrow for [review](plan-review.md#4-review-the-encrypted-artifact-on-an-approved-human-workstation).
AES-256-GCM + RSA-OAEP/SHA-256; **2-hour validity / 1-day retention**—retention cannot extend validity.
App transport required even for public source.

## 7. Restrict runner access by exact workflow, not by label

**Organization → Settings → Actions → Runner groups → instructor group**:
**Repository access → Selected repositories**: private writer only, public off.
**Workflow access → Selected workflows**: substitute approved copy:

```text
APPROVED-OWNER/PRIVATE-COPY/.github/workflows/delivery.yml@refs/heads/main
```

**Why:** policy value, not command; exact workflow/protected `main` only.
`ws2-trusted` is a selector, **not access control**.

| Do | Why | Expected |
| --- | --- | --- |
| Save; verify ephemeral Linux x64, `self-hosted`, `linux`, `x64`, `ws2-trusted` | Isolation | Cleanup, no ambient identity; PRs/other workflows/tags/branches blocked—no hostile cloud probes |
| Read-only default Actions permissions; SHA-pinned actions | Least privilege | No PR secrets/blanket write tokens |

Missing selected-workflow access/gates → **BLOCKED**, [escalate](instructor-preflight.md), never broaden.
Mandatory [full cleanup](recovery.md#8-close-only-what-was-actually-verified): retain shared RG/backend/identities/roles/runner.

## Source attribution and next checks

[Delivery](../.github/workflows/delivery.yml), [approval](../scripts/approval.cjs),
[policy](../scripts/plan-policy.mjs), [learner](../.github/workflows/lab-checks.yml), [quality](../.github/workflows/quality.yml).
GitHub: [default branch](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/changing-the-default-branch),
[protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule),
[environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments),
[runner groups](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access).
Retain image [licenses/sources](images/NOTICE.md) and [manifest](images/manifest.json).
