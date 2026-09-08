# Delivery configuration: exact GitHub locations and gates

> [!WARNING]
> **INSTRUCTOR ONLY — reference, not participant authorization.** Configure a
> separately approved **PRIVATE** copy, never the public template. All live work
> remains unexecuted during authoring. Keep `WORKSHOP_AZURE_ENABLED=false` until
> the instructor's real dry-run/enablement decision; see the bootstrap constraint
> in [instructor-preflight.md](instructor-preflight.md). No Copilot Azure or state operations.

**First-time setup:** [start-here.md](start-here.md) · **Help:** [troubleshooting.md](troubleshooting.md)

## 1. Find repository settings, not account settings

1. Open the assigned copy in GitHub and confirm its **Private** badge and owner.
2. Select **Settings** in the repository navigation; use **…** if the tab is hidden.
3. Confirm the sidebar contains **General**, **Branches**, **Environments**, and **Secrets and variables**.
4. If settings are missing or read-only, stop and ask the repository/organization administrator.

![GitHub reference highlighting the repository Settings tab](images/github-settings.webp)

*REFERENCE — GitHub navigation example, CC BY 4.0; not this copy's configuration
and not an Azure screenshot. [images/NOTICE.md](images/NOTICE.md).*

The public source is
[alvinea28/ws2-azure-delivery-laboratory-07](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07).
It remains an inert template on its maintenance branch. Its complete module and
offline snapshot make this lab independent; do not configure another lab first.

## 2. Establish the private copy's default and protected main

1. While delivery is disabled, have the instructor select the reviewed baseline for `main`.
2. If `main` is absent, the instructor uses **Code → branch selector → View all branches → New branch**, selecting that baseline as its source.
3. Open **Settings → General → Default branch**; select the switch-default-branch control.
4. Choose `main`, select **Update**, and read/confirm GitHub's warning.
5. Return to **Code** and verify the selected default is `main`. Keep source-template maintenance on `dev`.
6. Open **Settings → Branches → Add classic branch protection rule** and enter the exact pattern `main`.
7. If an organization uses **Settings → Rules → Rulesets**, have its administrator enforce the equivalent active `main` policy instead; verify GitHub reports the branch protected.

Changing the default requires an existing branch and appropriate administrator
rights. Do not rename every branch or bypass an organization ruleset. Creating
`main` is bootstrap only; the eventual deployment commit must come from a merged
PR targeting `main`, not a direct push or an unreviewed bootstrap commit.

| Protection to enable | Expected result |
| --- | --- |
| **Require a pull request before merging → Require approvals** | At least one eligible nonauthor reviews the latest change |
| **Dismiss stale pull request approvals when new commits are pushed** | An earlier approval does not cover new code |
| **Require approval of the most recent reviewable push** | The latest pusher cannot be their own final reviewer |
| **Require status checks to pass before merging** | Select actual **Test learner module** and **kit** checks after they have appeared |
| **Require branches to be up to date before merging** | Required checks cover the current base, not an obsolete comparison |
| **Require conversation resolution before merging** | Unresolved review requests block merging |
| **Do not allow bypassing the above settings** | Administrators also follow the policy; no actor bypass list |
| Leave **Allow force pushes** and **Allow deletions** off | Protected history is neither overwritten nor removed |

**Lab checks** is the workflow containing **Test learner module**; **Workshop
quality** contains **kit**. Select the observed check contexts, not invented names.
Do not require live delivery jobs as PR checks: PR validation has no Azure/OIDC,
App credentials, remote backend, or state. Fix red checks; never remove them.

Require instructor review for workflows, scripts, dependency provenance, and
security-sensitive inputs. If using **Require review from Code Owners**, first
establish valid ownership routing in the private copy through authorized review;
do not assume this package already supplies it.

## 3. Review changes into protected main

1. In VS Code use [git-workflow.md](git-workflow.md): branch, edit, save, inspect, stage, commit, and push.
2. In the private copy choose **Pull requests → New pull request**; set **base: main** and the intended task branch as **compare**.
3. Open **Files changed**. A nonauthor/instructor reviews the real diff, source pin, snapshot, provider lock, and workflow controls.
4. Open **Checks**, verify the current-head results, then use **Review changes** for a genuine human review.
5. Merge only through the protected PR route. Confirm the resulting current `main` commit is associated with that merged PR.

![GitHub reference showing the pull request Files changed tab](images/github-pr-files.webp)

*REFERENCE — unmodified GitHub example, CC BY 4.0; not a completed workshop review.
[images/NOTICE.md](images/NOTICE.md).*

**Important:** when enabled, a push to `main` means **deploy**, not plan-only.
The apply gate is still required. A PR review never substitutes for approval of
that run's saved plan; its approver must also be independent of the run initiator.

## 4. Create and protect both environments before any workflow use

1. Open **Settings → Environments → New environment**.
2. Enter exactly `dev-plan`, select **Configure environment**, and complete its rules below.
3. Repeat **New environment** for exactly `dev-apply`; do not rename either to a display label.
4. In each environment select **Deployment branches and tags → Selected branches and tags**.
5. Select **Add deployment branch or tag rule → Ref type: Branch**, enter `main`, then **Add rule**.
6. Ensure the list has **one rule only: branch main**. Remove extra rules through the approved administrator process.
7. For the instructor-controlled setup, select **Required reviewers** and the approved independent human/team for each environment.
8. Select **Prevent self-review**. Deselect **Allow administrators to bypass configured protection rules**.
9. Select **Save protection rules**, leave the page, reopen it, and verify the saved settings.

