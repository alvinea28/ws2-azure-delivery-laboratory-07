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

Only **alvine-aurelio-org/ws2-sim-20260921-azure-delivery-laboratory-07**, ID
**1379149907**, is approved for automatic mode. Use the [configuration status](delivery-configuration.md)
for expected public setup or retained private observations; this preflight records
no new readback. Keep false until target, budget/currency, lifetime, explicit
bootstrap authorization and actual OIDC/state/runner/keys/module-App readiness are
verified. Do not invent readiness or repin identities to enable another copy.

Mocks prove contracts, settings prove gates, authorized rehearsal observes integration;
none authorizes another run. Mocks cannot prove publication/cloud readiness.

**AzureRM 5.4.0 baseline ≠ Lab 02 AVM's separate AzureRM 4.81.0 root.** No repin/live substitution.

## 2. Arrange people, accounts, and a suitable private host

| Do | Why | Expected |
| --- | --- | --- |
| Administrator: verify licensed private host | Enforced controls | Missing controls → remain blocked with the owner, never public/weaker isolation |
| Instructor: own sandbox/identities/backend/runner/recovery | Accountability | One writer |
| PR author: inspect current diff/checks and conversations | [Author-merge source rule](pr-author-merge.md) | PR required, zero approving PR reviews; current checks must pass |
| Authorized owner: approve sandbox, budget, lifetime and bootstrap explicitly | Scope/accountability | No manual deployment reviewer; readiness and authorization are still required |
| Current authenticated repo admin: separately authorize and dispatch full cleanup | Explicit owned-scope decision | One authorized owner; no independent cleanup reviewer |

Participants: offline work/blocker handoff, no enablement. **Lab 07 source PRs may
be author-merged after passing checks; automatic exact-plan apply is not fabricated
self-approval.** Educational progress grants no Azure authorization.

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
current `main`, both environments main-only with no Required reviewers and no admin bypass;
exact-workflow runners, scoped variables/keys and App transport. Labels aren't gates.

If main is absent, stop at offline handoff. Only after baseline/readiness review
may the owner establish it **while disabled**; no PR to nonexistent main or creation
while unready. Default remains dev until the owner deliberately selects protected
main when ready for scheduled drift. No automatic default-branch change.

The actual delivery DAG is hosted **preflight → validation → privileged plan**;
planning needs both predecessors to succeed. Hosted validation checks out the exact
event SHA and runs the four offline checks with read-only permissions, no environment
secrets/OIDC or trusted runner. PR checks remain hosted and credential-free. Do not
replace this dependency with an unrelated successful PR run or an artifact from one.

After real prerequisite authorization, reviewed **main push → validation → saved
plan/encryption → automatic same-run exact-plan apply** is the normal route. Delivery
dispatch offers **followup only**; cleanup is a separate authorized workflow and
schedule remains report-only drift. Coordinate the first merge only when ready.
The existing Exercise timing gates still require later runs
after preceding checkpoints; do not credit skipped jobs or rewrite historical scores.

Before enablement, the workflow owner must verify that the metadata-only
[AgentAlvine workflow](../.github/workflows/agentalvine.yml) subscribes to completion
of **Trusted dev cleanup (explicit owner authorization required)** as well as delivery.
Changing the course's cleanup filename/job names does not install that event wiring.
Retain trusted-default-branch loading, no cloud tokens/artifact execution and the
reviewed workflow checker/reference pins. Missing wiring stays pending; do not
dispatch delivery, edit progress or manufacture an event to compensate.

## 5. Obtain the instructor-owned infrastructure prerequisites

Separately authorized [identity/state verification](identity-state.md):

| Do | Why | Expected |
| --- | --- | --- |
| Check existing RG/region/ranges/policies/providers | Approved sandbox | Providers registered |
| Separate OIDC identities | Least privilege | Plan RG **Reader**; apply RG-only **Contributor**; no subscription/role-assignment authority; both team-container **Storage Blob Data Contributor** for leases |
| Verify federation | Narrow trust | Exact per-environment issuer/audience/subject; no token logging |
| Verify private backend/runner | Isolated access | Account/container/key, DNS/routes/TLS/recovery; ephemeral Linux x64, no ambient identity |
| Verify encryption pairing and apply-only private key; any owner escrow is separately controlled | Safe handling | No private keys in PRs; no manual reviewer gate |

## 6. Keep the enablement decision honest

| Do | Why | Expected |
| --- | --- | --- |
| Explicitly authorize first instructor rehearsal's `true` window | Workflow requires enablement | Otherwise `false` |
| Instructor evaluates actual dry-run/go-no-go | Docs/mocks/skips ≠ approval | Participants wait |

[Encrypted review](plan-review.md): **2-hour validity / 1-day retention**; retention never
extends validity. **New authorized runs + fresh exact plans**, never credentialled reruns.
Bootstrap mutations need explicit owner authorization, not this document's existence.
Dedicated [cleanup](../.github/workflows/cleanup.yml) requires string
`authorization` = `destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>`,
no operation input, and a current authenticated admin's explicit owned-scope decision.
The helper checks admin/actor/sender/trigger IDs, current SHA/state and same-run
validation/plan. No independent cleanup reviewer. Ordinary main never cleans up.

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

Require the [hands-on configuration and benign HCL update activity](workflow-authoring.md#6-hands-on-verify-configuration-and-make-a-benign-update): actual portal properties, an agreed non-reserved tag update through checks-passing PR/main, no replacement and unchanged IDs, then a fresh exit-0 followup. The driver outputs alone cannot prove those observations; no zero-cost assumption or new verification is made by this guide.

[Recovery](recovery.md): never unlock active leases. **Full cleanup mandatory**:
same root/state, no targets, empty managed state **and** inventory; retain shared
RG/backend/container/identities/roles/runner with owners.
Require successful plan/destroy jobs; failed, skipped or uncertain cleanup stays open.

## Source attribution

[Workflow](../.github/workflows/delivery.yml), [delivery](../scripts/delivery.mjs),
[policy](../scripts/plan-policy.mjs), [approval](../scripts/approval.cjs);
[GitHub environment availability](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
GitHub references: CC BY 4.0; retain [licenses](images/NOTICE.md)/[manifest](images/manifest.json).
