import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Reviewed, actionlint-checked CONTROL bytes, not Markdown/progress/evidence hashes.
// This is deliberately an exact-template checker, NOT an arbitrary YAML parser
// or a deployment authorization service. Never learn a new pin from its input.
export const REFERENCE_SHA256 = "6bdaef1b89a7aba9f764e600e0be3b49bdb55437f66d6928fc7f34247100b826";
export const CLEANUP_REFERENCE_SHA256 = "2068326ed741518a7bb36778bb708cc2e47d9815289b563c4e296b7f5d6a2ddf";
export const COMPANION_SHA256 = Object.freeze({
  "agentalvine.yml": "6c8888b899a5ce64fc7377aa15e36b0eec84c44afacdada9066f26a809daa615",
  "lab-checks.yml": "837de9b4375505cb99b970a434399b9b667f0d494a3d45f804eb49ab87040e32",
  "quality.yml": "8554cd27692cf727be126cc5837c9ba4244954bdf205ac544c8033c7ea4e4343",
});
const repository = fileURLToPath(new URL("../", import.meta.url));
const expectedNames = Object.freeze(["delivery.yml", "cleanup.yml", ...Object.keys(COMPANION_SHA256)].sort());
const jobNames = ["preflight", "validation", "plan", "apply", "destroy", "followup", "drift"];
const inventoryError = "Workflow inventory differs: keep one delivery.yml, one dedicated cleanup.yml and the three reviewed companions; unknown files/directories or renamed .yml/.yaml/.YML entries require review (possible duplicate live writer)";
const gate = "    if: vars.WORKSHOP_AZURE_ENABLED == 'true' && !github.event.repository.is_template && github.event.repository.private && github.ref == 'refs/heads/main' && github.ref_protected\n";

export function normalizeWorkflow(text) {
  assert.ok(typeof text === "string", "Workflow source must be UTF-8 text");
  const normalized = text.replaceAll("\r\n", "\n");
  assert.ok(!normalized.includes("\r") && !normalized.includes("\0"), "Unexpected control character in workflow source");
  // Windows CRLF and a missing terminal newline are the ONLY tolerated changes.
  // Never trim indentation, strip comments, rewrite expressions or parse aliases.
  return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}

export function workflowHash(text) {
  return createHash("sha256").update(normalizeWorkflow(text)).digest("hex");
}

function requireText(text, fragment, message) {
  assert.ok(text.includes(fragment), message);
}

function assertInventory(names) {
  assert.ok(names.length === expectedNames.length && expectedNames.every((name) => names.includes(name)), inventoryError);
}

