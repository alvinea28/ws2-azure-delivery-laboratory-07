# Lab 07 · Activity 01 — Construct Actions and map identity/state offline

[Review index](README.md) · [Setup](00-start-here.md) · [Next activity](activity-02.md) · [Simulation evidence](simulation.md)

> [!NOTE]
> **Review copy, not a second progress tracker.** The complete canonical lesson follows. Learners follow the live **Exercise issue in their own private copy**, opened from that copy's README; AgentAlvine updates the same issue body. The public source preview awards no learner progress. Reading later live lessons grants no Azure authorization.

<!-- FULL-WS-LESSON:START -->
# Lab 07 · Step 1 — Construct Actions and map identity/state offline

**Goal:** Construct one complete Actions workflow and map identity/state offline.

No earlier lab or Azure account is needed. Keep `WORKSHOP_AZURE_ENABLED=false`: no Azure login, live backend/state, or local apply/destroy.

### 1. Prepare your own clone

1. Use [official installers](../docs/toolchain.md): Git, desktop VS Code, Node **24.16.0**, Terraform **1.16.1**, actionlint **1.7.12**; AzureRM **5.4.0** stays pinned. Create/verify your GitHub account, accept invitation/SSO; select **Accounts → GitHub/Copilot**, verify your seat and **Manage Extension Account Preferences**.
2. **Reuse your existing private copy.** Otherwise open the [source](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07) → **Use this template → Create a new repository**: intended **Owner**, unique `-laboratory-07` name, **Private**, **Include all branches** off.
3. Your copy's **Code → HTTPS** → VS Code **Ctrl+Shift+P → Git: Clone** → paste URL → parent folder → **Open**. Trust only this clone; **Explorer** must show the lab root. macOS uses **Cmd**. [Set local authorship](../docs/start-here.md#set-authorship-only-for-this-repository); it is not authentication.
4. From the actual default branch, normally `dev`, use **Git: Create Branch → lab/workflow-authoring**; reuse existing work, never reset it. At the clone root, **Terminal → New Terminal**:

```powershell
node --version
terraform version
node scripts/doctor.mjs
```

![VS Code reference: account selection](../docs/images/vscode-accounts.png)

*REFERENCE — Microsoft, CC BY 3.0 US; not account/seat proof. [Attribution](../docs/images/NOTICE.md).*

### 2. Complete the identity map

Edit [exercise/identity-map.md](../exercise/identity-map.md); remove `TODO`, not existing work. No secrets or real IDs:

```markdown
# Identity and state map
- AZURE_PLAN_CLIENT_ID: distinct Reader identity at the assigned workload RG.
- AZURE_APPLY_CLIENT_ID: distinct Contributor identity at that same RG.
- Both need Storage Blob Data Contributor at the assigned state container for a lease.
- STATE_CONTAINER selects the container; STATE_KEY selects this dev state blob.
- Keep locking and one writer; a key name alone is not RBAC isolation.
This map verifies no live readiness or authorization.
```

### 3. Construct Actions here

Open [solutions/delivery.yml](../solutions/delivery.yml), the non-runnable reference. **File → New Text File → YAML**; keep this buffer **untitled**. Copy the complete header (`name`, `on`, `permissions`, `concurrency`, `env`) through `jobs:`, then in order:

1. Copy the complete `preflight` job, stopping before `validation`.
2. Copy the complete `validation` job, stopping before `plan`.
3. Copy the complete `plan` job, stopping before `apply`.
4. Copy the complete `apply` job, stopping before `followup`.
5. Copy the complete `followup` job, stopping before `drift`.
6. Copy the complete `drift` job through EOF.

Preserve indentation, action/tool pins, driver calls, guards, conditions, permissions and expressions. Compare the whole buffer; still disabled, replace the existing [.github/workflows/delivery.yml](../.github/workflows/delivery.yml) in **one complete save**. Keep [cleanup.yml](../.github/workflows/cleanup.yml) separate and unchanged. No extra or partial workflow. Exact reconstruction with **no Git diff** is valid; no fake change or empty commit.

### 4. Run offline checks and publish

```powershell
npm test
npm run kit:check
npm run workflow:check
node scripts/check-learner.mjs
```

Require all checks plus **two consumer mock cases**: backend-disabled, read-only provider locks, no Azure credentials. Downloads need internet. Preserve [module-lock.json](../module-lock.json).

**Source Control → inspect diff → Stage Changes** for intended map/workflow edits only → **Commit → Publish Branch/Push**. In **Actions**, match current SHA: **Workshop quality / kit** and **Lab checks / Test learner module** must pass.

**Expected:** The unchanged first gate checks the committed identity map only, not workflow authorship or Azure authorization; refresh the same Exercise.

**Recovery:** Stop on failures; [troubleshoot](../docs/troubleshooting.md), never weaken checks.

**Next:** [Step 2](activity-02.md), only after owner readiness.
<!-- FULL-WS-LESSON:END -->

## Original Cycle A/B outcome — 2026-09-08

- **Cycle A: verified offline.** The identity/state map checkpoint advanced the private Exercise to **1/5** with the supplied snapshot and offline route; it enabled no Azure work.
- **Cycle B: verified offline.** The fresh private copy independently reached **1/5** and handed off the pushed identity study without inventing protected `main` or a cloud preflight.
- `WORKSHOP_AZURE_ENABLED=false`; no cloud run occurred. Missing protected `main`, sandbox readiness, and independent live controls kept activities 02–05 pending in both cycles.

See [simulation.md](simulation.md) for original private proof, whole-lab counts, and the separate new capture date. Mocks are not live readiness evidence.

[Review index](README.md) · [Next activity](activity-02.md)
