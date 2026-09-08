import assert from "node:assert/strict";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { moduleSource, validateLock, verifySnapshot } from "./module-snapshot.mjs";

export async function prepareOffline(repository = fileURLToPath(new URL("../", import.meta.url))) {
  const source = join(repository, "environments/dev");
  const destination = join(repository, ".workshop/offline");
  const lock = JSON.parse(await readFile(join(repository, "module-lock.json"), "utf8"));
  const main = await readFile(join(source, "main.tf"), "utf8");
  validateLock(lock, moduleSource(main));
  await verifySnapshot(join(repository, "vendor/network-baseline"), lock);
  const entries = await readdir(source, { withFileTypes: true });
  const allowed = new Set(["main.tf", "versions.tf", "variables.tf", "outputs.tf", "providers.tf", "backend.tf"]);
  for (const item of entries) {
    assert.ok(!item.isSymbolicLink(), "Root symlinks are prohibited");
    if (/\.tf(?:\.json)?$/.test(item.name)) assert.ok(allowed.has(item.name), `Review added root file ${item.name}; offline checks must not silently omit it`);
  }
  // Rebuild only this dedicated disposable directory; never the canonical root.
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  for (const file of allowed) {
    if (file === "backend.tf") continue;
    let text = await readFile(join(source, file), "utf8");
    if (file === "main.tf") text = text.replace(lock.source, "./network-baseline");
    // Provider config is still schema-validated. All tests substitute mock_provider.
    await writeFile(join(destination, file), text, "utf8");
  }
  await cp(join(source, ".terraform.lock.hcl"), join(destination, ".terraform.lock.hcl"));
  await cp(join(repository, "vendor/network-baseline"), join(destination, "network-baseline"), { recursive: true });
  await cp(join(repository, "tests"), join(destination, "tests"), { recursive: true });
  // Ensure every test explicitly substitutes the provider and runs only a plan.
  const testFiles = await readdir(join(destination, "tests"));
  assert.ok(testFiles.includes("consumer.tftest.hcl"), "The required consumer regression suite must exist");
  for (const file of testFiles) {
    assert.match(file, /\.tftest\.hcl$/, "Unexpected auto-loaded test file");
    const test = await readFile(join(destination, "tests", file), "utf8");
    assert.match(test, /^mock_provider "azurerm"\s*\{/m);
    assert.ok(!/^\s*(?:provider\s+"|providers\s*=|alias\s*=|module\s*\{|override_module\s*\{)/m.test(test), "Do not redirect mocks to a live provider or replace the tested module");
    assert.ok([...test.matchAll(/^run "/gm)].length > 0, "Empty test files are not validation evidence");
    assert.equal([...test.matchAll(/^run "/gm)].length, [...test.matchAll(/^\s*command\s*=\s*plan\s*$/gm)].length);
    if (file === "consumer.tftest.hcl") for (const run of ["consumer_preserves_named_topology", "reject_bad_consumer_cidr"]) assert.ok(test.includes(`run "${run}"`), `Keep the required ${run} assertion`);
  }
  return destination;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  prepareOffline().then((root) => console.log(`Credential-free test root: ${root}`)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
