import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

test("AgentAlvine observes dedicated cleanup completion without acquiring deployment permissions", async () => {
  const workflow = await read(".github/workflows/agentalvine.yml");
  assert.match(workflow, /workflows: \[Workshop quality, Lab checks, Trusted dev delivery \(instructor enablement required\), Trusted dev cleanup \(explicit owner authorization required\)\]/);
  assert.ok(workflow.includes("ref: ${{ github.event.repository.default_branch }}"));
  assert.doesNotMatch(workflow, /id-token:|secrets\.|download-artifact|self-hosted/);
  const starter = await read("exercise/plan-review.md");
  assert.match(starter, /automatic exact-plan apply/);
  assert.doesNotMatch(starter, /then approves the actual run/);
});

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
    const separator = href.search(/[?#]/);
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

test("workflow authoring preserves Step 1 and five steps while tracking the actual automatic apply and dedicated cleanup jobs", async () => {
  assert.equal(course.number, 7);
  assert.equal(course.lessonPresentation, "concise");
  assert.deepEqual(course.steps.map(({ checks }) => checks.length), [1, 1, 2, 1, 1]);
  assert.deepEqual(course.steps.map(({ id, requiresCommit }) => ({ id, requiresCommit })), [
    { id: "1", requiresCommit: true }, { id: "2", requiresCommit: false },
    { id: "3", requiresCommit: true }, { id: "4", requiresCommit: false }, { id: "5", requiresCommit: false },
  ]);
  assert.deepEqual(course.steps[0].checks, [{
    kind: "file", path: "exercise/identity-map.md",
    contains: ["Reader", "Contributor", "Storage Blob Data Contributor", "lease", "AZURE_PLAN_CLIENT_ID", "AZURE_APPLY_CLIENT_ID", "STATE_CONTAINER", "STATE_KEY"],
    notContains: ["TODO"],
  }]);
  const observations = [
    { file: "delivery.yml", jobs: ["Trusted dev plan"] },
    { file: "delivery.yml", jobs: ["Trusted dev plan", "Apply exact dev saved plan"] },
    { file: "delivery.yml", jobs: ["Trusted dev plan", "Confirm no-change"] },
    { file: "cleanup.yml", jobs: ["Trusted dev plan", "Apply exact authorized dev destroy plan"] },
  ];
  for (const [index, expected] of observations.entries()) {
    const checks = course.steps[index + 1].checks.filter((check) => check.kind === "trusted-run");
    assert.deepEqual(checks, [{ kind: "trusted-run", ...expected }]);
    const workflow = await read(`.github/workflows/${expected.file}`);
    const names = [...workflow.matchAll(/^    name: (.+)$/gm)].map((match) => match[1].trim());
    for (const name of expected.jobs) assert.ok(names.includes(name), `Observer job must exist in ${expected.file}: ${name}`);
  }
  assert.deepEqual(course.steps[2].checks.find((check) => check.kind === "file"), {
    kind: "file", path: "exercise/plan-review.md",
    contains: ["fresh plan", "digest", "2 hours", "automatic exact-plan apply", "separate cleanup authorization"],
    notContains: ["TODO"],
  });
  assert.doesNotMatch(course.description, /independent reviewers/i);
  assert.match(course.completion, /does not independently verify Azure configuration or resource absence/i);
  assert.match(course.completion, /progress is not Azure authorization/i);
  assert.deepEqual(course.repeatOnChange, ["module-lock.json", "environments/dev/main.tf", "environments/dev/outputs.tf", "exercise/capstone-cycle.md"]);
});

// The original dated outcomes are immutable, not rewritten as current success.
const historicalTails = [
  "06f18bb1fcd13c11d3dd065c65ab08ad91108cc9b87d2aa8573f5da16b0562da",
  "f38f8e3707f02c147ab8eea22423c4a238d2104af338ce11502f70e8427bd8d0",
  "dbdb5e7f1c159d1d341c2ce287759f14f3438891ec1913d171e30fe56b07199f",
  "3b5c7400516edf7126b19bcdf6a51c5531f096b72b384deface7358b01560996",
  "511a9a3738c0f5d8ce28d880e824819e7d79c63988f8d0e6da861d65bdaf42e6",
];
for (const step of course.steps) {
  test(`full-content activity ${step.id} exactly mirrors its installed lesson outside rebased links`, async () => {
    const number = step.id.padStart(2, "0");
    const lesson = await read(step.lesson);
    const mirror = await read(`full-ws-content/activity-${number}.md`);
    assert.ok(mirroredBody(mirror, "LESSON") === rebase(lesson, step.lesson).trim(), `Activity ${number} mirror drift; update only the current lesson body, not historical outcomes`);
    assert.ok(mirror.includes("## Original Cycle A/B outcome"), "Preserve the original outcome section");
    assert.equal(createHash("sha256").update(mirror.split("<!-- FULL-WS-LESSON:END -->")[1]).digest("hex"), historicalTails[Number(step.id) - 1]);
  });
}

test("the full setup mirror preserves canonical setup and the five-step route", async () => {
  const setup = await read("docs/start-here.md");
  const mirror = await read("full-ws-content/00-start-here.md");
  assert.ok(mirroredBody(mirror, "SETUP") === rebase(setup, "docs/start-here.md").trim(), "Setup mirror drift");
});

for (const name of ["azure-setup.md", "defender-posture-hands-on.md"]) {
  test(`${name} retains complete canonical content with only outside-fence links rebased`, async () => {
    const source = `docs/${name}`;
    assert.equal((await read(`full-ws-content/${name}`)).trim(), rebase(await read(source), source).trim());
  });
}

test("workflow construction is inside Step 1 rather than delegated to an additional required tutorial", async () => {
  const first = await read(".github/steps/01.md");
  for (const token of ["lab/workflow-authoring", "WORKSHOP_AZURE_ENABLED=false", "npm run workflow:check", "solutions/delivery.yml", "File → New Text File → YAML", "one complete save"]) assert.ok(first.includes(token), `Step 1 must teach ${token}`);
  assert.doesNotMatch(first, /workflow-authoring\.md/);
  assert.match(await read("docs/workflow-authoring.md"), /\*\*Optional reference\.\*\*/);
});

test("updated authoring and operational guidance has resolvable local file links", async () => {
  const paths = ["README.md", ".github/agentalvine/README.md", "docs/workflow-authoring.md", "docs/start-here.md", "docs/instructor-preflight.md", "docs/delivery-configuration.md", "docs/plan-review.md", "docs/recovery.md", "docs/pr-author-merge.md", "docs/git-workflow.md", "docs/copilot-guide.md", "docs/identity-state.md", "docs/dependency-snapshot.md", "docs/glossary.md", "docs/troubleshooting.md", "docs/azure-setup.md", "docs/defender-posture-hands-on.md", "full-ws-content/README.md", "full-ws-content/00-start-here.md", "full-ws-content/azure-setup.md", "full-ws-content/defender-posture-hands-on.md", ...course.steps.map((step) => step.lesson), ...course.steps.map((step) => `full-ws-content/activity-${step.id.padStart(2, "0")}.md`)];
  for (const source of paths) {
    const links = [];
    outsideCodeFences(await read(source), (part) => { links.push(...part.matchAll(/\]\(([^)\s]+)\)/g)); return part; });
    for (const [, href] of links) {
      if (/^(?:[a-z]+:|#)/i.test(href)) continue;
      const target = posix.normalize(posix.join(posix.dirname(source), decodeURIComponent(href.split(/[?#]/)[0])));
      assert.ok(!target.startsWith("../"), `Link escapes this standalone lab: ${source}`);
      await access(join(root, target)).catch(() => assert.fail(`Broken local link in ${source}: ${href}`));
    }
  }
});

const prose = (text) => text.replace(/[*`]/g, "").replace(/\s+/g, " ");

test("active operational lessons teach automatic saved-plan apply rather than a reviewer or a destroy delivery menu", async () => {
  const paths = ["README.md", "docs/workflow-authoring.md", "docs/delivery-configuration.md", "docs/instructor-preflight.md", "docs/plan-review.md", "docs/recovery.md", ...course.steps.map((step) => step.lesson)];
  for (const path of paths) {
    const text = prose(await read(path));
    assert.doesNotMatch(text, /Apply reviewed dev plan|Destroy reviewed dev plan|Verify instructor gate configuration|Review deployments|Approve and deploy|live (?:Lab 07 |delivery )?is not solo|only followup\/destroy|--field operation=destroy/i, path);
  }
  const config = prose(await read("docs/delivery-configuration.md"));
  for (const pattern of [/1379149907/, /alvine-aurelio-org\/ws2-sim-20260921-azure-delivery-laboratory-07/, /Wrong IDs\/names, public repositories and templates fail/i, /no manual deployment reviewer/i, /no Required reviewers and no admin bypass/i, /does not use the approvals API/i, /same-run validation\/plan/i, /saved-plan integrity and scoped authorization/i, /2-hour validity \/ 1-day retention/i, /Public source-template maintenance remains inert on dev/i]) assert.match(config, pattern);
  const flow = prose(await read("docs/workflow-authoring.md"));
  for (const pattern of [/current authenticated repo admin separately authorizes owned-scope full cleanup/i, /same state\/concurrency\/environments\/identities/i, /Ordinary main never cleans up/i, /destroy\/replacements on regular pushes fail/i, /not a security boundary/i]) assert.match(flow, pattern);
});

test("cleanup lesson teaches one explicit current-admin authorization bound to the exact repo, current SHA and state", async () => {
  const lesson = await read(".github/steps/05.md");
  const text = prose(lesson);
  for (const pattern of [/current repository admin/i, /separate explicit full owned-workload cleanup decision/i, /Run workflow.*main/i, /required string authorization/i, /destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>/, /never submit placeholders/i, /no operation input/i, /no independent cleanup reviewer/i, /same run/i, /2 hours/i, /1 day/i, /empty managed-state.*Azure portal/i, /Empty state alone.*not Azure absence proof/i]) assert.match(text, pattern);
  assert.doesNotMatch(lesson, /gh workflow run|--field operation=destroy|```powershell/);
  assert.match(lesson, /\.\.\/workflows\/cleanup\.yml/);
  const workflow = await read(".github/workflows/cleanup.yml");
  assert.match(workflow, /^name: Trusted dev cleanup \(explicit owner authorization required\)/);
  for (const name of ["Verify separate dev cleanup authorization", "Validate reviewed delivery revision", "Trusted dev plan", "Apply exact authorized dev destroy plan"]) assert.ok(text.includes(name), `Teach the actual job: ${name}`);
});

test("readiness stays context-specific with fail-closed ruleset bindings and no absent-main workaround", async () => {
  const text = prose(await read("docs/delivery-configuration.md"));
  for (const pattern of [/Do not open a PR into nonexistent main or create it while unready/i, /owner establish.*protected main while delivery remains disabled/i, /schedules use the default branch/i, /deliberate owner decision.*when ready/i, /no automatic default-branch change/i, /educational progress are not Azure authorization/i, /read-only workflow token cannot see.*ruleset bypass list/i, /server-issued.*updated_at.*revision/i, /zero bypass actors/i, /Missing\/changed revision fails closed/i, /do not edit or repin the repository allowlist/i]) assert.match(text, pattern);
  if (text.includes("Setup status — public source")) {
    assert.match(text, /expected configuration, not observed private settings/i);
    assert.match(text, /No Azure readiness, deployment, configuration update or cleanup is claimed here/i);
    assert.doesNotMatch(text, /Verified configuration update, \d{2}:\d{2} UTC|dev-plan \(\d{10,}\)|dev-apply \(\d{10,}\)|\d{4}-\d\d-\d\dT\d\d:\d\d:/i);
  } else {
    assert.match(text, /Setup status — existing private observations/);
    assert.match(text, /not a new readback from this lesson edit/i);
    assert.match(text, /initial \d{2}:\d{2} UTC baseline.*no main, environments/i);
    assert.match(text, /Verified configuration update, \d{2}:\d{2} UTC.*dev-plan.*dev-apply.*now exist.*enablement remains false/i);
    assert.match(text, /later environment update supersedes only the initial absence of environments/i);
    assert.match(text, /Configuration is ongoing, not complete or live success/i);
  }
});

const directGuides = ["README.md", ".github/agentalvine/README.md", ...["start-here", "workflow-authoring", "delivery-configuration", "pr-author-merge", "git-workflow", "instructor-preflight", "plan-review", "recovery", "identity-state", "azure-setup", "copilot-guide", "defender-posture-hands-on", "dependency-snapshot", "glossary", "troubleshooting"].map((name) => `docs/${name}.md`), ...course.steps.map((step) => step.lesson)];
const activePart = (text) => text.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "").split("## Complete activity sequence and original A/B status")[0].split("<!-- FULL-WS-LESSON:END -->")[0].split("<!-- FULL-WS-SETUP:END -->")[0];

function anchors(markdown) {
  const values = new Set(), counts = new Map();
  outsideCodeFences(markdown, (part) => {
    for (const [, title] of part.matchAll(/^#{1,6} (.+)$/gm)) {
      const slug = title.toLowerCase().replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, "")
        .replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
      const count = counts.get(slug) ?? 0;
      values.add(count ? `${slug}-${count}` : slug);
      counts.set(slug, count + 1);
    }
    return part;
  });
  return values;
}

test("current lesson and setup anchors resolve, including the optional reference's repaired inbound link", async () => {
  const paths = ["README.md", ".github/agentalvine/README.md", "docs/start-here.md", "docs/workflow-authoring.md", "full-ws-content/README.md", "full-ws-content/00-start-here.md", ...course.steps.map(({ lesson }) => lesson), ...course.steps.map(({ id }) => `full-ws-content/activity-${id.padStart(2, "0")}.md`)];
  for (const source of paths) {
    const links = [];
    outsideCodeFences(await read(source), (part) => { links.push(...part.matchAll(/\]\(([^)\s]+)\)/g)); return part; });
    for (const [, href] of links) {
      if (/^[a-z]+:/i.test(href)) continue;
      const [path, fragment] = href.split("#");
      if (!fragment) continue;
      const target = path ? posix.normalize(posix.join(posix.dirname(source), decodeURIComponent(path))) : source;
      if (!target.endsWith(".md")) continue;
      assert.ok(anchors(await read(target)).has(decodeURIComponent(fragment)), `Broken anchor in ${source}: ${href}`);
    }
  }
  const guide = await read("docs/workflow-authoring.md");
  assert.ok(guide.includes("../.github/steps/03.md#3-observe-this-later-exact-plan-run"));
  assert.doesNotMatch(guide, /03\.md#4-observe-scoped-authorization-and-exact-plan-application/);
});

test("active guidance rejects stale reviewer blockers and public copies of private progress or observations", async () => {
  const config = await read("docs/delivery-configuration.md");
  const isPublic = config.includes("## Setup status — public source");
  const paths = [...directGuides, "full-ws-content/README.md", "full-ws-content/00-start-here.md", "full-ws-content/azure-setup.md", "full-ws-content/defender-posture-hands-on.md", ...course.steps.map((step) => `full-ws-content/activity-${step.id.padStart(2, "0")}.md`)];
  for (const path of paths) {
    const text = prose(activePart(await read(path)));
    assert.doesNotMatch(text, /Apply reviewed dev plan|Destroy reviewed dev plan|Verify instructor gate configuration|Review deployments|Approve and deploy|live (?:Lab 07 |delivery )?is not solo|only followup\/destroy|--field operation=destroy/i, path);
    if (path !== "docs/delivery-configuration.md") assert.doesNotMatch(text, /Last supplied (?:live )?readback|no main\/environments\/runners\/secrets|no main, environments, runners, secrets/i, path);
    if (isPublic) {
      assert.doesNotMatch(text, /Verified configuration update, \d{2}:\d{2} UTC|dev-plan \(\d{10,}\)|dev-apply \(\d{10,}\)|https:\/\/github\.com\/alvine-aurelio-org\/ws2-sim-[^\s)]+\/(?:issues|actions\/runs)\/\d+|\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z/i, path);
    }
  }
  const readme = await read("README.md");
  if (isPublic) {
    assert.match(readme, /this public source describes expected controls, not private configuration observations/i);
    assert.ok(readme.includes("https://github.com/new?template_owner="), "Keep the source copy marker, never copy a private progress link");
  } else {
    assert.match(readme, /existing configuration record/);
    assert.match(readme, /no new readback or Azure verification/i);
  }
  const observer = prose(await read(".github/agentalvine/README.md"));
  for (const pattern of [/five checkpoints/i, /metadata-only observer/i, /does not inspect Azure configuration or prove resource absence/i, /never dispatches delivery/i, /no cloud tokens/i]) assert.match(observer, pattern);
});
