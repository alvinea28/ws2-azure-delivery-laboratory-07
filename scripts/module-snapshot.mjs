import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, lstat, realpath } from "node:fs/promises";
import { join, resolve } from "node:path";

export const textHash = (text) => createHash("sha256").update(text.replaceAll("\r\n", "\n")).digest("hex");
export const bytesHash = (data) => createHash("sha256").update(data).digest("hex");
export const sha = /^[a-f0-9]{40}$/;
export const digest = /^[a-f0-9]{64}$/;

export function validateLock(lock, source) {
  assert.equal(lock.schemaVersion, 1, "Unsupported module lock schema");
  assert.match(lock.repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
  assert.match(lock.revision, sha, "Pin the module to a full reviewed commit SHA");
  assert.notEqual(lock.revision, "0".repeat(40), "A placeholder is not an immutable module revision");
  assert.ok(lock.subdirectory === "" || /^[\w-]+(?:\/[\w.-]+)*$/.test(lock.subdirectory));
  assert.ok(!lock.subdirectory.split("/").some((part) => part === ".."));
  const expected = `git::https://github.com/${lock.repository}.git${lock.subdirectory ? `//${lock.subdirectory}` : ""}?ref=${lock.revision}`;
  assert.equal(lock.source, expected, "Module source must match the approved repository/revision/subdirectory");
  if (source !== undefined) assert.equal(source, expected, "Consumer and dependency lock disagree");
  assert.ok(Array.isArray(lock.files) && lock.files.length >= 8 && lock.files.length <= 100);
  const names = lock.files.map((file) => file.path);
  assert.equal(new Set(names).size, names.length, "Duplicate module paths");
  for (const file of lock.files) {
    assert.match(file.path, /^(?:modules\/[\w-]+\/)*[\w-]+\.tf$/);
    assert.match(file.sha256, digest);
  }
  for (const file of ["main.tf", "variables.tf", "outputs.tf", "versions.tf", "modules/subnet-security/main.tf", "modules/subnet-security/variables.tf", "modules/subnet-security/outputs.tf", "modules/subnet-security/versions.tf"]) assert.ok(names.includes(file), `Missing ${file}`);
  return lock;
}

export function moduleSource(main) {
  const sources = [...main.matchAll(/^\s*source\s*=\s*"([^"]+)"/gm)];
  assert.equal(sources.length, 1, "The dev root must contain one exact module source");
  assert.match(main, /module\s+"network"\s*\{/);
  return sources[0][1];
}

export async function moduleFiles(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), "Module snapshots cannot contain symlinks");
    const file = `${prefix}${entry.name}`;
    if (entry.isFile() && /\.tf(?:\.json)?$/.test(file)) {
      assert.ok(!file.endsWith(".tf.json"), "Use auditable HCL, not additional JSON Terraform configuration");
      result.push(file);
    } else if (entry.isDirectory() && (file === "modules" || prefix.startsWith("modules/"))) result.push(...await moduleFiles(directory, `${file}/`));
  }
  return result.sort();
}

export async function verifySnapshot(directory, lock) {
  validateLock(lock);
  assert.ok(!(await lstat(directory)).isSymbolicLink(), "The snapshot root cannot be a symlink or junction");
  assert.deepEqual(await moduleFiles(directory), lock.files.map((file) => file.path).sort(), "Module HCL inventory differs from the approved snapshot");
  for (const file of lock.files) {
    const name = resolve(directory, file.path);
    assert.ok((await lstat(name)).isFile());
    assert.equal(textHash(await readFile(name, "utf8")), file.sha256, `Module snapshot changed: ${file.path}`);
  }
  return true;
}

export async function verifyInstalledModule(root, lock) {
  const data = JSON.parse(await readFile(join(root, ".terraform/modules/modules.json"), "utf8"));
  const installed = data.Modules.find((item) => item.Key === "network");
  assert.equal(installed?.Source, lock.source, "Terraform installed an unexpected module source");
  const dir = resolve(root, installed.Dir);
  assert.ok(dir.startsWith(`${resolve(root, ".terraform/modules")}${process.platform === "win32" ? "\\" : "/"}`), "Installed module directory escaped Terraform's module cache");
  for (const parent of [root, join(root, ".terraform"), join(root, ".terraform/modules")]) assert.ok(!(await lstat(parent)).isSymbolicLink(), "Terraform module-cache ancestors cannot be linked outside the workload");
  assert.ok((await realpath(dir)).startsWith(`${await realpath(join(root, ".terraform/modules"))}${process.platform === "win32" ? "\\" : "/"}`), "Resolved module path escaped the verified cache");
  return verifySnapshot(dir, lock);
}
