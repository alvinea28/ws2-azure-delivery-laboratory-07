import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { textHash } from "../scripts/module-snapshot.mjs";
const script = fileURLToPath(new URL("../scripts/refresh-snapshot.mjs", import.meta.url));
const names = ["main.tf", "variables.tf", "outputs.tf", "versions.tf", "modules/subnet-security/main.tf", "modules/subnet-security/variables.tf", "modules/subnet-security/outputs.tf", "modules/subnet-security/versions.tf"];

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "ws2-object-export-"));
  const git = (...args) => { const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", shell: false }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
  git("init", "-b", "dev"); git("config", "user.name", "Mock test fixture"); git("config", "user.email", "fixture@example.invalid"); git("config", "core.autocrlf", "false");
  git("remote", "add", "origin", "https://github.com/fixture/ws2-module-laboratory-07.git");
  for (const name of names) { const path = join(root, "module", name); await mkdir(dirname(path), { recursive: true }); await writeFile(path, `# TEST-ONLY Git object for ${name}\n`); }
  git("add", "."); git("commit", "-m", "test fixture only; no remote push");
  const sha = git("rev-parse", "HEAD");
  const run = () => spawnSync(process.execPath, [script, "--checkout", root, "--repository", "fixture/ws2-module-laboratory-07", "--revision", sha, "--subdirectory", "module"], { encoding: "utf8", shell: false });
  return { root, git, sha, run, clean: () => rm(root, { recursive: true, force: true }) };
}

test("snapshot preview derives normalized hashes from the actual approved Git objects and preserves EOF", async () => {
  const f = await fixture(); try {
    const r = f.run(); assert.equal(r.status, 0, r.stderr);
    const lock = JSON.parse(r.stdout.slice(0, r.stdout.indexOf("\nInspection only.")));
    assert.equal(lock.revision, f.sha); assert.equal(lock.subdirectory, "module"); assert.equal(lock.files.length, 8);
    for (const item of lock.files) assert.equal(item.sha256, textHash(await readFile(join(f.root, "module", item.path), "utf8")));
  } finally { await f.clean(); }
});

test("snapshot export rejects changed bytes hidden from ordinary Git status", async () => {
  const f = await fixture(); try {
    f.git("update-index", "--assume-unchanged", "module/main.tf");
    await writeFile(join(f.root, "module/main.tf"), "# changed fixture hidden from status\n");
    assert.equal(f.git("status", "--porcelain", "--untracked-files=no"), "");
    const r = f.run(); assert.equal(r.status, 1); assert.match(r.stderr, /Working module bytes differ from the approved Git object/);
  } finally { await f.clean(); }
});

test("snapshot export rejects untracked HCL that is absent from the approved Git inventory", async () => {
  const f = await fixture(); try {
    await writeFile(join(f.root, "module/extra.tf"), "# unreviewed fixture\n");
    const r = f.run(); assert.equal(r.status, 1); assert.match(r.stderr, /Working module inventory differs/);
  } finally { await f.clean(); }
});