function assertReferenceInvariants(reference, cleanup = false) {
  // Called ONLY after the independently pinned digest matches. These literal
  // slices explain the reviewed contract; they do not certify arbitrary YAML.
  const job = (name) => {
    const marker = `\n  ${name}:\n`;
    const start = reference.indexOf(marker);
    assert.ok(start >= 0, `Required delivery job missing: ${name}`);
    const ends = jobNames.map((next) => reference.indexOf(`\n  ${next}:\n`, start + marker.length)).filter((end) => end >= 0);
    return reference.slice(start, ends.length ? Math.min(...ends) + 1 : undefined);
  };
  const header = reference.slice(0, reference.indexOf("\njobs:\n"));
  const mutationJob = cleanup ? "destroy" : "apply";
  const actualJobs = [...reference.slice(reference.indexOf("\njobs:\n")).matchAll(/^  ([a-z]+):$/gm)].map((match) => match[1]);
  assert.deepEqual(actualJobs, cleanup ? ["preflight", "validation", "plan", "destroy"] : ["preflight", "validation", "plan", "apply", "followup", "drift"], "Retain exactly the reviewed jobs for this route");
  if (cleanup) {
    requireText(header, "on:\n  workflow_dispatch:\n    inputs:\n      authorization:\n        description: 'destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>'\n        required: true\n        type: string\npermissions: {}\n", "Cleanup requires an explicit repository/SHA/state-bound string with no default");
    for (const forbidden of ["  push:", "  schedule:", "workflow_call:", "pull_request", "workflow_run:", "        default:", "      operation:"]) {
      assert.ok(!header.includes(forbidden), "Cleanup must never run automatically or accept a selectable operation/default authorization");
    }
  } else {
    requireText(header, "on:\n  push:\n    branches: [main]\n  workflow_dispatch:\n", "Only a main push starts deployment");
    requireText(header, "        options: [followup]\n        default: followup\n", "Only followup is a manual delivery operation");
    requireText(header, "  schedule:\n    - cron: '17 2 * * 2'\npermissions: {}\n", "Scheduled drift is distinct from deployment and permissions default to none");
    assert.ok(!reference.includes("destroy"), "Delivery must not contain a destroy input, job or driver branch");
  }
  requireText(header, "  group: ws2-state-${{ vars.WS2_STATE_LOCK_ID || github.repository }}\n  cancel-in-progress: false\n", "Delivery and cleanup must serialize the same state without cancellation");
  requireText(header, "  WS2_STATE_LOCK_ID: ${{ vars.WS2_STATE_LOCK_ID }}\n", "The helper must bind cleanup to the configured state lock ID");
  assert.ok(!header.includes("secrets.") && !header.includes("id-token:"), "Do not inherit environment secrets or OIDC into hosted jobs");
  for (const name of ["preflight", "validation"]) {
    const section = job(name);
    requireText(section, gate, `${name} needs the disabled/template/private/protected-main gate`);
    requireText(section, "    runs-on: ubuntu-24.04\n", `${name} must use a hosted runner`);
    requireText(section, "      contents: read\n", `${name} needs only read access`);
    for (const forbidden of ["id-token:", "secrets.", "    environment:", "self-hosted", "ws2-trusted", "continue-on-error:"]) {
      assert.ok(!section.includes(forbidden), `${name} must not receive cloud credentials, trusted runners or an error bypass`);
    }
  }
  const preflight = job("preflight");
  requireText(preflight, "    permissions:\n      contents: read\n      actions: read\n      pull-requests: read\n", "Metadata preflight needs read-only repository, run and merged-PR access");
  requireText(preflight, "    timeout-minutes: 5\n", "Keep bounded metadata preflight");
  const preflightCall = "const {operation} = await require('./scripts/approval.cjs')({github,context,core,phase:'preflight'});";
  requireText(preflight, preflightCall, "The fixed-profile helper must select the operation and verify fresh repository/main/rules/PR/environment metadata");
  requireText(preflight, "const delivery = await import(pathToFileURL(resolve('scripts/delivery.mjs')).href);", "Import the existing driver configuration, not an inline substitute");
  requireText(preflight, "delivery.configuration({...process.env, OPERATION: operation});", "Check the helper-selected operation's configuration before cloud work");
  assert.ok(preflight.indexOf(preflightCall) < preflight.indexOf("delivery.configuration("), "Authorize before validating the operation's configuration");
  requireText(preflight, "if (!/^[a-zA-Z0-9-]{3,80}$/.test(process.env.WS2_STATE_LOCK_ID || ''))", "Require a real configured single-writer state ID");
  requireText(preflight, "const snapshot = await import(pathToFileURL(resolve('scripts/module-snapshot.mjs')).href);", "Validate the existing module snapshot");
  requireText(preflight, "const lock = snapshot.validateLock(JSON.parse(fs.readFileSync('module-lock.json','utf8')), snapshot.moduleSource(fs.readFileSync('environments/dev/main.tf','utf8')));", "Bind module identity to its lock and actual source");
  requireText(preflight, "      operation: ${{ steps.policy.outputs.operation }}\n      module_owner: ${{ steps.policy.outputs.module_owner }}\n      module_repo: ${{ steps.policy.outputs.module_repo }}\n", "Expose only the helper operation and validated module repository mapping");
  requireText(preflight, "core.setOutput('module_owner',lock.repository.split('/')[0]);\n            core.setOutput('module_repo',lock.repository.split('/')[1]);", "Derive module app scope from the verified lock");
  assert.ok(!reference.includes("assertEnvironmentProtection") && !reference.includes("policy.operationFor") && !reference.includes("REQUESTED_OPERATION"), "Do not retain obsolete inline reviewer requirements or alternate event routing");
  // Runtime identity/current-main/rules/PR/attempt/cleanup checks belong to the
  // shared authorization helper. This checker verifies calls, never executes it.
  const validation = job("validation");
  requireText(validation, "    name: Validate reviewed delivery revision\n", "Keep the exact validation job name consumed by phase guards");
  requireText(validation, "    timeout-minutes: 15\n", "Keep bounded credential-free validation");
  requireText(validation, "    needs: preflight\n", "Validation must follow trusted metadata preflight");
  requireText(validation, "    permissions:\n      contents: read\n    steps:\n", "Validation must have read-only permissions and no environment secrets");
  for (const command of ["npm test", "npm run kit:check", "npm run workflow:check", "node scripts/check-learner.mjs"]) {
    requireText(validation, `      - run: ${command}\n`, `Validation must execute ${command}`);
  }
  for (const name of ["validation", "plan", mutationJob]) {
    requireText(job(name), "          node-version: 24.16.0\n", "Keep the pinned Node runtime");
    requireText(job(name), "          terraform_version: 1.16.1\n          terraform_wrapper: false\n", "Keep the pinned unwrapped Terraform CLI");
  }
  for (const name of ["preflight", "validation", "plan", mutationJob]) {
    requireText(job(name), "          ref: ${{ github.sha }}\n          persist-credentials: false\n", "Every code checkout must use the same immutable event SHA without persisted credentials");
  }
  const plan = job("plan");
  requireText(plan, "    name: Trusted dev plan\n", "Keep the exact plan job name consumed by the apply guard");
  requireText(plan, "    needs: [preflight, validation]\n", "Privileged planning must depend on successful validation");
  requireText(plan, "    environment: dev-plan\n", "Keep the distinct planning environment");
  requireText(plan, "    timeout-minutes: 30\n", "Keep bounded privileged planning");
  requireText(plan, "      ARM_CLIENT_ID: ${{ vars.AZURE_PLAN_CLIENT_ID }}\n      OPERATION: ${{ needs.preflight.outputs.operation }}\n", "Use the separate plan identity and helper-selected operation");
  requireText(plan, "run: node scripts/delivery.mjs plan\n", "Use the existing fixed-scope plan driver");
  const planGuard = plan.indexOf("await require('./scripts/approval.cjs')({github,context,core,phase:'plan'});");
  assert.ok(planGuard >= 0 && planGuard < plan.indexOf("uses: hashicorp/setup-terraform@") && planGuard < plan.indexOf("uses: actions/create-github-app-token@") && planGuard < plan.indexOf("run: node scripts/delivery.mjs plan"), "Recheck metadata and unique same-run/attempt/SHA validation before Terraform, module credentials or OIDC work");
  const sealing = plan.indexOf("run: node scripts/plan-envelope.mjs seal");
  assert.ok(sealing >= 0 && sealing < plan.indexOf("uses: actions/upload-artifact@"), "Seal before upload");
  assert.ok(reference.split("uses: actions/upload-artifact@").length === 2, "Upload exactly one encrypted artifact, never raw plan/state");
  requireText(plan, "          PLAN_ENCRYPTION_PUBLIC_KEY: ${{ vars.PLAN_ENCRYPTION_PUBLIC_KEY }}\n        run: node scripts/plan-envelope.mjs seal\n", "Keep the scoped public encryption key on the sealing step");
  requireText(plan, "          name: ${{ steps.plan.outputs.artifact }}\n          path: .workshop/sealed/plan.enc\n          include-hidden-files: true\n          if-no-files-found: error\n          retention-days: 1\n", "Upload only the encrypted envelope, fail on absence and retain for one day");
  const apply = job(mutationJob);
  for (const section of [plan, apply]) {
    requireText(section, "    runs-on: [self-hosted, linux, x64, ws2-trusted]\n", "Keep isolated trusted runners for privileged jobs only");
    requireText(section, "    permissions:\n      contents: read\n      actions: read\n      pull-requests: read\n      id-token: write\n", "Keep metadata reads and OIDC on privileged jobs only");
    requireText(section, "          client-id: ${{ vars.MODULE_APP_CLIENT_ID }}\n          private-key: ${{ secrets.MODULE_APP_PRIVATE_KEY }}\n          owner: ${{ needs.preflight.outputs.module_owner }}\n          repositories: ${{ needs.preflight.outputs.module_repo }}\n          permission-contents: read\n", "Retain the short-lived read-only app token scoped to the verified private module");
    requireText(section, "          MODULE_READ_TOKEN: ${{ steps.module.outputs.token }}\n", "Scope module transport credentials to the driver step");
    requireText(section, "if: always()\n        run: node scripts/delivery.mjs clean\n", "Clean local sensitive material even on failure");
  }
  requireText(apply, "    needs: [preflight, plan]\n", "Mutation must consume this run's plan");
  requireText(apply, `    if: needs.preflight.outputs.operation == '${cleanup ? "destroy" : "deploy"}' && needs.plan.result == 'success'\n`, "Each route must consume only its own successful authorized operation");
  requireText(apply, "    environment: dev-apply\n", "Retain the distinct main-only apply environment and identity");
  requireText(apply, "    timeout-minutes: 35\n", "Keep bounded privileged mutation");
  requireText(apply, "      ARM_CLIENT_ID: ${{ vars.AZURE_APPLY_CLIENT_ID }}\n", "Keep the separate mutation identity");
  requireText(apply, cleanup ? "      OPERATION: ${{ needs.preflight.outputs.operation }}\n" : "      OPERATION: deploy\n", "Do not change the helper-verified mutation operation");
  requireText(apply, "          name: ${{ needs.plan.outputs.artifact }}\n          path: .workshop/sealed\n", "Do not import another run's artifact");
  assert.ok(!apply.includes("run-id:"), "Never select an artifact from another run");
  requireText(apply, "          EXPECTED_PLAN_HASH: ${{ needs.plan.outputs.plan_sha256 }}\n          EXPECTED_MANIFEST_HASH: ${{ needs.plan.outputs.manifest_sha256 }}\n          CURRENT_MAIN_SHA: ${{ steps.approval.outputs.main_sha }}\n          GH_READ_TOKEN: ${{ github.token }}\n", "Retain both exact digests and driver current-main revalidation");
  requireText(apply, "          PLAN_DECRYPTION_PRIVATE_KEY: ${{ secrets.PLAN_DECRYPTION_PRIVATE_KEY }}\n        run: node scripts/plan-envelope.mjs open\n", "Expose the environment decryption key only at the protected decrypt step");
  const approval = apply.indexOf("await require('./scripts/approval.cjs')({github,context,core});");
  const open = apply.indexOf("run: node scripts/plan-envelope.mjs open");
  const mutation = apply.indexOf(`run: node scripts/delivery.mjs ${mutationJob}\n`);
  assert.ok(approval >= 0 && open > approval && mutation > open, "Recheck scoped authorization and same-run validation/plan, then decrypt, then apply the exact saved plan");
  assert.ok(apply.indexOf("uses: actions/create-github-app-token@") > open, "Do not acquire apply module credentials before authorization/decryption");
  if (!cleanup) {
    requireText(job("followup"), "    if: needs.preflight.outputs.operation == 'followup' && needs.plan.result == 'success'\n", "Followup remains a separate read-only confirmation");
    requireText(job("followup"), 'test "$PLAN_EXIT" = 0', "Only a genuine fresh exit zero proves no-change");
    requireText(job("drift"), "    if: needs.preflight.outputs.operation == 'drift' && needs.plan.outputs.exitcode == '2'\n", "Report drift without applying");
  }
  return { sharedEnv: header.slice(header.indexOf("\nenv:\n")), validation };
}

