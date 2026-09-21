import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Reviewed, actionlint-checked CONTROL bytes, not Markdown/progress/evidence hashes.
// This is deliberately an exact-template checker, NOT an arbitrary YAML parser
// or a deployment authorization service. Never learn a new pin from its input.
export const REFERENCE_SHA256 = "801b5dc3dd009696e3b24cedd251ca873c4425950421fe714107011388eb09ed";
export const COMPANION_SHA256 = Object.freeze({
  "agentalvine.yml": "67786c12d8f743153ed150167068885b477aa794aae376e08e797deb4ad9e090",
  "lab-checks.yml": "837de9b4375505cb99b970a434399b9b667f0d494a3d45f804eb49ab87040e32",
  "quality.yml": "8554cd27692cf727be126cc5837c9ba4244954bdf205ac544c8033c7ea4e4343",
});
const repository = fileURLToPath(new URL("../", import.meta.url));
const jobNames = ["preflight", "validation", "plan", "apply", "destroy", "followup", "drift"];
const gate = "    if: vars.WORKSHOP_AZURE_ENABLED == 'true' && !github.event.repository.is_template && github.event.repository.private && github.ref == 'refs/heads/main' && github.ref_protected\n";

export function normalizeWorkflow(text) {
  assert.equal(typeof text, "string", "Workflow source must be UTF-8 text");
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

function assertReferenceInvariants(reference) {
  // Called ONLY after the independently pinned digest matches. These literal
  // slices explain the reviewed contract; they do not certify arbitrary YAML.
  const job = (name) => {
    const marker = `\n  ${name}:\n`;
    const start = reference.indexOf(marker);
    assert.ok(start >= 0, `Required delivery job missing: ${name}`);
    const ends = jobNames.map((next) => reference.indexOf(`\n  ${next}:\n`, start + marker.length)).filter((end) => end >= 0);
    return reference.slice(start, ends.length ? Math.min(...ends) + 1 : undefined);
  };
  requireText(reference, "on:\n  push:\n    branches: [main]\n", "Only a main push starts deployment");
  requireText(reference, "        options: [followup, destroy]\n        default: followup\n", "Only followup/destroy are manual operations");
  requireText(reference, "permissions: {}\n", "Workflow permissions must default to none");
  requireText(reference, "  cancel-in-progress: false\n", "Do not cancel state writers");
  for (const name of ["preflight", "validation"]) {
    const section = job(name);
    requireText(section, gate, `${name} needs the disabled/template/private/protected-main gate`);
    requireText(section, "    runs-on: ubuntu-24.04\n", `${name} must use a hosted runner`);
    requireText(section, "      contents: read\n", `${name} needs only read access`);
    for (const forbidden of ["id-token:", "secrets.", "    environment:", "ws2-trusted", "continue-on-error:"]) {
      assert.ok(!section.includes(forbidden), `${name} must not receive cloud credentials, trusted runners or an error bypass`);
    }
  }
  requireText(job("preflight"), "branch.commit.sha !== context.sha", "Check current protected main before validation");
  requireText(job("preflight"), "GITHUB_RUN_ATTEMPT !== '1'", "Reject credentialled reruns");
  requireText(job("preflight"), "policy.assertEnvironmentProtection(environment, branches, name === 'dev-apply')", "Keep real environment protection checks");
  const validation = job("validation");
  requireText(validation, "    needs: preflight\n", "Validation must follow trusted metadata preflight");
  requireText(validation, "    permissions:\n      contents: read\n    steps:\n", "Validation must have read-only permissions and no environment secrets");
  for (const command of ["npm test", "npm run kit:check", "npm run workflow:check", "node scripts/check-learner.mjs"]) {
    requireText(validation, `      - run: ${command}\n`, `Validation must execute ${command}`);
  }
  for (const name of ["validation", "plan", "apply", "destroy"]) {
    requireText(job(name), "          node-version: 24.16.0\n", "Keep the pinned Node runtime");
    requireText(job(name), "          terraform_version: 1.16.1\n          terraform_wrapper: false\n", "Keep the pinned unwrapped Terraform CLI");
  }
  for (const name of ["preflight", "validation", "plan", "apply", "destroy"]) {
    requireText(job(name), "          ref: ${{ github.sha }}\n          persist-credentials: false\n", "Every code checkout must use the same immutable event SHA without persisted credentials");
  }
  requireText(job("plan"), "    needs: [preflight, validation]\n", "Privileged planning must depend on successful validation");
  requireText(job("plan"), "    environment: dev-plan\n", "Keep the distinct planning environment");
  requireText(job("plan"), "run: node scripts/delivery.mjs plan\n", "Use the existing fixed-scope plan driver");
  const sealing = job("plan").indexOf("run: node scripts/plan-envelope.mjs seal");
  assert.ok(sealing >= 0 && sealing < job("plan").indexOf("uses: actions/upload-artifact@"), "Seal before upload");
  requireText(job("plan"), "          path: .workshop/sealed/plan.enc\n", "Upload only the encrypted envelope");
  for (const name of ["apply", "destroy"]) {
    const section = job(name);
    requireText(section, "      pull-requests: read\n", "The approval guard must read source PR metadata");
    requireText(section, "    needs: [preflight, plan]\n", "Mutation must consume this run's plan");
    requireText(section, "    environment: dev-apply\n", "Independent apply/cleanup environment approval is required");
    requireText(section, "          name: ${{ needs.plan.outputs.artifact }}\n", "Do not import another run's artifact");
    requireText(section, "          CURRENT_MAIN_SHA: ${{ steps.approval.outputs.main_sha }}\n", "Retain the current-main binding");
    requireText(section, "          EXPECTED_PLAN_HASH: ${{ needs.plan.outputs.plan_sha256 }}\n", "Retain the exact plan digest");
    requireText(section, "          EXPECTED_MANIFEST_HASH: ${{ needs.plan.outputs.manifest_sha256 }}\n", "Retain the manifest digest");
    const approval = section.indexOf("await require('./scripts/approval.cjs')");
    const open = section.indexOf("run: node scripts/plan-envelope.mjs open");
    const mutation = section.indexOf(`run: node scripts/delivery.mjs ${name}`);
    assert.ok(approval >= 0 && open > approval && mutation > open, "Approve, then decrypt, then apply the exact saved plan");
  }
  requireText(job("apply"), "needs.preflight.outputs.operation == 'deploy' && needs.plan.result == 'success'", "Main push must flow into the same-run apply, not a second dispatch");
  requireText(job("destroy"), "needs.preflight.outputs.operation == 'destroy' && needs.plan.result == 'success'", "Destroy must remain explicit");
  requireText(job("followup"), 'test "$PLAN_EXIT" = 0', "Only a genuine fresh exit zero proves no-change");
}

export function validateWorkflowSources({ reference, workflows }) {
  const reviewed = normalizeWorkflow(reference);
  assert.ok(workflowHash(reviewed) === REFERENCE_SHA256, "Reference drift: restore the reviewed solutions/delivery.yml; never update a pin just to pass");
  assertReferenceInvariants(reviewed);
  const expected = ["delivery.yml", ...Object.keys(COMPANION_SHA256)].sort();
  assert.ok(workflows && typeof workflows === "object" && !Array.isArray(workflows), "Supply the installed workflow inventory");
  assert.ok(JSON.stringify(Object.keys(workflows).sort()) === JSON.stringify(expected), "Workflow inventory differs: keep one delivery.yml and the three reviewed companions; additional/renamed .yml or .yaml files require instructor review (possible duplicate live writer)");
  assert.ok(normalizeWorkflow(workflows["delivery.yml"]) === reviewed, "Canonical delivery.yml differs from the trusted reference: compare the complete sections, events, permissions and gates; do not edit the checker/reference to hide an error");
  for (const [name, hash] of Object.entries(COMPANION_SHA256)) {
    assert.ok(workflowHash(workflows[name]) === hash, `Unreviewed companion workflow change: ${name}; keep PR code off trusted runners and Azure credentials`);
  }
  return { deliverySha256: REFERENCE_SHA256, deliveryWorkflows: 1, companionWorkflows: 3 };
}

async function regularFile(path) {
  const info = await lstat(path);
  assert.ok(info.isFile() && !info.isSymbolicLink(), "Workflow inputs must be regular files, not links or directories");
  return readFile(path, "utf8");
}

export async function readWorkflowSources(root = repository) {
  for (const folder of [".github", ".github/workflows", "solutions"]) {
    const info = await lstat(join(root, folder));
    assert.ok(info.isDirectory() && !info.isSymbolicLink(), "Workflow/reference folders must not be symbolic links");
  }
  const workflows = {};
  for (const entry of await readdir(join(root, ".github/workflows"))) {
    if (/\.ya?ml$/i.test(entry)) workflows[entry] = await regularFile(join(root, ".github/workflows", entry));
  }
  return { reference: await regularFile(join(root, "solutions/delivery.yml")), workflows };
}

export async function checkWorkflow(root = repository) {
  return validateWorkflowSources(await readWorkflowSources(root));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    assert.ok(process.argv.length === 2, "This read-only checker has no update, skip or override flags");
    const result = await checkWorkflow();
    console.log(`Workflow authoring passed: ${result.deliveryWorkflows} canonical delivery workflow; ${result.companionWorkflows} reviewed companions. No Azure operations or live completion claimed.`);
  } catch (error) {
    console.error(`Workflow authoring stopped: ${error.message}`);
    process.exitCode = 1;
  }
}
