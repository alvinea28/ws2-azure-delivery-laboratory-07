import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => readFile(join(root, file), "utf8");
const graph = JSON.parse(await read(".opencode/memory/graph.json"));
assert.equal(graph.version, 1);
const ids = new Set(graph.nodes.map((node) => node.id));
assert.equal(ids.size, graph.nodes.length);
for (const node of graph.nodes) await access(join(root, node.id));
for (const edge of graph.edges) assert.ok(ids.has(edge.from) && ids.has(edge.to), "Graph edge endpoint missing");
if (!process.argv.includes("--graph-only")) {
  const manifest = JSON.parse(await read(".github/agentalvine/lab.json"));
  assert.equal(new Set(manifest.steps.map((step) => step.id)).size, manifest.steps.length);
  for (const step of manifest.steps) {
    const lesson = await read(step.lesson);
    assert.ok(lesson.includes(step.id));
    assert.match(lesson, /@agentalvine check/);
    assert.match(lesson, /Copilot/);
    // These are learner acceptance targets, not kit-completion assertions.
    // Missing implementations/outputs are intentionally checked only on submission.
    for (const file of step.files) assert.match(file, /^[\w./-]+$/);
    for (const check of step.contains || []) {
      assert.match(check.path, /^[\w./-]+$/);
      assert.equal(typeof check.text, "string");
      assert.ok(check.text.length > 0);
    }
    for (const workflow of step.ciWorkflows) await access(join(root, ".github/workflows", workflow));
    const evidence = JSON.parse(await read(step.evidence.replace(".json", ".example.json")));
    assert.equal(evidence.topic, step.id);
    for (const file of evidence.artifacts) assert.match(file, /^[\w./-]+$/);
    for (const expected of step.runEvidence || []) {
      const workflow = await read(`.github/workflows/${expected.workflow}`);
      assert.ok(workflow.includes(`name: ${expected.job}`), `${step.id} references a missing live job`);
    }
  }
  for (const file of await readdir(join(root, ".github/workflows"))) {
    if (!/\.ya?ml$/.test(file)) continue;
    const workflow = await read(`.github/workflows/${file}`);
    for (const match of workflow.matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)/gm)) {
      if (match[1].startsWith("./")) continue;
      assert.match(match[1], /^[\w./-]+@[a-f0-9]{40}$/, `${file} action is not SHA-pinned`);
    }
    assert.ok(!workflow.includes("pull_request_target:") && !workflow.includes("workflow_run:"), "No privileged untrusted-code event is required by this workshop");
    if (["quality.yml", "validate.yml", "module-ci.yml"].includes(file)) {
      assert.ok(!/id-token:|secrets\.|ws2-trusted|contents: write|secrets: inherit/.test(workflow), `${file} crossed the PR credential boundary`);
    }
  }
  // Relative links are checked, except intentionally uncreated participant evidence.
  async function links(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if ([".git", ".terraform", "node_modules", ".workshop"].includes(entry.name)) continue;
      const name = join(directory, entry.name);
      if (entry.isDirectory()) { await links(name); continue; }
      if (!entry.name.endsWith(".md")) continue;
      const markdown = await readFile(name, "utf8");
      for (const match of markdown.matchAll(/(?<!!)\]\(([^)\s]+)\)/g)) {
        const url = match[1];
        if (/^(?:[a-z]+:|#)/i.test(url)) continue;
        const target = resolve(dirname(name), decodeURIComponent(url.split("#")[0]));
        if (/[/\\]evidence[/\\][^/\\]+\.json$/.test(target) && !target.endsWith(".example.json")) continue;
        await access(target).catch(() => { throw new Error(`Broken relative link in ${name}: ${url}`); });
      }
    }
  }
  await links(root);
  console.log(`AgentAlvine kit verified: ${manifest.steps.length} guided steps; manifests, links, action pins and credential boundaries checked.`);
}
console.log(`Repository graph verified: ${graph.nodes.length} nodes, ${graph.edges.length} edges.`);
