import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

// Document contracts only: examples are never executed and no service is called.
const read = async (path) => (await readFile(new URL(`../${path}`, import.meta.url), "utf8")).replaceAll("\r\n", "\n");
const { outsideCodeFences } = createRequire(import.meta.url)("../.github/agentalvine/auto-guide.cjs");
const segmenter = new Intl.Segmenter("en", { granularity: "word" });
const visible = (text) => text.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "");
function prose(text) {
  let result = "";
  outsideCodeFences(visible(text), (part) => { result += part; return part; });
  return result.replace(/<!--[\s\S]*?-->/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/[^\s<>]+/g, "").replace(/[*`]/g, "").replace(/\s+/g, " ").trim();
}
const words = (text) => [...segmenter.segment(prose(text))].filter(({ isWordLike }) => isWordLike).length;
const blocks = (text) => [...text.matchAll(/^```([^\n]*)\n([\s\S]*?)^```/gm)].map(([, language, body]) => ({ language, body: body.trim() }));
function requirePoints(text, points, source) {
  for (const [name, pattern] of Object.entries(points)) assert.match(prose(text), pattern, `${source}: ${name}`);
}
function lessonBody(text) {
  const start = "<!-- FULL-WS-LESSON:START -->", end = "<!-- FULL-WS-LESSON:END -->";
  assert.equal(text.split(start).length, 2);
  assert.equal(text.split(end).length, 2);
  assert.ok(text.indexOf(start) < text.indexOf(end));
  return text.split(start)[1].split(end)[0].trim();
}
const ids = ["01", "02", "03", "04", "05"];
const limits = [500, 420, 500, 380, 350];
const course = JSON.parse(await read(".github/agentalvine/course.json"));
const lessons = await Promise.all(ids.map((id) => read(`.github/steps/${id}.md`)));
const commands = ["npm test", "npm run kit:check", "npm run workflow:check", "node scripts/check-learner.mjs"];

test("natural-word counting excludes fenced code, URLs and collapsed history", () => {
  assert.equal(words("**Do this.** [Help](https://example.invalid/long/path) https://example.invalid/ignored\n```powershell\nignored command\n```\n<details><summary>History</summary>old words</details>"), 3);
  assert.equal(words("action ".repeat(501)), 501);
});

for (const [index, id] of ids.entries()) {
  for (const path of [`.github/steps/${id}.md`, `full-ws-content/activity-${id}.md`]) {
    test(`${path} stays within ${limits[index]} natural words`, async () => {
      const text = await read(path), count = words(path.startsWith("full-") ? lessonBody(text) : text);
      assert.ok(count > 0 && count <= limits[index], `${count} words; shorten actions instead of padding for a kit minimum`);
    });
  }
  test(`Step ${id} is an inline action lesson, not a hidden or separate tutorial`, () => {
    const text = lessons[index];
    for (const label of ["Goal", "Expected", "Recovery"]) assert.match(text, new RegExp(`\\*\\*${label}:\\*\\*`));
    assert.match(text, /^(?:\d+\. |### \d+\. )/m);
    assert.doesNotMatch(text, /<details\b|FULL-WS-ACTIONS|actions-and-azure\.md|workflow-authoring\.md/i);
    assert.doesNotMatch(text, /\*\*Why|^#{2,3} .*Why|^- \[ \]/im);
    assert.equal((text.match(/!\[[^\]]+\]\(/g) ?? []).length, 1);
    assert.match(text, /REFERENCE.*CC BY.*NOTICE\.md/);
    assert.doesNotMatch(text, /\]\([^)]*full-ws-content\//);
  });
}

const setupPoints = {
  independent: /No earlier lab or Azure account.*Reuse/i,
  install: /installers.*Git, desktop VS Code, Node 24\.16\.0, Terraform 1\.16\.1.*actionlint 1\.7\.12/i,
  account: /GitHub account.*invitation.*SSO.*Accounts.*GitHub.*Copilot.*seat/i,
  privateCopy: /Use this template.*Create a new repository.*Owner.*Private.*Include all branches.*off/i,
  clone: /Code.*HTTPS.*Git: Clone.*paste.*parent folder.*Open.*Explorer.*root/i,
  branch: /actual default.*dev.*Git: Create Branch.*lab\/workflow-authoring/i,
  disabled: /WORKSHOP_AZURE_ENABLED=false.*no Azure login.*backend\/state.*apply\/destroy/i,
};
test("Step 1 includes independent install, account, private-copy and clone actions", () => {
  requirePoints(lessons[0], setupPoints, "Step 1");
  assert.deepEqual(blocks(lessons[0]).find(({ language }) => language === "powershell").body.split("\n"), ["node --version", "terraform version", "node scripts/doctor.mjs"]);
  const map = blocks(lessons[0]).find(({ language }) => language === "markdown").body;
  for (const term of course.steps[0].checks[0].contains) assert.ok(map.includes(term), `Identity example: ${term}`);
  assert.doesNotMatch(map, /TODO/);
});

const constructionPoints = {
  editor: /solutions\/delivery\.yml.*File.*New Text File.*YAML.*untitled/i,
  header: /complete header.*name, on, permissions, concurrency, env.*jobs:/i,
  pins: /Preserve.*indentation.*pins.*conditions.*permissions.*expressions/i,
  singleSave: /Compare.*whole.*replace.*existing \.github\/workflows\/delivery\.yml.*one complete save/i,
  separateCleanup: /cleanup\.yml.*separate.*unchanged/i,
  noDrafts: /No extra.*partial.*workflow/i,
  noFakeDiff: /no Git diff.*valid.*no fake.*empty commit/i,
};
test("Step 1 constructs every actual job in sequence before one disabled canonical save", async () => {
  requirePoints(lessons[0], constructionPoints, "Step 1");
  const yaml = await read(".github/workflows/delivery.yml");
  const jobs = [...yaml.split(/^jobs:\s*$/m)[1].matchAll(/^ {2}([a-z]+):\s*$/gm)].map(([, job]) => job);
  assert.deepEqual(jobs, ["preflight", "validation", "plan", "apply", "followup", "drift"]);
  assert.deepEqual([...lessons[0].matchAll(/Copy the complete `([a-z]+)` job/g)].map(([, job]) => job), jobs);
});

test("Step 1 teaches real local checks and current-SHA CI without expanding its map-only gate", () => {
  const shell = blocks(lessons[0]).filter(({ language }) => language === "powershell");
  assert.deepEqual(shell[1].body.split("\n"), commands);
  requirePoints(lessons[0], {
    mockCount: /two consumer mock cases.*backend-disabled.*read-only.*locks.*no Azure/i,
    publication: /Stage.*intended.*map.*workflow.*Commit.*Publish Branch\/Push/i,
    currentChecks: /Actions.*current SHA.*Workshop quality.*Lab checks/i,
    mapOnly: /gate.*identity map only.*not.*authorship.*Azure authorization/i,
  }, "Step 1");
});

const prerequisitePoints = {
  writer: /private.*alvine-aurelio-org\/ws2-sim-20260921-azure-delivery-laboratory-07.*1379149907/i,
  protection: /current protected main.*strict.*PR checks/i,
  scope: /subscription\/RG\/region\/CIDRs.*budget\/currency.*lifetime.*explicit bootstrap authorization/i,
  state: /separate.*OIDC.*private backend.*lease.*separate state.*runner.*encryption keys.*module App/i,
  environments: /main-only dev-plan\/dev-apply.*no Required reviewers.*no admin bypass/i,
  offline: /Public.*unapproved copies.*offline.*never repin/i,
  absentMain: /Missing main.*STOP.*only the owner.*while disabled.*readiness/i,
  maintenance: /Source maintenance.*dev.*not.*main/i,
};
test("Step 2 has one compact owner prerequisite boundary and no missing-main workaround", () => {
  requirePoints(lessons[1], prerequisitePoints, "Step 2");
  assert.equal((lessons[1].match(/^> \*\*STOP/gm) ?? []).length, 1);
});

const mergePoints = {
  ownerEnable: /owner.*enable.*live window/i,
  actualPR: /Pull requests.*New pull request.*base: main.*compare: lab\/workflow-authoring.*Files changed.*checks.*resolve conversations.*Merge pull request.*Confirm merge/i,
  author: /author may merge.*own.*passing PR/i,
  push: /push \/ main.*current main SHA.*attempt 1/i,
  noSecondDeploy: /No manual deploy button.*reviewer wait.*second dispatch.*Re-run jobs/i,
  expiry: /2 hours.*1 day.*retention.*not.*validity/i,
  noteLater: /After Step 2.*recorded.*Step 3.*note PR.*later.*fresh.*run/i,
};
test("Step 2 teaches the real author merge and first automatic same-run plan/apply", async () => {
  requirePoints(lessons[1], mergePoints, "Step 2");
  const yaml = await read(".github/workflows/delivery.yml");
  for (const name of ["Verify scoped dev deployment policy", "Validate reviewed delivery revision", "Trusted dev plan", "Apply exact dev saved plan"]) {
    assert.ok(yaml.includes(`name: ${name}`));
    assert.ok(lessons[1].includes(name), `Teach actual job ${name}`);
  }
  assert.match(prose(lessons[1]), /whole.*completed.*current-SHA.*Trusted dev plan.*not.*mock/i);
});

const portalPoints = {
  portal: /Azure portal.*Directories \+ subscriptions.*assigned directory\/subscription.*Resource groups.*assigned RG.*actual VNet.*NSG.*owner.*scoped outputs.*not guessed/i,
  overview: /Overview.*JSON View.*region.*provisioningState: Succeeded/i,
  address: /Address space.*CIDRs/i,
  subnets: /Subnets.*stable keys\/names.*prefixes.*NSG associations/i,
  outbound: /JSON View.*properties\.subnets.*defaultOutboundAccess: false/i,
  rules: /Inbound.*Outbound.*direction\/access\/priority\/protocol\/ports\/source\/destination.*reviewed inputs\/module/i,
  tags: /Tags.*required tags/i,
  nested: /Subnets are nested.*not.*RG rows/i,
  honestProof: /Green Actions.*output IDs.*not.*configuration proof/i,
  privateIDs: /Compare.*resource IDs.*keep.*private/i,
};
test("Step 3 contains the exact-plan note and actual portal property inspection", () => {
  const note = blocks(lessons[2]).find(({ language }) => language === "markdown").body;
  for (const term of course.steps[2].checks[0].contains) assert.ok(note.includes(term), `Note example: ${term}`);
  assert.doesNotMatch(note, /TODO/);
  requirePoints(lessons[2], {
    laterBranch: /After Step 2.*recorded.*lab\/plan-review.*current main/i,
    preserveWork: /exercise\/plan-review\.md.*preserve.*existing.*work/i,
    actualPR: /base: main.*compare: lab\/plan-review.*checks.*resolve conversations.*Merge pull request/i,
    freshRun: /later.*push \/ main.*current SHA.*attempt 1.*same run/i,
    noSecond: /no second deploy.*no.*rerun/i,
    ...portalPoints,
  }, "Step 3");
  assert.match(lessons[2], /^\| Click \| Compare with the reviewed configuration \|$/m);
  assert.doesNotMatch(lessons[2], /workshop_iteration|tags = merge|locals\.tags/);
});

test("Step 4 alone teaches the real Lab07 tag expression then a fresh no-change run", async () => {
  const hcl = await read("environments/dev/main.tf");
  const checkTagInput = (source) => {
    assert.match(source, /module "network"\s*\{/);
    assert.match(source, /^  tags\s*=/m);
    assert.match(source, /\bvar\.tags\b/);
    assert.doesNotMatch(source, /locals\.tags/);
  };
  checkTagInput(hcl);
  const update = blocks(lessons[3]).find(({ language }) => language === "hcl").body;
  assert.equal(update, 'tags = merge(var.tags, { workshop_iteration = "02" })');
  // A lesson test must not require pristine starter HCL and reject its own task.
  // Exercise the documented edit in memory only; runtime HCL validation is separate.
  checkTagInput(hcl.replace(/^  tags\s*=[^\n]+$/m, `  ${update}`));
  assert.deepEqual(blocks(lessons[3]).find(({ language }) => language === "powershell").body.split("\n"), commands);
  requirePoints(lessons[3], {
    intentional: /owner-approved non-reserved tag.*lab\/benign-update.*deployed current main/i,
    actualInput: /environments\/dev\/main\.tf.*module network.*tags = var\.tags/i,
    preservation: /Preserve.*reserved var\.tags.*source pin.*locks.*names.*CIDRs.*topology/i,
    merge: /PR.*main.*checks.*resolve conversations.*Merge pull request/i,
    update: /creates 0, deletes 0, replacements 0/i,
    readback: /same.*resource IDs.*portal.*Tags.*workshop_iteration.*02/i,
    followup: /Actions.*Trusted dev delivery.*Run workflow.*main.*operation: followup.*new run.*attempt 1/i,
    noApply: /exit 0.*Confirm no-change.*2.*not no-change.*never applies/i,
    currentGate: /current.*SHA.*Trusted dev plan.*Confirm no-change.*same run/i,
  }, "Step 4");
});

const cleanupPoints = {
  owner: /current repository admin.*separate explicit.*full.*cleanup.*no independent cleanup reviewer/i,
  browser: /Actions.*Trusted dev cleanup.*Run workflow.*main/i,
  authorization: /required string authorization.*destroy:1379149907:<current full main SHA>:<WS2_STATE_LOCK_ID>/i,
  realValues: /owner.*verified.*40-character SHA.*state lock ID.*never submit placeholders/i,
  noOperation: /no operation input/i,
  sameState: /same root\/state.*saved full destroy plan.*exact/i,
  noBroadDelete: /No -target.*RG deletion.*state-file deletion/i,
  inventory: /empty managed-state.*Azure portal.*refresh.*VNet.*NSG.*absent.*nested subnets/i,
  noEmptyProof: /Empty state alone.*not.*absence proof/i,
  retain: /Retain.*RG.*backend.*identities.*runner/i,
  notPush: /Ordinary main pushes never clean up/i,
  recovery: /failed.*uncertain.*open.*owner.*no force-unlock.*wider roles.*local destroy/i,
};
test("Step 5 is one browser cleanup route with explicit scope, real values and Azure absence", async () => {
  requirePoints(lessons[4], cleanupPoints, "Step 5");
  assert.equal(blocks(lessons[4]).length, 0, "No unnecessary CLI alternative");
  const yaml = await read(".github/workflows/cleanup.yml");
  for (const name of ["Verify separate dev cleanup authorization", "Validate reviewed delivery revision", "Trusted dev plan", "Apply exact authorized dev destroy plan"]) {
    assert.ok(yaml.includes(`name: ${name}`));
    assert.ok(lessons[4].includes(name), `Teach actual cleanup job ${name}`);
  }
  assert.match(prose(lessons[4]), /current-SHA.*attempt 1.*same run.*not.*fixture/i);
});

test("concise contracts reject missing actions and safety, not merely a missing tutorial link", () => {
  for (const points of [constructionPoints, prerequisitePoints, portalPoints, cleanupPoints]) {
    assert.throws(() => requirePoints("Read [a tutorial](docs/workflow-authoring.md).", points, "fixture"));
  }
  for (const [index, points, token] of [[0, constructionPoints, "one complete save"], [1, prerequisitePoints, "1379149907"], [2, portalPoints, "defaultOutboundAccess: false"], [4, cleanupPoints, "never submit placeholders"]]) {
    assert.throws(() => requirePoints(lessons[index].replaceAll(token, "omitted"), points, "fixture"));
  }
});

test("presentation stays concise with the same five lesson paths and no new progress check", () => {
  assert.equal(course.lessonPresentation, "concise");
  assert.deepEqual(course.steps.map(({ id, lesson }) => ({ id, lesson })), ids.map((id, index) => ({ id: String(index + 1), lesson: `.github/steps/${id}.md` })));
  assert.match(course.completion, /does not independently verify Azure configuration or resource absence/i);
  assert.match(course.completion, /progress is not Azure authorization/i);
  // Renderer completion retention belongs to the separate renderer worker.
});

for (const path of ["README.md", "docs/start-here.md", ".github/agentalvine/README.md", "full-ws-content/README.md", "full-ws-content/00-start-here.md"]) {
  test(`${path} routes directly through Steps 1-5`, async () => {
    const text = visible(await read(path));
    for (const id of ids) assert.match(text, new RegExp(`\\]\\([^)]*(?:steps/${id}|activity-${id})\\.md\\)`));
    assert.doesNotMatch(text, /Required (?:next |hands-on )?activity|actions-and-azure\.md|workflow-authoring\.md/i);
  });
}
for (const path of ["README.md", "full-ws-content/README.md"]) test(`${path} keeps visible navigation under 250 words`, async () => {
  assert.ok(words(await read(path)) <= 250, `${path}: ${words(await read(path))} words`);
});

test("the full index separates unchanged historical outcomes and screenshots from the current route", async () => {
  const text = await read("full-ws-content/README.md");
  assert.equal((text.match(/<details>/g) ?? []).length, 1);
  assert.ok(text.indexOf("<details>") > text.indexOf("](activity-05.md)"));
  assert.doesNotMatch(text, /<details\s+open/i);
  const history = /<details>([\s\S]*?)<\/details>/.exec(text)[1];
  for (const token of ["2026-09-08", "Cycle A", "Cycle B", "Verified offline", "2026-09-14", "images/exercise-preview.png", "images/provenance.json"]) assert.ok(history.includes(token));
  for (const id of ids) assert.ok(visible(text).includes(`](activity-${id}.md)`));
});
