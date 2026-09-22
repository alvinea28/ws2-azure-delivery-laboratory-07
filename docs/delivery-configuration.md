# Delivery configuration: exact GitHub locations and gates

> [!WARNING]
> **INSTRUCTOR ONLY; PRIVATE copy; public templates inert.**
> `WORKSHOP_AZURE_ENABLED=false` pending [owner scope/bootstrap authorization and real readiness](instructor-preflight.md#6-keep-the-enablement-decision-honest).
> Authoring and PR validation remain credential-free. Bootstrap changes require
> explicit owner authorization; missing readiness never permits enabling delivery.

**Setup:** [start-here.md](start-here.md) · [azure-setup.md](azure-setup.md) · [troubleshooting.md](troubleshooting.md)

**Exact scope:** private non-template **alvine-aurelio-org/ws2-sim-20260921-azure-delivery-laboratory-07**,
immutable repository ID **1379149907**. Wrong IDs/names, public repositories and
templates fail. Public source-template maintenance remains inert on dev.
New private copies are offline-only; do not edit or repin the repository allowlist
to enable another copy. A private badge or matching name is not authorization.

## Setup status — public source

This public guide describes **expected configuration, not observed private settings**.
It contains no private environment IDs, settings-readback timestamps or live-run
claims. Keep enablement false and the offline default dev. The authorized owner
must supply and verify target subscription/RG, region/ranges, budget/currency,
lifetime, explicit bootstrap authorization, OIDC, backend/leases, trusted runner,
encryption keys and module App transport before any live work. Never invent them.
No Azure readiness, deployment, configuration update or cleanup is claimed here.

The read-only workflow token cannot see GitHub's ruleset bypass list. The helper
binds the approved ruleset to an owner/admin-verified server-issued `updated_at`
revision with **zero bypass actors**; fresh stored and effective rules are still
checked. Missing/changed revision fails closed. A hidden list is not assumed empty;
never grant ruleset-write permission or update a pin simply to pass. Any actual
settings change needs a fresh owner/admin readback and reviewed revision binding,
not a new repository allowlist entry. See [GitHub's response visibility contract](https://docs.github.com/en/rest/repos/rules#get-a-repository-ruleset).

## 1. Find repository settings, not account settings

Assigned owner/**Private** badge → repository **Settings** (or **…**), not account.
No access → administrator.

![GitHub reference highlighting the repository Settings tab](images/github-settings.webp)

*Unmodified GitHub reference, CC BY 4.0; not proof. [Attribution](images/NOTICE.md).*

## 2. Establish the private copy's default and protected main

Do not open a PR into nonexistent main or create it while unready. Only after
reviewing the baseline and readiness does the authorized owner establish protected
main **while delivery remains disabled**. The ruleset alone does not create it.
GitHub schedules use the default branch, normally **dev** for offline work. Live
drift needs a deliberate owner decision to make protected main the default **when
ready**; there is no automatic default-branch change. Template maintenance stays on dev.

**Settings → Rules → Rulesets**: use the Lab 07
[author-merge ruleset](pr-author-merge.md) for `refs/heads/main`.
Committing its JSON is not installation; an authorized administrator must apply it.

| Do | Why | Expected |
| --- | --- | --- |
| Require PR; **0 required approving reviews**; Code Owner review and last-push approval off | Author inspects and merges after checks | No second PR reviewer or self-approval; no direct updates |
| **Test learner module** (**Lab checks**), **kit** (**Workshop quality**); up-to-date branches; conversation resolution | Current checks | Select available contexts; fix failures, never drop gates |
| **Do not allow bypassing the above settings**; force pushes/deletions **off** | Protect history | No administrator/actor bypass |

PR checks: **no Azure/OIDC/App credentials/backend/state**, never live jobs.
The author inspects workflows/scripts/provenance/security. No Code Owner PR
approval is required by this lab's source rule; an inherited organizational rule
must still be respected and cannot be silently removed. For this exact scoped path,
there is **no manual deployment reviewer**, not an exemption from the remaining controls.

Both required check workflows run the [workflow-authoring checker](../scripts/check-workflow.mjs).
Require [construction of the one canonical delivery workflow](workflow-authoring.md)
while disabled; its [complete reference](../solutions/delivery.yml) is outside the live
workflow directory. Unknown or changed companion workflows fail closed, even if they
look harmless. A legitimate control update needs reviewed code/reference pins, not
a learner bypass. Markdown explanations are not part of those control fingerprints.

## 3. Review changes into protected main

[Git route](git-workflow.md) → **Pull requests → New pull request**: **base: main**,
**compare: task branch**, **only after that protected branch exists and the owner
has authorized the intended ready scope**. Author: **Files changed** (pin/snapshot/provider
lock/controls) + current **Checks**; resolve conversations and merge with the same
account after the enforced checks pass. Deployment SHA must match protected merged-main PR,
not bootstrap.

![GitHub reference showing the pull request Files changed tab](images/github-pr-files.webp)

*GitHub reference, CC BY 4.0; not approval. [Attribution](images/NOTICE.md).*

**Enabled main push = automatic exact-plan deploy**, not plan-only. The author may
merge their own passing PR; zero approving reviews is not fabricated self-approval.
[Saved-plan integrity and scoped authorization](plan-review.md) remain mandatory.

The **same run** performs hosted preflight and exact-SHA credential-free validation
before privileged planning, saves/encrypts the plan, then automatically runs
**Apply exact dev saved plan**. No reviewer wait or second deploy dispatch. Delivery
dispatch offers **followup only**; [cleanup](../.github/workflows/cleanup.yml) is separate.
Never count a disabled/template/branch-skipped run as live completion.

## 4. Create and protect both environments before any workflow use

**Settings → Environments → New environment → Configure environment**: `dev-plan`, `dev-apply`.

| Do | Why | Expected |
| --- | --- | --- |
| Deployment branches and tags → Selected branches and tags → Add rule → **Branch: main** | Trusted code | One custom rule; no tags/wildcards/extras |
| Required reviewers → **none**; administrator bypass **off** → Save protection rules | Approved automatic path, not self-approval | Both environments; reopen/verify |

Unrestricted/**Protected branches only** fails. Code checks both environments for
exact main-only policies, no Required reviewers and no admin bypass. The historical
[approval.cjs](../scripts/approval.cjs) delegates to
[deployment-authorization.cjs](../scripts/deployment-authorization.cjs): fresh exact
private identity, live rules, current main/run/SHA/attempt, actual merged PR and
same-run validation/plan checks. It does **not** use the approvals API.
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
| `dev-apply` **only** | `PLAN_DECRYPTION_PRIVATE_KEY` | After scoped authorization; never planning |

Private keys: never repository/inherited organization secrets, PRs/caches/Git/issues/
terminal input/Copilot; any owner inspection/recovery escrow follows the approved
private process, not a deployment reviewer gate. See [saved-plan handling](plan-review.md).
AES-256-GCM + RSA-OAEP/SHA-256; **2-hour validity / 1-day retention**—retention cannot extend validity.
App transport required even for public source.

## 7. Restrict runner access by exact workflow, not by label

**Organization → Settings → Actions → Runner groups → instructor group**:
**Repository access → Selected repositories**: private writer only, public off.
**Workflow access → Selected workflows**: restrict to exactly these two paths:

```text
alvine-aurelio-org/ws2-sim-20260921-azure-delivery-laboratory-07/.github/workflows/delivery.yml@refs/heads/main
alvine-aurelio-org/ws2-sim-20260921-azure-delivery-laboratory-07/.github/workflows/cleanup.yml@refs/heads/main
```

**Why:** policy value, not command; exact workflow/protected `main` only.
`ws2-trusted` is a selector, **not access control**.

| Do | Why | Expected |
| --- | --- | --- |
| Save; verify ephemeral Linux x64, `self-hosted`, `linux`, `x64`, `ws2-trusted` | Isolation | Cleanup, no ambient identity; PRs/other workflows/tags/branches blocked—no hostile cloud probes |
| Read-only default Actions permissions; SHA-pinned actions | Least privilege | No PR secrets/blanket write tokens |

Missing selected-workflow access/gates → **BLOCKED**, [escalate](instructor-preflight.md), never broaden.
Mandatory [full cleanup](recovery.md#8-close-only-what-was-actually-verified): retain shared RG/backend/identities/roles/runner.

## 8. Separate explicit cleanup authorization

The installed [cleanup.yml](../.github/workflows/cleanup.yml) has a matching
[non-runnable reference](../solutions/cleanup.yml). It accepts **workflow_dispatch
only**, with required **string** `authorization`, **no operation input**:
`destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>`.

An authenticated **current repository admin** explicitly authorizes owned-scope
full cleanup and dispatches it on main. The helper checks current admin permission,
matching actor/sender/trigger IDs, current SHA/state and successful same-run validation
and exact destroy planning. **Apply exact authorized dev destroy plan** consumes
those saved bytes; no independent cleanup reviewer is required. Use the same
state, concurrency, environments and OIDC identities. Main pushes never clean up;
destroy/replacements on regular pushes fail. No shared RG/backend/identity/runner removal.

Scope, region, budget, lifetime and explicit bootstrap authorization must be real
before enablement; cleanup authorization is a separate owner decision. Instructions,
local tests and AgentAlvine's educational progress are not Azure authorization.
Follow [Step 5](../.github/steps/05.md) only after readiness and authorization, not now.

## Source attribution and next checks

[Delivery](../.github/workflows/delivery.yml), [approval](../scripts/approval.cjs),
[policy](../scripts/plan-policy.mjs), [learner](../.github/workflows/lab-checks.yml), [quality](../.github/workflows/quality.yml).
GitHub: [default branch](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/changing-the-default-branch),
[protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule),
[environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments),
[runner groups](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access).
Retain image [licenses/sources](images/NOTICE.md) and [manifest](images/manifest.json).