export function validateWorkflowSources({ reference, cleanupReference, workflows }) {
  const reviewed = normalizeWorkflow(reference);
  const reviewedCleanup = normalizeWorkflow(cleanupReference);
  assert.ok(workflowHash(reviewed) === REFERENCE_SHA256, "Reference drift: restore the reviewed solutions/delivery.yml; never update a pin just to pass");
  assert.ok(workflowHash(reviewedCleanup) === CLEANUP_REFERENCE_SHA256, "Cleanup reference drift: restore the independently reviewed solutions/cleanup.yml; never update a pin just to pass");
  assert.ok(workflows && typeof workflows === "object" && !Array.isArray(workflows), "Supply the installed workflow inventory");
  const prototype = Object.getPrototypeOf(workflows);
  assert.ok(prototype === Object.prototype || prototype === null, "Supply a plain installed workflow inventory without inherited entries");
  assertInventory(Reflect.ownKeys(workflows));
  for (const name of expectedNames) {
    const descriptor = Object.getOwnPropertyDescriptor(workflows, name);
    assert.ok(descriptor && Object.hasOwn(descriptor, "value") && typeof descriptor.value === "string", "Workflow inventory entries must be plain text values, not accessors");
  }
  assert.ok(normalizeWorkflow(workflows["delivery.yml"]) === reviewed, "Canonical delivery.yml differs from the trusted reference: compare the complete sections, events, permissions and gates; do not edit the checker/reference to hide an error");
  assert.ok(normalizeWorkflow(workflows["cleanup.yml"]) === reviewedCleanup, "Canonical cleanup.yml differs from the trusted reference: restore the dedicated dispatch, explicit authorization and exact-plan gates");
  for (const [name, hash] of Object.entries(COMPANION_SHA256)) {
    assert.ok(workflowHash(workflows[name]) === hash, `Unreviewed companion workflow change: ${name}; keep PR code off trusted runners and Azure credentials`);
  }
  const delivery = assertReferenceInvariants(reviewed);
  const cleanup = assertReferenceInvariants(reviewedCleanup, true);
  assert.ok(delivery.sharedEnv === cleanup.sharedEnv && delivery.validation === cleanup.validation, "Cleanup must retain identical state/ARM mappings and every same-SHA validation command");
  return { deliverySha256: REFERENCE_SHA256, cleanupSha256: CLEANUP_REFERENCE_SHA256, deliveryWorkflows: 1, cleanupWorkflows: 1, companionWorkflows: 3 };
}

