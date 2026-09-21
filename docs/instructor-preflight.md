# Instructor preflight: keep live delivery blocked until proven

> [!WARNING]
> **INSTRUCTOR ONLY.** `WORKSHOP_AZURE_ENABLED=false`; no authoring Azure/identity/
> state/subscription/live-workflow operations. Copilot, AgentAlvine, Exercise
> progress and PR approval never authorize Azure.

**Setup:** [start-here.md](start-here.md) · [azure-setup.md](azure-setup.md) · [troubleshooting.md](troubleshooting.md)

## 1. Know which repository and which kind of proof

[Public template](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07): no credentials/enablement/trusted runners.
Live: one approved **PRIVATE copy**. Standalone [module](../module/)/[snapshot](../vendor/network-baseline/);
no earlier lab/release.

Mocks prove contracts, settings prove gates, authorized rehearsal observes integration;
none authorizes another run. Mocks cannot prove publication/cloud readiness.

**AzureRM 5.4.0 baseline ≠ Lab 02 AVM's separate AzureRM 4.81.0 root.** No repin/live substitution.

## 2. Arrange people, accounts, and a suitable private host

| Do | Why | Expected |
| --- | --- | --- |
| Administrator: verify licensed private host | Enforced gates | Missing controls → suitable private host, never public/weaker approval |
| Instructor: own sandbox/identities/backend/runner/recovery | Accountability | One writer |
| PR author: inspect current diff/checks and conversations | [Author-merge source rule](pr-author-merge.md) | PR required, zero approving PR reviews; current checks must pass |
| Deployment reviewer: inspect this run's decrypted plan privately | Independent Azure decision | Approver cannot be run actor, triggering actor or associated merged-PR author; merger may need a third eligible human |

Participants: offline work/blocker handoff, no enablement. **Lab 07 source PRs may
be author-merged; live Azure approval still cannot be self-approved.**

## 3. First-time setup, without touching Azure

[Accounts/copy/clone/open](start-here.md); [toolchain](toolchain.md): Node **24.16.0**,
Terraform **1.16.1**, AzureRM **5.4.0**. Clone root; run separately, stop on failure:

```powershell
node scripts/doctor.mjs
npm test
npm run kit:check
npm run workflow:check
node scripts/check-learner.mjs
```

**Why / flags:** doctor reads local readiness; Node tests exercise control rejection
cases, kit checks guide integrity, workflow checking binds the installed YAML to its
reviewed reference, and learner checking verifies snapshot hashes and isolated backend-disabled mocks.
**Expected:** both consumer cases execute and pass; zero/skipped/errored tests are not
success. Public provider downloads may need internet, never Azure credentials.
[Recovery](dependency-snapshot.md#3-what-the-offline-learner-command-actually-does).

Require [the core authoring tutorial](workflow-authoring.md), not optional reading:
construct one canonical workflow on `lab/workflow-authoring` while disabled, using
the complete non-runnable [reference](../solutions/delivery.yml). Review the checker,
reference and helpers with the workflow; never update a digest merely to make it pass.
Control fingerprints exclude pedagogical prose and historical evidence.

## 4. Configure GitHub deliberately

Administrator follows [settings + reference images](delivery-configuration.md): protected
default `main`, both environments, independent review, no self-review/admin bypass;
exact-workflow runners, scoped variables/keys and App transport. Labels aren't gates.

The actual delivery DAG is hosted **preflight → validation → privileged plan**;
planning needs both predecessors to succeed. Hosted validation checks out the exact
event SHA and runs the four offline checks with read-only permissions, no environment
secrets/OIDC or trusted runner. PR checks remain hosted and credential-free. Do not
replace this dependency with an unrelated successful PR run or an artifact from one.

After separate authorization, reviewed **main push → plan → independent dev-apply
approval → same-run apply** is the normal route. Only followup/destroy are manual;
schedule remains report-only drift. Coordinate the first merge and have the reviewer
ready before enabling. The existing Exercise timing gates still require later runs
after preceding checkpoints; do not credit skipped jobs or rewrite historical scores.

## 5. Obtain the instructor-owned infrastructure prerequisites

Separately authorized [identity/state verification](identity-state.md):

| Do | Why | Expected |
| --- | --- | --- |
| Check existing RG/region/ranges/policies/providers | Approved sandbox | Providers registered |
| Separate OIDC identities | Least privilege | Plan RG **Reader**; apply RG-only **Contributor**; no subscription/role-assignment authority; both team-container **Storage Blob Data Contributor** for leases |
| Verify federation | Narrow trust | Exact per-environment issuer/audience/subject; no token logging |
| Verify private backend/runner | Isolated access | Account/container/key, DNS/routes/TLS/recovery; ephemeral Linux x64, no ambient identity |
| Verify independent human workstation/key escrow | Safe review | No private keys in PRs |

## 6. Keep the enablement decision honest

| Do | Why | Expected |
| --- | --- | --- |
| Explicitly authorize first instructor rehearsal's `true` window | Workflow requires enablement | Otherwise `false` |
| Instructor evaluates actual dry-run/go-no-go | Docs/mocks/skips ≠ approval | Participants wait |

[Encrypted review](plan-review.md): **2-hour validity / 1-day retention**; retention never
extends validity. **New runs + fresh independent approval**, never credentialled reruns.

## 7. Source-inspection findings and final handoff

**2026-09-15 file inspection supersedes three stale blockers:**

| Source | Fact / boundary |
| --- | --- |
| [Root](../environments/dev/main.tf)/[lock](../module-lock.json) | Existing published same-source [4414e56b409a46785590741adcc48abea29905d7](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07/commit/4414e56b409a46785590741adcc48abea29905d7), `module`, eight HCL records; no remote recheck/repin. |
| [Refresh](../scripts/refresh-snapshot.mjs)/[three tests](../tests-node/refresh-snapshot.test.mjs) | Git inventory/normalized blobs/EOF; tests cover export and rejection of hidden changes/injected HCL. |
| [Toolchain test](../tests-node/toolchain.test.mjs) | Actual [learner workflow](../.github/workflows/lab-checks.yml), Windows/Linux hashes, readonly-init guard. |
| [Historical verification](daily%20work%20report/2026-09-15.md#recorded-verification) | **80/80 Node, 0 failed/skipped**; not rerun/cloud proof. |

App transport/private gates/Azure integration **pending**. The driver verifies output-ID
scope/topology and, after destroy, empty managed state; it does not perform independent
ARM configuration or final resource-absence reads. Require those actual observations
in a separately authorized live rehearsal. Private handoff:
verifier/date/revision/results/blocker owners; no actual IDs/secrets/private links/raw
screenshots here. Automatic AgentAlvine Exercise updates, no evidence PR/manual progress.

[Recovery](recovery.md): never unlock active leases. **Full cleanup mandatory**:
same root/state, no targets, empty managed state **and** inventory; retain shared
RG/backend/container/identities/roles/runner with owners.
Require successful plan/destroy jobs; failed, skipped or uncertain cleanup stays open.

## Source attribution

[Workflow](../.github/workflows/delivery.yml), [delivery](../scripts/delivery.mjs),
[policy](../scripts/plan-policy.mjs), [approval](../scripts/approval.cjs);
[GitHub environment availability](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
GitHub references: CC BY 4.0; retain [licenses](images/NOTICE.md)/[manifest](images/manifest.json).