Do not use **No restriction**, **Protected branches only**, `main*`, a tag named
`main`, or multiple rules. The code requires an explicit custom branch policy.
Plan-environment approval permits planning/state access; apply-environment approval
must follow review of the actual saved plan. One is not approval of the other.

**Implementation distinction:** the supplied policy verifies main-only rules for
both environments, but asserts reviewers/self-review/admin-bypass settings only
for `dev-apply`. The additional `dev-plan` review configuration above must be
verified by the instructor; do not claim the script tests it. Missing private-plan
features or inaccessible protection APIs are stop conditions, not bypass reasons.

## 5. Repository variables: the Variables tab, not Secrets

Open **Settings → Secrets and variables → Actions → Variables → New repository
variable**. Use each exact **Name** below. The instructor supplies approved data
privately in **Value**, then selects **Add variable**. No values are supplied here.
Keep common settings at repository scope; avoid environment-variable overrides
that would make plan and apply see different identity/state/input values.

| Exact repository variable | Purpose / approved source |
| --- | --- |
| `WORKSHOP_AZURE_ENABLED` | Keep `false`; not a learner toggle or proof of readiness |
| `WS2_STATE_LOCK_ID` | One stable 3–80-character letters/digits/hyphen identifier per dev state and writer |
| `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | Instructor-approved sandbox mapping; not account sign-in instructions |
| `AZURE_PLAN_CLIENT_ID` | Plan identity, distinct from apply; workload Reader |
| `AZURE_APPLY_CLIENT_ID` | Apply identity; Contributor only on the workload RG |
| `STATE_STORAGE_ACCOUNT`, `STATE_CONTAINER`, `STATE_KEY` | Existing private backend tuple; explicit key ends in `.tfstate`; no named workspaces |
| `WORKLOAD_RG` | Existing assigned workload resource group |
| `WORKLOAD_INPUTS_JSON` | Exactly `name`, `resource_group_name`, `location`, `address_space`, `subnets`, `tags`; RG must match `WORKLOAD_RG`; tags include `environment=dev`, `workshop=ws2` |
| `MODULE_APP_CLIENT_ID` | Approved GitHub App for read-only access to the pinned public source repository |
| `PLAN_ENCRYPTION_PUBLIC_KEY` | Approved RSA public key, at least 3072 bits; not its private counterpart |

Propose non-secret input changes in a reviewed code/task record. The instructor
updates approved settings before a **new** run, never silently during plan review.
Do not publish the actual tenant, client, backend, or workload values in this guide.

## 6. Environment secrets: a different settings page

Open **Settings → Environments → the exact environment → Environment secrets →
Add secret**. The authorized custodian enters the secret directly in GitHub's
trusted UI. Do not request it through Copilot, paste it into a terminal, or save it
in a Markdown file. Confirm the **name and scope**, never reveal the value.

| Environment | Exact secret name | Restriction |
| --- | --- | --- |
| `dev-plan` | `MODULE_APP_PRIVATE_KEY` | GitHub App read transport only |
| `dev-apply` | `MODULE_APP_PRIVATE_KEY` | Same approved App; fresh short-lived installation token |
| `dev-apply` **only** | `PLAN_DECRYPTION_PRIVATE_KEY` | Saved-plan decryption after independent approval; never in `dev-plan` |

No private key belongs in repository secrets, organization-wide inherited secrets,
PR jobs, caches, Git, or issue attachments. Authorized human reviewer escrow is
separate from Actions. See [plan-review.md](plan-review.md) for encrypted review.
Public module access does **not** remove the App requirement in the shipped code.

## 7. Restrict runner access by exact workflow, not by label

1. Open the owning **organization → Settings → Actions → Runner groups**; this is not repository Settings.
2. Select the instructor-managed group; set **Repository access → Selected repositories** to the one private writer copy.
3. Leave public-repository access disallowed.
4. Set **Workflow access → Selected workflows** and enter the exact approved copy's delivery workflow pinned to `refs/heads/main`.
5. The policy entry has this structure; replace only the owner/copy placeholders with the authorized private copy:

```text
APPROVED-OWNER/PRIVATE-COPY/.github/workflows/delivery.yml@refs/heads/main
```

6. Save the group. The instructor confirms its ephemeral Linux x64 runners carry `self-hosted`, `linux`, `x64`, and `ws2-trusted` selectors.
7. Prove PR workflows, other workflow paths, tags, and alternate branches cannot select that privileged group; do not dispatch hostile cloud code as a test.

The `ws2-trusted` label selects a runner; it is **not a security boundary**.
An unrestricted repository runner with the same label is not equivalent. Missing
selected-workflow support means live delivery stays blocked. Also retain default
read-only Actions permissions and the supplied SHA-pinned action restrictions;
do not enable PR secret forwarding or blanket write-token permissions.

## Source attribution and next checks

Exact contracts: [../.github/workflows/delivery.yml](../.github/workflows/delivery.yml),
[../scripts/approval.cjs](../scripts/approval.cjs), [../scripts/plan-policy.mjs](../scripts/plan-policy.mjs),
[../.github/workflows/lab-checks.yml](../.github/workflows/lab-checks.yml), and [../.github/workflows/quality.yml](../.github/workflows/quality.yml).
Navigation references: [default branch](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/changing-the-default-branch),
[branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule),
[environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments), and
[selected-workflow runner groups](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access).
Original workshop explanation; image provenance: [images/NOTICE.md](images/NOTICE.md).
