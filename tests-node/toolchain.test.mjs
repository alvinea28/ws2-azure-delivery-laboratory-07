import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("readonly consumer lock includes vendor-verified Linux and Windows package hashes", async () => {
  const lock = await readFile(new URL("../environments/dev/.terraform.lock.hcl", import.meta.url), "utf8");
  assert.match(lock, /version\s*=\s*"5\.4\.0"/);
  // Obtained from signed Terraform providers lock for both workshop platforms.
  assert.ok(lock.includes("h1:4xGletTd+9kqkVRVUyJaz9370oSOAwsQ1fMRJrTYulI="), "Linux h1 is required for readonly init followed by validate");
  assert.ok(lock.includes("h1:UJfP9Tnc7JLSgX3LCbCPhl/I3Ek8Nj7r7XsPpEDEjYM="), "Windows h1 is required for the instructor workstation");
  const workflow = await readFile(new URL("../.github/workflows/lab-checks.yml", import.meta.url), "utf8");
  const checker = await readFile(new URL("../scripts/check-learner.mjs", import.meta.url), "utf8");
  assert.ok(workflow.includes("node scripts/check-learner.mjs"), "Actual learner workflow must invoke the shipped checker");
  assert.ok(checker.includes("-lockfile=readonly"), "Do not hide missing platform locks with implicit CI updates");
});
