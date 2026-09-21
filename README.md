# Laboratory 07 · Azure delivery controls and identity

**Public source template (not the clone URL after copying):** [alvinea28/ws2-azure-delivery-laboratory-07](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07) · **Recommended order:** 07 of 08 · **Time:** 45–60 minutes offline; live timing depends on instructor readiness

**Goal:** Construct the one protected delivery workflow and map identity/state offline, then follow main push → validation → plan → independent review → same-run apply → followup → destroy. A complete module/snapshot is supplied; **no earlier lab or Azure account is needed for offline study**.

> [!WARNING]
> **Public templates remain inert. Live Lab 07 is not solo:** one approved private writer, protected current `main` and independent reviewers remain mandatory. [All live safeguards](.github/steps/02.md) still apply. Missing readiness means **BLOCKED**, not self-approval. After actual provisioning, [full reviewed cleanup](.github/steps/05.md) is mandatory; retain shared RG/backend/identities/runner.

## Start here — five actions

**Windows x64:** [prepare all tools and VS Code extensions in one go](https://github.com/alvinea28/ws2-workshop-catalogue/blob/dev/docs/windows-setup.md#2-paste-this-one-command)
before cloning. Run once for all eight labs; after READY/restart, skip manual installs below.

1. **Install / account:** follow [toolchain](docs/toolchain.md) for Git, desktop VS Code, Node **24.16.0**, Terraform **1.16.1**; AzureRM **5.4.0** is pinned. GitHub newcomer: **Sign up**, verify email, sign in and accept any instructor invitation.
2. **Copy once:** use **COPY EXERCISE** below; keep a unique name ending `-laboratory-07`. Already in your private copy? Do not copy again; keep its Exercise.
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

Refresh **your copy's Exercise link** and follow its current task, starting on `lab/workflow-authoring`. AgentAlvine updates the **same issue body** from real work/checks. No manual checkboxes, run IDs or evidence PRs; PR validation remains credential-free.

**Required core tutorial:** [Construct the single delivery workflow](docs/workflow-authoring.md) during Step 1, with `WORKSHOP_AZURE_ENABLED=false`. The installed workflow is already complete; [solutions/delivery.yml](solutions/delivery.yml) is its non-runnable teaching reference. Reconstruct the canonical file, never a duplicate, then run `npm run workflow:check`. Step 2 observes an authorized **main push**, not another deploy dispatch; only followup/destroy are manual.

[All five activities and historical outcomes](full-ws-content/README.md) · [Source Exercise #1: read-only Preview, zero learner progress](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07/issues/1). Neither is a new learner's grade or live authorization.

**Additional hands-on:** [Defender runtime posture, Terraform remediation and cleanup](docs/defender-posture-hands-on.md). Requires the existing approved private writer and actual deploy/followup; independent approvals and mandatory full cleanup remain unchanged. No execution or automatic grade is claimed.

**Recovery:** [Setup](docs/start-here.md) · [Git actions](docs/git-workflow.md) · [Troubleshooting](docs/troubleshooting.md). Instructor-directed [Azure inputs/login](docs/azure-setup.md) are optional account preparation, not provisioning permission. AVM **4.81** is separate from the **5.4.0** baseline, not live-connected.

[All eight numbered laboratories](https://github.com/alvinea28/ws2-workshop-catalogue) · [MIT code license](LICENSE) · [Screenshot licenses](docs/images/NOTICE.md)
