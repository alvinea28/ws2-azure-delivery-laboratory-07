# Identity and state: who may access what

> [!WARNING]
> **INSTRUCTOR ONLY; PRIVATE copy; `WORKSHOP_AZURE_ENABLED=false`.**
> No authoring Azure/identity/state/subscription operations. Future verification
> needs independent authorization, not Copilot/AgentAlvine.

**Setup:** [start-here.md](start-here.md) · [azure-setup.md](azure-setup.md) · [instructor-preflight.md](instructor-preflight.md)

## 1. Separate the four identities people often confuse

| Component | Authority boundary |
| --- | --- |
| Human GitHub / Copilot seat | Repository, not Azure |
| AgentAlvine / `github-actions[bot]` | Automatic Exercise updates, not approval |
| GitHub App token | Module transport only |
| Separate Entra plan/apply identities | OIDC workload/backend, not human-login cache |

Standalone module/snapshot; offline needs no earlier lab/identity. Public template inert.

## 2. Required access matrix

| Context | Workload management plane | State data plane |
| --- | --- | --- |
| PR checks / AgentAlvine | None | No backend/OIDC/plans/state |
| `dev-plan` | Assigned RG **Reader** | Team-container **Storage Blob Data Contributor** |
| `dev-apply` | Same RG-only **Contributor** | Same container **Storage Blob Data Contributor** |
| Instructor | Separately authorized admin | Backend policy/recovery |

**Different client IDs.** Plan leases/writes: Blob Data Reader insufficient;
RG Contributor ≠ Blob role. No subscription Owner/role-assignment/key lookup/tenant
admin. Backend-account Reader: narrowly justified instructor exception only.

## 3. Portal navigation for an authorized instructor

Approved directory, **existing** resources only:

| Do | Why | Expected |
| --- | --- | --- |
| Resource groups → assigned RG → Overview / IAM → Role assignments | Both principals' direct/inherited grants | Correct scope/region; no broad inheritance |
| Storage accounts → backend → Networking / Data protection | Private connectivity/recovery | Approved policies |
| Data storage → Containers → team container → IAM | Data scope | Team isolation; administrator's equivalent scoped view if needed |

Different state keys in one container are **not RBAC isolation**.
No state/key/SAS reads/downloads or full configuration dumps.

## 4. Locate existing federated identities without creating credentials

**Entra ID → App registrations → All applications → approved app → Certificates &
secrets → Federated credentials**, or **Managed Identities → approved identity →
Federated credentials**. Existing design; no credential creation.

| Do | Why | Expected |
| --- | --- | --- |
| Compare actual issuer/audience privately | Correct exchange | GitHub issuer `https://token.actions.githubusercontent.com`; audience normally `api://AzureADTokenExchange` |
| Match actual `sub`/context privately | Narrow trust | Private owner/repository, approved workflow, protected `refs/heads/main`, intended environment |

Immutable IDs/customization/encoding/renames/transfers affect subjects: no name-only guesses/wider trust;
keep environment main-only rules. Instructor-allowlisted match/mismatch only:
**no JWT/request-token printing, bearer-decoding logs, auth tracing/full claims dumps**.

## 5. Provider authentication and backend authentication are separate

Read [provider](../environments/dev/providers.tf)/[backend](../environments/dev/backend.tf);
**no local canonical-root initialization**.

| Setting | Why / expected |
| --- | --- |
| Provider: `use_oidc = true`, `use_cli = false`, `storage_use_azuread = true` | Workload OIDC/Entra, not CLI |
| `resource_provider_registrations = "none"` | Instructor-prepared providers, no automatic registration |
| Backend: `use_oidc = true`, `use_azuread_auth = true` | Separate Entra state authentication |
| `ARM_USE_OIDC=true`, `ARM_USE_AZUREAD=true`, `ARM_USE_CLI=false` | Enforce OIDC, no fallback |

Bind plan vs apply/destroy client, canonical dev root, account/container/key,
`default` workspace. Child filters ambient/alternate data settings; no client-secret/
key/SAS/certificate/CLI-cache/broad-runner-identity substitutes.

## 6. Private network and single-writer prerequisites

| Do | Why | Expected |
| --- | --- | --- |
| Verify private endpoint/DNS/resolver/routes/firewall/TLS on **actual trusted runner** | Not laptop/public-runner proof | No state reads/public-storage/TLS bypass |
| Enforce [exact-workflow runner access](delivery-configuration.md#7-restrict-runner-access-by-exact-workflow-not-by-label) | Protected `main` only | Ephemeral cleanup; no ambient identity or PR/alternate-workflow access |
| Share `WS2_STATE_LOCK_ID`; retain `cancel-in-progress: false` and Blob leases | **Repository-scoped** concurrency | One writer; disable other copies before moving delivery |

**Unknown/active lease: stop, never unlock; age isn't proof.** [Recovery](recovery.md).
No local real plan/apply/destroy/state pull/show/download, workspace shortcuts,
manual Blob edits/disabled locks.

## 7. Keep GitHub keys separate from Azure identities

`MODULE_APP_CLIENT_ID`/`MODULE_APP_PRIVATE_KEY`: GitHub read transport, even public;
not Entra, unnecessary offline. `PLAN_ENCRYPTION_PUBLIC_KEY` encrypts;
`PLAN_DECRYPTION_PRIVATE_KEY`: **dev-apply only** + independent human escrow.
[Locations](delivery-configuration.md); [review](plan-review.md): **2-hour validity / 1-day retention**,
and retention never extends validity.

## 8. Acceptance and source attribution

Missing scope/gates/connectivity → **pending**; instructor escalation, never broader access.
Independent review, no self-review/admin bypass. **Full workload cleanup mandatory**;
retain shared RG/backend/identities/roles/runner with owners. IDs/evidence private.

[Delivery](../scripts/delivery.mjs), [policy](../scripts/plan-policy.mjs),
[workflow](../.github/workflows/delivery.yml). Microsoft: [federation](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation),
[Blob roles](https://learn.microsoft.com/en-us/azure/storage/blobs/assign-azure-role-data-access).
GitHub images: CC BY 4.0 references, not Azure proof; retain [licenses](images/NOTICE.md).
