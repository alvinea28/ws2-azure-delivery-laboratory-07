# Laboratory 07 · Azure delivery controls and identity

**Public source template (not the clone URL after copying):** [alvinea28/ws2-azure-delivery-laboratory-07](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07) · **Recommended order:** 07 of 08 · **Time:** 45–60 minutes offline; live timing depends on instructor readiness

**Goal:** Create GitHub Actions YAML in VS Code and map identity/state offline, then follow the authorized private lifecycle: protected-main push → same-SHA validation → encrypted saved plan → automatic exact-plan apply → real configuration/update checks → followup → separately authorized cleanup. This **independent** lab supplies a complete module/snapshot; **no earlier lab or Azure account is needed for offline study**.

> [!WARNING]
> **Public templates and unapproved copies cannot deploy.** Automatic delivery is limited to the exact approved private identity in the [configuration guide](docs/delivery-configuration.md), not every repository named Lab 07. Do not edit or repin that allowlist to enable another copy. No manual deployment reviewer or second deploy button is required; protected main, strict checks, separate OIDC identities, locked state and encrypted exact plans remain mandatory. Bootstrap and cleanup require separate owner authorization.

**Setup status:** this public source describes expected controls, not private configuration observations or a completed Azure run. Keep `WORKSHOP_AZURE_ENABLED=false`; inspect settings with the owner, never invent target, budget/currency, lifetime or prerequisites. Maintenance stays on **dev**. Missing protected main means offline handoff, not creating main or changing the default while unready.

## Start here — five actions