async function localRead(operation) {
  try {
    return await operation();
  } catch {
    // Never expose attacker-chosen paths, source bytes, plans or secrets.
    throw new Error("Workflow inputs are missing or unreadable; restore the five installed files and both reviewed solutions");
  }
}

async function checkedPath(path, directory) {
  const info = await localRead(() => lstat(path));
  if (directory) {
    assert.ok(info.isDirectory() && !info.isSymbolicLink(), "Repository and workflow/reference folders must be real directories, not symbolic links");
  } else {
    assert.ok(info.isFile() && !info.isSymbolicLink() && info.nlink === 1, "Workflow inputs must be regular single-link files, not symbolic links, hard links, directories or special files");
  }
  const actual = await localRead(() => realpath(path));
  assert.ok(relative(resolve(path), actual) === "", "Workflow paths must not traverse linked ancestors or escape the selected repository");
}

async function regularFile(path) {
  await checkedPath(path, false);
  const bytes = await localRead(() => readFile(path));
  const text = bytes.toString("utf8");
  assert.ok(Buffer.from(text, "utf8").equals(bytes), "Workflow source must be valid UTF-8 without lossy decoding");
  return text;
}

export async function readWorkflowSources(root = repository) {
  assert.ok(typeof root === "string" && root.length > 0, "Supply a repository directory");
  const base = resolve(root);
  await checkedPath(base, true);
  for (const folder of [".github", ".github/workflows", "solutions"]) await checkedPath(join(base, folder), true);
  const folder = join(base, ".github/workflows");
  // Inventory every entry before reading: no extension filter or linked escape.
  assertInventory(await localRead(() => readdir(folder)));
  const workflows = Object.create(null);
  for (const name of expectedNames) workflows[name] = await regularFile(join(folder, name));
  return { reference: await regularFile(join(base, "solutions/delivery.yml")), cleanupReference: await regularFile(join(base, "solutions/cleanup.yml")), workflows };
}

export async function checkWorkflow(root = repository) {
  return validateWorkflowSources(await readWorkflowSources(root));
}

// Node 24.16.0 keeps linked CLI invocations from silently skipping the guard.
if (import.meta.main) {
  try {
    assert.ok(process.argv.length === 2, "This read-only checker has no update, skip or override flags");
    const result = await checkWorkflow();
    console.log(`Workflow authoring passed: ${result.deliveryWorkflows} canonical delivery workflow; ${result.cleanupWorkflows} separately authorized cleanup workflow; ${result.companionWorkflows} reviewed companions. No Azure operations, approvals or live completion claimed. Run actionlint separately for syntax validation.`);
  } catch (error) {
    console.error(`Workflow authoring stopped: ${error.message}`);
    process.exitCode = 1;
  }
}
