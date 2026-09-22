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

test("AgentAlvine observes dedicated cleanup completion without acquiring deployment permissions", async () => {
  const workflow = await read(".github/workflows/agentalvine.yml");
  assert.match(workflow, /workflows: \[Workshop quality, Lab checks, Trusted dev delivery \(instructor enablement required\), Trusted dev cleanup \(explicit owner authorization required\)\]/);
  assert.ok(workflow.includes("ref: ${{ github.event.repository.default_branch }}"));
  assert.doesNotMatch(workflow, /id-token:|secrets\.|download-artifact|self-hosted/);
  const starter = await read("exercise/plan-review.md");
  assert.match(starter, /TODO/);
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

for (const name of ["azure-setup.md", "defender-posture-hands-on.md"]) {
  test(`${name} retains complete canonical content with only outside-fence links rebased`, async () => {
    const source = `docs/${name}`;
    assert.equal((await read(`full-ws-content/${name}`)).trim(), rebase(await read(source), source).trim());
  });
}

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
  for (const pattern of [/workflow_dispatch|explicit.*dispatch/i, /required string input authorization/i, /destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>/, /no operation input/i, /no independent cleanup reviewer/i, /current admin permission, matching actor\/sender\/trigger IDs/i, /same run/i, /2 hours/i, /1 day/i, /empty managed-state.*Azure inventory/i, /retained-owner confirmation/i, /not independent Azure verification or authorization/i]) assert.match(text, pattern);
  assert.match(lesson, /gh workflow run cleanup\.yml --repo \$cleanupRepo --ref main --field "authorization=\$authorization"/);
  assert.doesNotMatch(lesson, /--field operation=destroy/);
  assert.match(lesson, /\.\.\/workflows\/cleanup\.yml/);
  assert.match(lesson, /\.\.\/\.\.\/solutions\/cleanup\.yml/);
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

const entryPoints = ["README.md", "docs/start-here.md", ".github/steps/01.md", ".github/steps/02.md", "full-ws-content/README.md"];
const directGuides = ["README.md", ".github/agentalvine/README.md", ...["start-here", "workflow-authoring", "delivery-configuration", "pr-author-merge", "git-workflow", "instructor-preflight", "plan-review", "recovery", "identity-state", "azure-setup", "copilot-guide", "defender-posture-hands-on", "dependency-snapshot", "glossary", "troubleshooting"].map((name) => `docs/${name}.md`), ...course.steps.map((step) => step.lesson)];
const activePart = (text) => text.split("## Complete activity sequence and original A/B status")[0].split("<!-- FULL-WS-LESSON:END -->")[0].split("<!-- FULL-WS-SETUP:END -->")[0];

test("hands-on construction is prominent in every entry point, not only a buried link or new score", async () => {
  for (const path of entryPoints) {
    const text = prose(activePart(await read(path)));
    for (const pattern of [/hands-on/i, /VS Code/, /header/i, /preflight/, /validation/, /plan/, /apply/, /followup/, /drift/, /canonical/i, /false/, /current[- ]SHA/i, /workflow-authoring\.md/]) assert.match(text, pattern, path);
    assert.doesNotMatch(text, /- \[ \]/, "Phase tables are instructions, not a manual progress protocol");
  }
  assert.match(course.description, /Required hands-on: construct the canonical GitHub Actions workflow/);
  assert.equal(course.steps.length, 5);
});

test("the existing tutorial teaches atomic section-by-section reconstruction without control edits", async () => {
  const text = prose(await read("docs/workflow-authoring.md"));
  for (const pattern of [/untitled editor buffer/i, /one save/i, /no Git diff/i, /do not invent a YAML change/i, /solutions\/delivery\.yml/, /solutions\/cleanup\.yml/, /From name: through the line jobs:/, /Entire preflight:/, /Entire validation:/, /Entire plan:/, /Entire apply: job, stopping before followup:/, /Entire followup: job, then drift:/, /same-SHA/i, /no second dispatch/i, /no manual deployment reviewer/i, /not a security boundary/i, /no operation input/i]) assert.match(text, pattern);
  for (const command of ["npm test", "npm run kit:check", "npm run workflow:check", "node scripts/check-learner.mjs", "actionlint -config-file"]) assert.ok(text.includes(command));
  assert.doesNotMatch(text, /repin (?:the )?(?:IDs|repository IDs) to enable|change the allowlist to enable/i);
});

test("the live activity requires real properties and a benign HCL update before fresh followup and cleanup", async () => {
  const guide = await read("docs/workflow-authoring.md");
  const text = prose(guide);
  for (const pattern of [/Live-only, after Step 3's actual deployment/i, /not a sixth checkpoint/i, /Azure portal.*Resource groups.*VNet \/ NSG/i, /named subnet prefix/i, /subnet-to-NSG association/i, /direction\/access\/priority\/protocol\/ports\/source\/destination/i, /lab\/benign-update/, /same budget\/lifetime/i, /creates 0, deletes 0, replacements 0/i, /same resource IDs/i, /actual property observations/i, /fresh followup/i, /exit 0/i, /empty managed state.*actual Azure workload absence.*retained-owner confirmation/i, /does not independently verify these property checks/i]) assert.match(text, pattern);
  assert.ok(guide.includes('tags = merge(var.tags, { workshop_iteration = "02" })'));
  assert.match(text, /source pin, locks, resource names, CIDRs, rules, backend and ownership/i);
  assert.match(prose(await read(".github/steps/03.md")), /Hands-on verification before followup.*no replacement.*same resource IDs/i);
  assert.match(prose(await read(".github/steps/04.md")), /latest deployed SHA.*unchanged IDs.*earlier baseline no-change does not prove/i);
});

test("settings inspection requires owner scope and bootstrap readiness without secret values or cost guesses", async () => {
  const text = prose(await read("docs/workflow-authoring.md"));
  for (const pattern of [/Settings.*Rules.*Rulesets/i, /Environments.*dev-plan \/ dev-apply/i, /Secrets and variables.*Actions.*Variables/i, /secret names only/i, /Runner groups.*Workflow access/i, /Do not create environments, keys, identities or main during this inspection/i, /bootstrap changes need their own explicit authorization/i, /Budget must specify currency and lifetime/i, /never assume zero cost/i, /OIDC, state\/leases, runner, encryption keys and module App/i]) assert.match(text, pattern);
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
