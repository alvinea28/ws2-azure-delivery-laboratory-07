# Lab 07 — author-merged PR and scoped automatic saved-plan apply

**Scope:** private non-template **alvine-aurelio-org/ws2-sim-20260921-azure-delivery-laboratory-07**,
repository ID **1379149907** only. The participant can inspect and merge their own source PR
after required checks. GitHub does **not** support approving your own PR: this
uses **zero required PR approvals**, not a fabricated self-approval.

The approved **dev-plan / dev-apply** environments are main-only with **no Required
reviewers** and no admin bypass. After real prerequisite authorization/enablement,
the protected-main push validates, saves/encrypts a plan and automatically applies
that exact plan in the same run. **No manual deployment reviewer is required.**
This policy is not permission to enable an unready copy or change public templates.
Public source-template maintenance remains on **dev**, never live main. Unapproved
copies stay offline; do not edit or repin the immutable repository allowlist.

## Set up the source-merge rule

An authorized repository administrator inspects **Settings → Rules → Rulesets**
in the approved private copy and reuses the **existing pinned ruleset 23780383**.
Compare its effective controls with the supplied
[main-author-merge ruleset specification](../.github/rulesets/main-author-merge.json).
Committing that JSON does **not** install it as a GitHub rule automatically.
Do not create or import a replacement ruleset: the runtime binds the existing
ruleset ID and its owner-verified server revision. If it is missing or changed,
keep delivery disabled and ask the owner to reconcile the actual configuration.
Do not repin IDs or revisions merely to make a different configuration pass.

| Setting | Required value |
| --- | --- |
| Enforcement / target | Active; only `refs/heads/main` |
| Bypass list | Empty; no administrator or actor bypass |
| Require a pull request before merging | On |
| Required approving reviews | **0** |
| Require Code Owner review | Off |
| Require approval of the most recent push | Off |
| Require conversation resolution | On |
| Required checks | `kit` and `Test learner module` from the **GitHub Actions** app |
| Branch up to date before merge | On (strict checks) |
| Block deletion / force pushes | On |

The specification permits initial branch creation from the reviewed baseline
without requiring checks that have not run for that ref yet. It grants no actor
bypass and does not relax checks on subsequent updates. Creating the initial
branch is owner setup **only after baseline/readiness review, while delivery is
disabled**, not a deployment approval. Consult the [configuration status](delivery-configuration.md)
instead of assuming readiness; this guide makes no new settings or Azure observation.
Target, budget/currency, lifetime and explicit bootstrap authorization must be real,
and OIDC, state/leases, runner, encryption keys and module App must be verified.
This rule does not create `main`, enable Azure or configure environments/identities.

Verify effective rules, including inherited organization policies. An unrelated
policy or existing blocking review is not automatically removed. Do not dismiss
another person's review or delete a PR simply to make it mergeable.

## Participant flow

1. Commit Terraform and workflow changes on `lab/workflow-authoring`, then push.
2. **If protected main does not exist or prerequisites are unready, stop at the
   offline handoff.** Do not create main or open a PR into a nonexistent branch.
   Once the owner has established it while disabled and authorized the intended
   live scope, open the PR. Inspect **Files changed** and current **Checks** yourself;
   fix failures and resolve discussions.
3. With all required checks passing and the branch current, use **Merge pull
   request** or **Squash and merge** with your existing account. You do not need
   an approving PR review from another user, and no self-approval is recorded.
4. That merge produces the main push that starts the existing deployment workflow
   if the separate instructor prerequisites and enablement have been satisfied.
5. Observe **Validate reviewed delivery revision → Trusted dev plan → Apply exact
   dev saved plan** in that same run. No second deploy dispatch or human-review wait.

The historical [approval.cjs](../scripts/approval.cjs) delegates to
[deployment-authorization.cjs](../scripts/deployment-authorization.cjs), not an
approvals API. It freshly verifies exact private ID/name, live rules, current
main/run/SHA/attempt, actual merged PR, same-run validation/plan and environments.
OIDC, private state/locking, restricted runner, encryption, **2-hour plan validity**
and **1-day artifact retention** remain mandatory; wrong IDs/public/templates fail.

**Cleanup is separate:** an authenticated current repository admin explicitly
dispatches [cleanup.yml](../.github/workflows/cleanup.yml) after authorizing
owned-scope full cleanup, using required string `authorization` =
`destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>`; no operation input
and no independent cleanup reviewer. Current admin/actor/sender/trigger IDs,
current SHA/state and the same run's exact destroy plan are verified. Delivery's
manual menu is **followup only**; ordinary main never cleans up. Preserve shared
RG/backend/identities/runner. Scope, budget, lifetime and bootstrap authorization
remain separate; AgentAlvine only observes/guides, never authorizes Azure.

See [delivery configuration](delivery-configuration.md) and
[workflow authoring](workflow-authoring.md). No live success is claimed by this guide.
