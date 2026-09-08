import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile, rm, lstat, realpath } from "node:fs/promises";
import { resolve, join, dirname, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { moduleFiles, textHash, validateLock, verifySnapshot } from "./module-snapshot.mjs";

const repository = fileURLToPath(new URL("../", import.meta.url));

export function remoteRepository(remote) {
  const match = remote.match(/^(?:https:\/\/github\.com\/|git@github\.com:)([\w.-]+\/[\w.-]+?)(?:\.git)?$/);
  assert.ok(match, "Use a credential-free github.com origin URL; tokens must never be embedded in Git remotes");
  return match[1];
}

export async function refresh(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--write") { options.write = true; continue; }
    assert.ok(["--checkout", "--repository", "--revision", "--subdirectory"].includes(args[i]) && args[i + 1] !== undefined, "Use --checkout PATH --repository OWNER/REPO --revision FULL_SHA [--subdirectory PATH] [--write]");
    options[args[i].slice(2)] = args[++i];
  }
  assert.ok(options.checkout && options.repository && /^[a-f0-9]{40}$/.test(options.revision));
  assert.notEqual(options.revision, "0".repeat(40), "A real reviewed commit is required");
  const checkout = resolve(options.checkout);
  const subdirectory = options.subdirectory || "";
  const lock = { schemaVersion: 1, repository: options.repository, revision: options.revision, subdirectory, source: `git::https://github.com/${options.repository}.git${subdirectory ? `//${subdirectory}` : ""}?ref=${options.revision}`, provenanceStatus: "verified-git-export", normalization: "UTF-8 text with CRLF normalized to LF; EOF is preserved", files: [] };
  const source = resolve(checkout, subdirectory);
  assert.ok(source === checkout || source.startsWith(`${checkout}${sep}`), "Export path must remain inside the verified checkout");
  assert.ok(!(await lstat(source)).isSymbolicLink(), "Linked export roots are not allowed");
  assert.ok((await realpath(source)) === (await realpath(checkout)) || (await realpath(source)).startsWith(`${await realpath(checkout)}${sep}`));
  const git = (parameters, raw = false) => {
    const result = spawnSync("git", ["-C", checkout, "-c", "core.fsmonitor=false", ...parameters], { encoding: "utf8", shell: false, timeout: 30_000 });
    assert.equal(result.status, 0, "Cannot verify the approved module checkout");
    return raw ? result.stdout : result.stdout.trim();
  };
  assert.equal(git(["rev-parse", "HEAD"]), options.revision, "Checkout is not at the approved revision");
  assert.equal(git(["status", "--porcelain", "--untracked-files=no"]), "", "Tracked module changes must be committed and reviewed first");
  assert.equal(remoteRepository(git(["remote", "get-url", "origin"])), options.repository, "Checkout origin differs from the approved module repository");
  const contents = new Map();
  const files = await moduleFiles(source);
  const tracked = git(["ls-tree", "-r", "--name-only", options.revision, "--", subdirectory || "."])
    .split(/\r?\n/).filter((file) => /\.tf(?:\.json)?$/.test(file))
    .map((file) => subdirectory ? file.slice(subdirectory.length + 1) : file).sort();
  assert.deepEqual(files, tracked, "Working module inventory differs from the approved Git objects");
  for (const file of files) {
    const text = (await readFile(join(source, file), "utf8")).replaceAll("\r\n", "\n");
    // Every exported file must be tracked at the approved commit, not an injected untracked file.
    git(["ls-files", "--error-unmatch", "--", subdirectory ? `${subdirectory}/${file}` : file]);
    const trackedPath = subdirectory ? `${subdirectory}/${file}` : file;
    const committed = git(["show", `${options.revision}:${trackedPath}`], true).replaceAll("\r\n", "\n");
    assert.equal(text, committed, `Working module bytes differ from the approved Git object: ${file}`);
    contents.set(file, committed);
    lock.files.push({ path: file, sha256: textHash(committed) });
  }
  validateLock(lock);
  if (!options.write) { console.log(JSON.stringify(lock, null, 2)); console.log("Inspection only. After instructor approval, repeat with --write and review the resulting PR diff."); return; }
  const target = join(repository, "vendor/network-baseline");
  // Explicitly requested instructor operation. No credentials, Azure or state.
  await rm(target, { recursive: true, force: true });
  for (const [file, text] of contents) {
    const destination = join(target, file);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, text, "utf8");
  }
  await verifySnapshot(target, lock);
  const mainPath = join(repository, "environments/dev/main.tf");
  const main = await readFile(mainPath, "utf8");
  assert.equal([...main.matchAll(/^\s*source\s*=\s*"[^"]+"/gm)].length, 1, "Unexpected module-source layout");
  await writeFile(mainPath, main.replace(/^(\s*source\s*=\s*)"[^"]+"/m, (_, prefix) => `${prefix}"${lock.source}"`), "utf8");
  await writeFile(join(repository, "module-lock.json"), `${JSON.stringify(lock, null, 2)}\n`, "utf8");
  console.log("Snapshot, exact source and provenance updated together. Review the diff, run offline checks, and merge through required peer review; do not deploy directly.");
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) refresh(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exitCode = 1; });
