import { createHash, createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = join(repoRoot, "data", "storage", "public-content-storage-inventory.json");
const execute = process.argv.includes("--execute");
const dryRun = !execute || process.argv.includes("--dry-run");

const requiredEnv = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_PUBLIC_CONTENT",
];

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function hmac(key, value, encoding) {
  return createHmac("sha256", key).update(value).digest(encoding);
}

function hashHex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function amzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function dateStamp(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function signingKey(secretAccessKey, date, region, service) {
  const kDate = hmac(`AWS4${secretAccessKey}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function encodeKey(key) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

async function uploadItem(item, config) {
  const body = await readFile(join(repoRoot, item.source_path));
  const now = new Date();
  const requestDate = amzDate(now);
  const requestDateStamp = dateStamp(now);
  const region = "auto";
  const service = "s3";
  const encodedObjectKey = encodeKey(item.storage_path);
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${config.bucket}/${encodedObjectKey}`;
  const payloadHash = hashHex(body);
  const headers = {
    "content-type": item.content_type || "application/octet-stream",
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": requestDate,
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((name) => `${name}:${headers[name]}\n`)
    .join("");
  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${requestDateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", requestDate, credentialScope, hashHex(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(config.secretAccessKey, requestDateStamp, region, service), stringToSign, "hex");
  const authorization = [
    "AWS4-HMAC-SHA256",
    `Credential=${config.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const url = `https://${host}${canonicalUri}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      ...headers,
      authorization,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Upload failed for ${item.source_path}: ${response.status} ${text.slice(0, 300)}`);
  }
}

async function main() {
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  const items = inventory.items.filter((item) => !item.missing);

  if (dryRun) {
    console.log(`Dry run only. ${items.length} files would be uploaded.`);
    console.table(inventory.summaries);
    console.log("Pass --execute to upload to R2.");
    return;
  }

  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Cannot upload. Missing environment variables: ${missing.join(", ")}`);
  }

  const config = {
    accountId: env("R2_ACCOUNT_ID"),
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    bucket: env("R2_BUCKET_PUBLIC_CONTENT"),
  };

  let uploaded = 0;
  for (const item of items) {
    await uploadItem(item, config);
    uploaded += 1;
    if (uploaded % 50 === 0 || uploaded === items.length) {
      console.log(`Uploaded ${uploaded}/${items.length}: ${basename(item.source_path)}`);
    }
  }

  console.log(`Upload complete: ${uploaded} files uploaded to R2 bucket ${config.bucket}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
