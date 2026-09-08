import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";
import { sealPlan, openPlan } from "../scripts/plan-envelope.mjs";
import { terraformEnvironment, currentMain, classifyTerraformFailure } from "../scripts/delivery.mjs";
import { remoteRepository } from "../scripts/refresh-snapshot.mjs";

const pair = () => generateKeyPairSync("rsa", { modulusLength: 3072, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
const keys = pair();
const other = pair();
const plan = Buffer.from("SYNTHETIC-STATE-AND-PLAN-NOT-CLOUD-EVIDENCE");
const manifest = Buffer.from('{"fixture":true}');

test("encrypted artifact contains no plaintext state and round-trips exact binary plan/manifest", () => {
  const sealed = sealPlan(plan, manifest, keys.publicKey);
  assert.ok(!sealed.includes(plan));
  assert.ok(!sealed.includes(manifest));
  assert.deepEqual(openPlan(sealed, keys.privateKey), { plan, manifest });
});

test("randomized envelope encryption never reuses a key/nonce for equal plans", () => {
  assert.notDeepEqual(sealPlan(plan, manifest, keys.publicKey), sealPlan(plan, manifest, keys.publicKey));
});

test("wrong decryption key and tampered encrypted material fail closed", () => {
  const sealed = sealPlan(plan, manifest, keys.publicKey);
  assert.throws(() => openPlan(sealed, other.privateKey));
  for (const field of ["key", "iv", "tag", "ciphertext"]) {
    const tampered = JSON.parse(sealed);
    const bytes = Buffer.from(tampered[field], "base64"); bytes[0] ^= 255;
    tampered[field] = bytes.toString("base64");
    assert.throws(() => openPlan(Buffer.from(JSON.stringify(tampered)), keys.privateKey), field);
  }
});

test("unsupported envelope and missing payload are rejected", () => {
  const sealed = JSON.parse(sealPlan(plan, manifest, keys.publicKey));
  assert.throws(() => openPlan(Buffer.from(JSON.stringify({ ...sealed, version: 2 })), keys.privateKey));
  assert.throws(() => sealPlan(Buffer.alloc(0), manifest, keys.publicKey));
});

test("Terraform child environment excludes ambient credentials, alternate workspaces, Git rewrites and private plan key", () => {
  const env = terraformEnvironment({ PATH: "test-path", ARM_CLIENT_ID: "plan-id", ACTIONS_ID_TOKEN_REQUEST_TOKEN: "synthetic-id-request", ARM_CLIENT_CERTIFICATE: "bad", ARM_CLIENT_SECRET_FILE_PATH: "bad", TF_WORKSPACE: "other-team", TF_DATA_DIR: "other-state", TF_CLI_ARGS_apply: "-lock=false", GIT_CONFIG_NOSYSTEM: "0", GIT_CONFIG_VALUE_0: "exfiltration", GITHUB_TOKEN: "synthetic-token", MODULE_READ_TOKEN: "synthetic-token", PLAN_DECRYPTION_PRIVATE_KEY: "synthetic-key", LD_PRELOAD: "/untrusted", NODE_OPTIONS: "--require bad" });
  assert.equal(env.PATH, "test-path");
  assert.equal(env.ARM_CLIENT_ID, "plan-id");
  assert.equal(env.TF_WORKSPACE, "default");
  assert.equal(env.ARM_USE_OIDC, "true");
  assert.equal(env.ARM_USE_AZUREAD, "true");
  assert.equal(env.GIT_CONFIG_NOSYSTEM, "1");
  assert.equal(env.GIT_CONFIG_VALUE_0, "");
  for (const key of ["ARM_CLIENT_CERTIFICATE", "ARM_CLIENT_SECRET_FILE_PATH", "TF_DATA_DIR", "TF_CLI_ARGS_apply", "GITHUB_TOKEN", "MODULE_READ_TOKEN", "PLAN_DECRYPTION_PRIVATE_KEY", "LD_PRELOAD", "NODE_OPTIONS"]) assert.equal(env[key], undefined, key);
});

test("pre-apply main lookup rejects branch movement during init and refuses failed API checks", async () => {
  const config = { repository: "offline/example", sha: "a".repeat(40) };
  const response = (sha, protectedBranch = true) => async () => ({ ok: true, json: async () => ({ protected: protectedBranch, commit: { sha } }) });
  assert.equal(await currentMain(config, response(config.sha)), config.sha);
  await assert.rejects(currentMain(config, response("b".repeat(40))), /Main changed during initialization/);
  await assert.rejects(currentMain(config, response(config.sha, false)));
  await assert.rejects(currentMain(config, async () => ({ ok: false })), /Cannot recheck/);
});

test("sanitized failure categories never echo arbitrary diagnostics or credentials", () => {
  for (const [input, expected] of [["AADSTS700213 synthetic-private-value", "OIDC trust mismatch"], ["AuthorizationPermissionMismatch synthetic-private-value", "resource or storage RBAC/authorization"], ["dial tcp synthetic-private-value", "private DNS/network connectivity"], ["state lock synthetic-private-value", "state lease or concurrent writer"]]) assert.equal(classifyTerraformFailure(input), expected);
  assert.ok(!classifyTerraformFailure("synthetic-private-value").includes("synthetic-private-value"));
});

test("snapshot origin parser accepts only credential-free GitHub origins", () => {
  assert.equal(remoteRepository("https://github.com/team/module.git"), "team/module");
  assert.equal(remoteRepository("git@github.com:team/module.git"), "team/module");
  for (const origin of ["https://token@github.com/team/module.git", "https://elsewhere.invalid/team/module", "file:///tmp/repo", "https://github.com/team/module/extra"]) assert.throws(() => remoteRepository(origin));
});
