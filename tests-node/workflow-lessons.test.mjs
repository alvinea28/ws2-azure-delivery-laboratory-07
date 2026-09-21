import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, posix } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Pedagogical fidelity is deliberately separate from workflow/control digests.
// These tests inspect local text; they never update Exercise progress or call APIs.
const root = fileURLToPath(new URL("../", import.meta.url));
const read = async (path) => (await readFile(join(root, path), "utf8")).replaceAll("\r\n", "\n");
const { outsideCodeFences } = createRequire(import.meta.url)("../.github/agentalvine/auto-guide.cjs");
const course = JSON.parse(await read(".github/agentalvine/course.json"));

test("startup README replacement preserves every required beginner instruction outside the automation marker", async () => {
  const readme = await read("README.md");
  const start = readme.indexOf("<!-- AGENTALVINE:START -->");
  const end = readme.indexOf("<!-- AGENTALVINE:END -->") + "<!-- AGENTALVINE:END -->".length;
  assert.ok(start >= 0 && end > start);
  const started = readme.slice(0, start) + "<!-- AGENTALVINE:START -->\n### Your exercise is ready\nStart here: your own Exercise issue.\n<!-- AGENTALVINE:END -->" + readme.slice(end);
  for (const phrase of ["Git: Clone", "VS Code", "Copilot", "docs/start-here.md", "Private", "independent", "Public source template", "not the clone URL"]) assert.ok(started.includes(phrase), `Startup must retain ${phrase} outside the replaced block`);
});

function rebase(markdown, source) {
  return outsideCodeFences(markdown, (part) => part.replace(/\]\(([^)\s]+)\)/g, (match, href) => {
    if (/^(?:[a-z]+:|#)/i.test(href)) return match;
    const separator = href.indexOf("#");
    const path = separator < 0 ? href : href.slice(0, separator);
    const fragment = separator < 0 ? "" : href.slice(separator);
    let target = posix.normalize(posix.join(posix.dirname(source), decodeURIComponent(path)));
    const step = /^\.github\/steps\/(\d\d)\.md$/.exec(target);
    if (step) target = `full-ws-content/activity-${step[1]}.md`;
    return `](${posix.relative("full-ws-content", target).replaceAll(" ", "%20")}${fragment})`;
  }));
}

function mirroredBody(text, kind) {
  const start = `<!-- FULL-WS-${kind}:START -->`;
  const end = `<!-- FULL-WS-${kind}:END -->`;
  assert.equal(text.split(start).length, 2, "Keep exactly one mirror start marker");
  assert.equal(text.split(end).length, 2, "Keep exactly one mirror end marker");
  return text.split(start)[1].split(end)[0].trim();
}

test("workflow authoring retains the five original course gates, including real named cloud jobs", () => {
  assert.equal(course.number, 7);
  assert.deepEqual(course.steps.map(({ id, requiresCommit }) => ({ id, requiresCommit })), [
    { id: "1", requiresCommit: true }, { id: "2", requiresCommit: false },
    { id: "3", requiresCommit: true }, { id: "4", requiresCommit: false }, { id: "5", requiresCommit: false },
  ]);
  assert.deepEqual(course.steps[0].checks, [{
    kind: "file", path: "exercise/identity-map.md",
    contains: ["Reader", "Contributor", "Storage Blob Data Contributor", "lease", "AZURE_PLAN_CLIENT_ID", "AZURE_APPLY_CLIENT_ID", "STATE_CONTAINER", "STATE_KEY"],
    notContains: ["TODO"],
  }]);
  const jobs = [
    ["Trusted dev plan"], ["Trusted dev plan", "Apply reviewed dev plan"],
    ["Trusted dev plan", "Confirm no-change"], ["Trusted dev plan", "Destroy reviewed dev plan"],
  ];
  for (const [index, expected] of jobs.entries()) {
    const checks = course.steps[index + 1].checks.filter((check) => check.kind === "trusted-run");
    assert.deepEqual(checks, [{ kind: "trusted-run", file: "delivery.yml", jobs: expected }]);
  }
  assert.ok(course.steps[2].checks.some((check) => check.path === "exercise/plan-review.md" && check.notContains.includes("TODO")));
});

for (const step of course.steps) {
  test(`full-content activity ${step.id} exactly mirrors its installed lesson outside rebased links`, async () => {
    const number = step.id.padStart(2, "0");
    const lesson = await read(step.lesson);
    const mirror = await read(`full-ws-content/activity-${number}.md`);
    assert.ok(mirroredBody(mirror, "LESSON") === rebase(lesson, step.lesson).trim(), `Activity ${number} mirror drift; update only the current lesson body, not historical outcomes`);
    assert.ok(mirror.includes("## Original Cycle A/B outcome"), "Preserve the original outcome section");
  });
}

test("the full setup mirror preserves all canonical setup content including required authoring", async () => {
  const setup = await read("docs/start-here.md");
  const mirror = await read("full-ws-content/00-start-here.md");
  assert.ok(mirroredBody(mirror, "SETUP") === rebase(setup, "docs/start-here.md").trim(), "Setup mirror drift");
});

test("core authoring is linked from actual Step 1/2, landing, setup and instructor entry points", async () => {
  for (const path of ["README.md", "docs/start-here.md", "docs/instructor-preflight.md", ".github/steps/01.md", ".github/steps/02.md", "full-ws-content/README.md"]) {
    const text = await read(path);
    assert.ok(text.includes("workflow-authoring.md"), `${path} must link the required task`);
  }
  const first = await read(".github/steps/01.md");
  for (const token of ["lab/workflow-authoring", "WORKSHOP_AZURE_ENABLED=false", "npm run workflow:check", "solutions/delivery.yml", "already complete"]) assert.ok(first.includes(token), `Step 1 must explain ${token}`);
  const guide = await read("docs/workflow-authoring.md");
  for (const token of ["untitled", "same-run apply", "no second dispatch", "two explicit provider-mocked", "not a security boundary", "does **not** independently query Azure"]) assert.ok(guide.includes(token), `Core tutorial must explain ${token}`);
});

test("updated authoring and operational guidance has resolvable local file links", async () => {
  const paths = ["README.md", "docs/workflow-authoring.md", "docs/start-here.md", "docs/instructor-preflight.md", "docs/delivery-configuration.md", "docs/plan-review.md", "docs/recovery.md", "full-ws-content/README.md", "full-ws-content/00-start-here.md", ...course.steps.map((step) => step.lesson), ...course.steps.map((step) => `full-ws-content/activity-${step.id.padStart(2, "0")}.md`)];
  for (const source of paths) {
    const links = [];
    outsideCodeFences(await read(source), (part) => { links.push(...part.matchAll(/\]\(([^)\s]+)\)/g)); return part; });
    for (const [, href] of links) {
      if (/^(?:[a-z]+:|#)/i.test(href)) continue;
      const target = posix.normalize(posix.join(posix.dirname(source), decodeURIComponent(href.split("#")[0])));
      assert.ok(!target.startsWith("../"), `Link escapes this standalone lab: ${source}`);
      await access(join(root, target)).catch(() => assert.fail(`Broken local link in ${source}: ${href}`));
    }
  }
});
