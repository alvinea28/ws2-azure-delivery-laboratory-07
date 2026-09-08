import assert from "node:assert/strict";
import { randomBytes, createCipheriv, createDecipheriv, createPublicKey, createPrivateKey, publicEncrypt, privateDecrypt, constants, generateKeyPairSync } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const AAD = Buffer.from("ws2-agentalvine-plan-envelope:v1");
const MAX = 64 * 1024 * 1024;
function rsa(key, privateKey = false) {
  const object = privateKey ? createPrivateKey(key) : createPublicKey(key);
  assert.equal(object.asymmetricKeyType, "rsa", "Plan envelope requires an RSA key");
  assert.ok(object.asymmetricKeyDetails.modulusLength >= 3072, "Use RSA 3072 bits or stronger");
  return object;
}

export function sealPlan(plan, manifest, publicKey) {
  assert.ok(plan.length > 0 && plan.length < MAX && manifest.length < 100_000);
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(AAD);
  const payload = Buffer.from(JSON.stringify({ plan: plan.toString("base64"), manifest: manifest.toString("base64") }));
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const wrapped = publicEncrypt({ key: rsa(publicKey), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, key);
  key.fill(0);
  return Buffer.from(JSON.stringify({ version: 1, key: wrapped.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: encrypted.toString("base64") }));
}

export function openPlan(envelopeBytes, privateKey) {
  assert.ok(envelopeBytes.length < MAX * 2, "Unexpected envelope size");
  const envelope = JSON.parse(envelopeBytes);
  assert.equal(envelope.version, 1);
  const key = privateDecrypt({ key: rsa(privateKey, true), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, Buffer.from(envelope.key, "base64"));
  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  assert.equal(key.length, 32);
  assert.equal(iv.length, 12);
  assert.equal(tag.length, 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(AAD);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final()]);
  key.fill(0);
  const payload = JSON.parse(plain);
  const plan = Buffer.from(payload.plan, "base64");
  const manifest = Buffer.from(payload.manifest, "base64");
  assert.ok(plan.length > 0 && plan.length < MAX && manifest.length < 100_000);
  return { plan, manifest };
}

async function main(mode) {
  const privateDir = ".workshop/private";
  const sealedDir = ".workshop/sealed";
  if (mode === "seal") {
    assert.ok(process.env.PLAN_ENCRYPTION_PUBLIC_KEY, "Instructor must configure the approved plan-encryption public key");
    await mkdir(sealedDir, { recursive: true });
    const envelope = sealPlan(await readFile(join(privateDir, "reviewed.tfplan")), await readFile(join(privateDir, "manifest.json")), process.env.PLAN_ENCRYPTION_PUBLIC_KEY);
    await writeFile(join(sealedDir, "plan.enc"), envelope, { mode: 0o600 });
  } else if (mode === "open") {
    const pem = process.env.PLAN_DECRYPTION_PRIVATE_KEY || (process.env.PLAN_KEY_PATH ? await readFile(process.env.PLAN_KEY_PATH, "utf8") : null);
    assert.ok(pem, "Only the protected apply job or authorized independent reviewer may decrypt plans");
    const { plan, manifest } = openPlan(await readFile(join(sealedDir, "plan.enc")), pem);
    await mkdir(privateDir, { recursive: true, mode: 0o700 });
    await writeFile(join(privateDir, "reviewed.tfplan"), plan, { mode: 0o600 });
    await writeFile(join(privateDir, "manifest.json"), manifest, { mode: 0o600 });
  } else if (mode === "keygen") {
    // Instructor workstation ONLY. Never run in PR CI or echo either key.
    const keys = generateKeyPairSync("rsa", { modulusLength: 3072, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
    await mkdir(".workshop/keys", { recursive: true, mode: 0o700 });
    await writeFile(".workshop/keys/public.pem", keys.publicKey, { flag: "wx", mode: 0o600 });
    await writeFile(".workshop/keys/private.pem", keys.privateKey, { flag: "wx", mode: 0o600 });
    console.log("Instructor key files created in ignored .workshop/keys; restrict OS ACLs, securely escrow for independent reviewers, and never commit them.");
  } else throw new Error("Use seal, open, or instructor-only keygen");
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main(process.argv[2]).catch(() => { console.error("Plan envelope operation failed. Check key access, integrity and input files; no key or plaintext was printed."); process.exitCode = 1; });
