# Identity and state: who may access what

> [!WARNING]
> **INSTRUCTOR ONLY — reference, not participant authorization.** All portal and
> private-workstation verification described here belongs to a separately approved
> instructor preflight. **No Azure, identity, or state operations were performed
> during authoring.** Keep `WORKSHOP_AZURE_ENABLED=false`; do not ask Copilot to
> create identities, acquire credentials, inspect state, or change subscriptions.

**Start:** [start-here.md](start-here.md) · **Help:** [troubleshooting.md](troubleshooting.md)
**Readiness:** [instructor-preflight.md](instructor-preflight.md)

## 1. Separate the four identities people often confuse

| Identity or component | Its purpose | Not a substitute for |
| --- | --- | --- |
| Human GitHub account and Copilot seat | Edit, propose, and review code according to repository permissions | Azure authorization or independent plan approval |
| AgentAlvine / `github-actions[bot]` | Update the Exercise body from repository events | An instructor, an Azure principal, or an approval authority |
| GitHub App installation token | Read the exact module source during trusted initialization | Azure provider/backend authentication |
| Entra plan/apply identities | Federated workload and state access in their respective jobs | A personal cached Azure login or subscription-wide administrator |

The source template
[alvinea28/ws2-azure-delivery-laboratory-07](https://github.com/alvinea28/ws2-azure-delivery-laboratory-07)
is public and inert. Live work requires a **PRIVATE copy**. The complete module
and vendored offline baseline are included here; no other laboratory supplies
an identity, release, or prerequisite repository.

## 2. Required access matrix

| Context | Workload management-plane access | State data-plane access | Execution boundary |
| --- | --- | --- | --- |
| Learner PR checks | None | None | Unprivileged hosted runner, mocked provider, no backend or OIDC |
| AgentAlvine | None | None | Trusted guide reads metadata; never downloads plans/state |
| **Plan identity** in `dev-plan` | **Reader** on the assigned workload RG | **Storage Blob Data Contributor** on the assigned team container | Protected `main`, approved private-network runner |
| **Apply identity** in `dev-apply` | **Contributor** on that workload RG only | **Storage Blob Data Contributor** on the same team container | Separate independent review, Prevent self-review, no admin bypass |
| Instructor | Only separately granted administration needed for setup/recovery | Owns backend policy and restricted recovery | Approved portal/workstation; outside participant automation |

**Plan Reader is not state read-only.** Terraform's backend needs Blob lease/write
operations even while planning. **Storage Blob Data Reader is insufficient.**
Conversely, workload Contributor does not automatically provide Blob data access.
Both identities need the container role; they must have different client IDs.

Neither workflow identity needs subscription Owner, role-assignment rights,
storage account key lookup, or tenant administration. If a particular approved
backend endpoint lookup needs management-plane Reader on the backend account,
the instructor must justify that narrow exception; do not widen to a subscription.

## 3. Portal navigation for an authorized instructor

These steps inspect **already prepared** resources only in the future authorized
preflight. They are not instructions to create a sandbox or change grants now.

1. In the approved browser open the Azure portal, confirm the approved directory, and use the instructor's assigned context.
2. Search **Resource groups**, open the assigned existing workload group, and inspect **Overview** for the approved scope and region.
3. Open that group's **Access control (IAM) → Role assignments**; identify the separate plan/apply principals and their effective scopes.
4. Check inherited roles as well as direct assignments. A narrow direct role does not cancel an inherited broad role.
5. Search **Storage accounts**, open the approved backend account, and inspect **Networking** for the intended private connectivity policy.
6. Use **Data storage → Containers → the assigned team container → Access control (IAM)** for the container-scoped assignments where available.
7. If the portal exposes assignments through a different scoped IAM view, have the administrator show that scope explicitly; do not grant broad access just to navigate.
8. Inspect **Data protection** and the approved recovery/retention policy with the backend owner.

**Expected result:** private confirmation that both principals have the intended
resource and data-plane roles, with a container boundary between teams. A distinct
state key in a shared container is a naming convention, not equivalent RBAC isolation.
Do not open/download a state blob, access keys, SAS tokens, or a full configuration
dump to prove these settings. Do not copy actual IDs into this public document.

## 4. Locate existing federated identities without creating credentials

For instructor-provided application identities, use **Microsoft Entra ID → App
registrations → All applications → the approved application → Overview**, then
**Certificates & secrets → Federated credentials**. Inspect each existing mapping.
If the instructor instead supplied user-assigned managed identities, use
**Managed Identities → the approved identity → Federated credentials**.
These are alternative navigation routes for the chosen design, not a request
to create both kinds of identity or add a client secret.

| Federation field | What the instructor must compare privately |
| --- | --- |
| Issuer | The actual job's issuer; GitHub Actions uses `https://token.actions.githubusercontent.com` |
| Audience | The actual Azure exchange audience, normally `api://AzureADTokenExchange` |
| Subject | Exact actual `sub` for the private copy and the intended environment |
| Repository identity | Actual owner/repository identity, including immutable identifiers where used |
| Job/ref context | Approved workflow, protected `refs/heads/main`, and `dev-plan` or `dev-apply` |

Do not paste a name-only subject from an older example. GitHub subject formats
can contain immutable owner/repository IDs, customized claims, and encoded context;
renames/transfers can matter. An environment-bound subject does not itself prove
that only `main` can use that environment: GitHub branch rules remain essential.

Allowlisted claim verification belongs to the instructor's controlled diagnostic
process. Record only a minimal match/mismatch result privately. **Never print a
JWT, decode-log a bearer token, echo the OIDC request token, enable authentication
shell tracing, or publish a full claims dump.** A screenshot is not token proof.

## 5. Provider authentication and backend authentication are separate

Review the supplied [../environments/dev/providers.tf](../environments/dev/providers.tf)
and [../environments/dev/backend.tf](../environments/dev/backend.tf), without
initializing that canonical root on a participant workstation.

| Contract | Exact supplied behavior |
| --- | --- |
| AzureRM provider | `use_oidc = true`, `use_cli = false`, `storage_use_azuread = true` |
| Provider registration | `resource_provider_registrations = "none"`; instructor prepares required providers |
| Azure backend | `use_oidc = true`, `use_azuread_auth = true` |
| Trusted process environment | `ARM_USE_OIDC=true`, `ARM_USE_AZUREAD=true`, `ARM_USE_CLI=false` |
| Phase identity | Plan selects the plan client; apply/destroy select the distinct apply client |
| State selection | Canonical dev root, explicit account/container/key, workspace `default` only |

The delivery runner filters the Terraform child environment and rejects ambient
secrets, alternate workspace/data settings, and credential fallbacks. Do not repair
authentication by adding a client secret, access key, SAS, certificate login,
cached Azure CLI session, or broad runner identity. A successful separate login
would not prove that both Terraform authentication paths use the intended principal.

## 6. Private network and single-writer prerequisites

The instructor verifies the backend's private endpoint, DNS-zone/resolver path,
routes, firewall rules, and TLS reachability from the **actual trusted runner
network**. A working laptop or public runner is not equivalent proof.
DNS-only/reachability diagnostics require their own approved scope and must not
retrieve state. Do not open public storage access or disable TLS to pass a check.

The runner group must permit only the private copy's exact
[../.github/workflows/delivery.yml](../.github/workflows/delivery.yml) at protected
`main`. The `ws2-trusted` label is only a selector. Check ephemeral cleanup, no
ambient cloud identity, and exclusion of PR/alternate-workflow code using
[delivery-configuration.md](delivery-configuration.md).

All operations share the `WS2_STATE_LOCK_ID` concurrency group with
`cancel-in-progress: false`; Azure Blob leases remain enabled. GitHub concurrency
is **repository-scoped**: identical names in two repositories do not serialize
writers. If moving delivery, designate one approved private copy as the only
writer and leave every other copy disabled.

**Stop on an active or uncertain lock.** No local Azure plan/apply/destroy,
state pull/show/download, manual Blob edit, lock disabling, or active force-unlock.
An apparently old lease does not establish that its writer has stopped.
Exceptional backend recovery is an instructor-owned incident, not a lab shortcut;
see [recovery.md](recovery.md).

## 7. Keep GitHub keys separate from Azure identities

`MODULE_APP_CLIENT_ID` and `MODULE_APP_PRIVATE_KEY` belong to a **GitHub App**,
not an Entra client-secret flow. Although this lab's module source is public,
the current trusted workflow still creates and requires its read-only installation
token. Prove that transport during instructor preflight unless a separate code
change replaces it. Offline checks need neither that App nor Azure credentials.

`PLAN_ENCRYPTION_PUBLIC_KEY` encrypts plan/manifest bytes; the private key is
restricted to `dev-apply` and authorized independent human escrow. It is not a
provider credential. Exact settings locations are in [delivery-configuration.md](delivery-configuration.md).

## 8. Acceptance and source attribution

Keep real names, IDs, scope evidence, and access links in the approved private
instructor record, not these reference files. Leave identity, backend, networking,
leases, protected-environment enforcement, and live integration **pending** until
observed. After cleanup retain the shared RG, backend/container, identities,
roles, and runner under instructor ownership; workload destruction does not own them.

Contract sources: [../scripts/delivery.mjs](../scripts/delivery.mjs),
[../scripts/plan-policy.mjs](../scripts/plan-policy.mjs), and
[../.github/workflows/delivery.yml](../.github/workflows/delivery.yml).
Background: [Microsoft workload identity federation](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation)
and [Blob data-role assignment](https://learn.microsoft.com/en-us/azure/storage/blobs/assign-azure-role-data-access).
Original explanation; any linked GitHub screenshots are CC BY 4.0 navigation
references, **not actual Azure configuration**, with attribution in [images/NOTICE.md](images/NOTICE.md).