**Windows x64:** [prepare all tools and VS Code extensions in one go](https://github.com/alvinea28/ws2-workshop-catalogue/blob/dev/docs/windows-setup.md#2-paste-this-one-command)
before cloning. Run once for all eight labs; after READY/restart, skip manual installs below.

1. **Install / account:** follow [toolchain](docs/toolchain.md) for Git, desktop VS Code, Node **24.16.0**, Terraform **1.16.1**; AzureRM **5.4.0** is pinned. GitHub newcomer: **Sign up**, verify email, sign in and accept any instructor invitation.
2. **Copy once:** use **COPY EXERCISE** below, select **Private**, and keep a unique name ending `-laboratory-07`. Already in your private copy? Do not copy again; keep its Exercise.
3. **Clone:** copy **your copy's Code → HTTPS URL**. In VS Code: **Ctrl+Shift+P → Git: Clone**, paste it, authorize the correct account in the trusted browser and choose a parent folder. macOS uses **Cmd**.
4. **Open / accounts:** **Open** the clone; trust only it. Explorer must show this repository, not its parent/ZIP. Check **Accounts → GitHub Copilot**/seat; configure local Git authorship using [illustrated setup](docs/start-here.md). Authorship, Git credentials, browser login and Copilot entitlement differ.
5. **Check:** open **Terminal → New Terminal** at this clone's root:

```powershell
node scripts/doctor.mjs
```

**Why:** `node` runs the supplied [read-only doctor](scripts/doctor.mjs), checking local tools/context—not sign-in, a seat or Azure authorization. Resolve failures before the first edit.

![Microsoft reference: cloning from GitHub in VS Code](docs/images/vscode-clone-github.png)

*REFERENCE — Microsoft, CC BY 3.0 US; not your account/repository. [Attribution](docs/images/NOTICE.md).*

<!-- AGENTALVINE:START -->
## Copy this exercise once

[![Copy exercise](.github/images/copy-exercise.svg)](https://github.com/new?template_owner=alvinea28&template_name=ws2-azure-delivery-laboratory-07&owner=%40me&name=my-ws2-azure-delivery-laboratory-07&visibility=private)

Select the intended Owner, keep **Private**, leave **Include all branches** off, and create the copy. Its own AgentAlvine issue will appear automatically.
<!-- AGENTALVINE:END -->

## Expected result / next

**Source PRs:** [inspect and merge your own PR after required checks](docs/pr-author-merge.md).
This Lab 07 policy requires zero approving PR reviews, not self-approval; scope,
budget, lifetime, bootstrap and cleanup authorizations remain separate owner decisions.

Refresh **your copy's Exercise link** and follow its current task, starting on `lab/workflow-authoring`. AgentAlvine updates the **same issue body** from real work/checks. No manual checkboxes, run IDs or evidence PRs; PR validation remains credential-free.

## Hands-on activity — create Actions, then the authorized Azure lifecycle

Do these phases in the [existing workflow-authoring guide](docs/workflow-authoring.md), starting in [Step 1](.github/steps/01.md). This is required work, not a link-only reading assignment or extra progress checkpoint.

| Phase | Your action / expected result | Stop or recover |
| --- | --- | --- |
| **Build YAML offline** | VS Code **File → New Text File → YAML**: construct header, preflight, validation, plan, automatic apply, followup/drift section by section from the [non-runnable reference](solutions/delivery.yml). Replace only the complete canonical workflow in one save while disabled | Already complete baseline ≠ your authorship; no duplicate or partial live file. Exact reconstruction may have no YAML diff |
| **Test and explain** | Complete the identity map; run Node, kit, workflow and two consumer mock checks; inspect **Actions → Workshop quality / Lab checks** at the current SHA | Fix the source, not the tests/pins. Mocks and skipped delivery are not Azure proof |
| **Owner readiness** | Inspect **Settings → Rules / Environments / Actions variables**, scoped secret names and runner access with the owner; obtain target, budget/currency, lifetime and bootstrap authorization; verify OIDC, backend/leases, runner, keys and module App | Keep false; no PR into absent main, invented values or environment-reviewer placeholder |
| **Automatic private deployment** | Once ready, author merges the checks-passing PR into protected main; inspect **Verify scoped dev deployment policy → Validate reviewed delivery revision → Trusted dev plan → Apply exact dev saved plan** in one SHA-bound run | No approvals API, reviewer wait or second deploy dispatch; only the approved private writer can proceed |
| **Verify and update** | Observe actual Azure configuration, then an owner-approved benign HCL tag update through another passing PR/main push; expect update/no replacement and the same resource IDs | The driver checks output IDs, not Azure configuration. Follow the [live verification activity](docs/workflow-authoring.md#6-hands-on-verify-configuration-and-make-a-benign-update) |
| **Converge and clean up** | Delivery **Run workflow → main → followup** must report exit **0**. A current admin separately authorizes [cleanup.yml](.github/workflows/cleanup.yml), required string `destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>`, **no operation input** | Ordinary main never cleans up. Require empty managed state plus actual inventory; retain shared RG/backend/identities/runner |

AgentAlvine only observes real metadata and updates the same Exercise body. No manual checkbox or evidence PR can award a phase or authorize Azure. The five original checkpoint meanings remain; use [Step 2](.github/steps/02.md) for timing and live readiness.

[All five activities and historical outcomes](full-ws-content/README.md) · [Source Exercise #1: read-only Preview, zero learner progress](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07/issues/1). Neither is a new learner's grade or live authorization.

**Additional hands-on:** [Defender runtime posture, Terraform remediation and cleanup](docs/defender-posture-hands-on.md). Requires the existing approved private writer and actual deploy/followup; scope/cost authorization and separately authorized full cleanup remain necessary. No execution or automatic grade is claimed.

**Recovery:** [Setup](docs/start-here.md) · [Git actions](docs/git-workflow.md) · [Troubleshooting](docs/troubleshooting.md). Instructor-directed [Azure inputs/login](docs/azure-setup.md) are optional account preparation, not provisioning permission. AVM **4.81** is separate from the **5.4.0** baseline, not live-connected.

[All eight numbered laboratories](https://github.com/alvinea28/ws2-workshop-catalogue) · [MIT code license](LICENSE) · [Screenshot licenses](docs/images/NOTICE.md)
