import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

type UploadRequest = {
  storagePath?: string;
  contentType?: string;
  fileName?: string;
  size?: number;
  kind?: string;
  rightsStatus?: string;
};

const DEFAULT_MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;
const UPLOAD_URL_EXPIRES_SECONDS = 15 * 60;
const PUBLIC_UPLOAD_RIGHTS = new Set(["Public Domain", "Approved"]);
const ALLOWED_EXTENSIONS = new Set(["mp3", "m4a", "m4b", "aac", "wav", "mp4", "mov", "webm"]);
const ALLOWED_CONTENT_TYPES = new Set([
  "audio/aac",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/octet-stream",
]);

function jsonError(error: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json({ error, ...details }, { status });
}

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function hmacBuffer(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function hashHex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function amzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function dateStamp(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function signingKey(secretAccessKey: string, date: string, region: string, service: string) {
  const kDate = hmacBuffer(`AWS4${secretAccessKey}`, date);
  const kRegion = hmacBuffer(kDate, region);
  const kService = hmacBuffer(kRegion, service);
  return hmacBuffer(kService, "aws4_request");
}

function awsEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodeObjectKey(key: string) {
  return key.split("/").map(awsEncode).join("/");
}

function canonicalQuery(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${awsEncode(key)}=${awsEncode(value)}`)
    .join("&");
}

function extensionFromPath(path: string) {
  return path.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

function validateStoragePath(storagePath: string, kind: string) {
  if (!storagePath || storagePath.length > 500) return "Storage path is required and must be under 500 characters.";
  if (storagePath.startsWith("/") || storagePath.includes("..") || storagePath.includes("\\") || /[{}]/.test(storagePath)) {
    return "Storage path contains unsafe characters.";
  }
  if (kind === "Sermon Video") {
    if (!storagePath.startsWith("video/")) return "Video uploads must use a video/ storage path.";
  } else if (!storagePath.startsWith("audio/")) {
    return "Audio uploads must use an audio/ storage path.";
  }
  const extension = extensionFromPath(storagePath);
  if (!ALLOWED_EXTENSIONS.has(extension)) return `Unsupported media extension: ${extension || "none"}.`;
  return "";
}

function presignedPutUrl({
  accountId,
  accessKeyId,
  secretAccessKey,
  bucket,
  storagePath,
}: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  storagePath: string;
}) {
  const now = new Date();
  const requestDate = amzDate(now);
  const requestDateStamp = dateStamp(now);
  const region = "auto";
  const service = "s3";
  const credentialScope = `${requestDateStamp}/${region}/${service}/aws4_request`;
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${bucket}/${encodeObjectKey(storagePath)}`;
  const params = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": requestDate,
    "X-Amz-Expires": String(UPLOAD_URL_EXPIRES_SECONDS),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery(params),
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    requestDate,
    credentialScope,
    hashHex(canonicalRequest),
  ].join("\n");
  const signature = hmacHex(signingKey(secretAccessKey, requestDateStamp, region, service), stringToSign);
  return `https://${host}${canonicalUri}?${canonicalQuery({ ...params, "X-Amz-Signature": signature })}`;
}

export async function POST(request: NextRequest) {
  const requiredEnv = {
    accountId: env("R2_ACCOUNT_ID"),
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    bucket: env("R2_BUCKET_MEDIA") || env("R2_BUCKET_PUBLIC_CONTENT"),
    adminToken: env("MEDIA_UPLOAD_ADMIN_TOKEN"),
  };
  const missing = Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    return jsonError("R2 media upload is not configured on this server.", 503, { missing });
  }

  const providedToken = request.headers.get("x-admin-upload-token")?.trim() ?? "";
  if (!providedToken || !secureEquals(providedToken, requiredEnv.adminToken)) {
    return jsonError("Admin upload token is required.", 401);
  }

  let body: UploadRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const storagePath = String(body.storagePath ?? "").trim();
  const kind = String(body.kind ?? "");
  const contentType = String(body.contentType || "application/octet-stream").trim();
  const rightsStatus = String(body.rightsStatus ?? "").trim();
  const size = Number(body.size ?? 0);
  const maxUploadBytes = Number(process.env.MEDIA_UPLOAD_MAX_BYTES ?? DEFAULT_MAX_UPLOAD_BYTES);

  const pathError = validateStoragePath(storagePath, kind);
  if (pathError) return jsonError(pathError, 400);
  if (!PUBLIC_UPLOAD_RIGHTS.has(rightsStatus)) {
    return jsonError("Direct upload requires Public Domain or Approved rights status.", 403);
  }
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return jsonError(`Unsupported media content type: ${contentType}.`, 400);
  }
  if (!Number.isFinite(size) || size <= 0) return jsonError("File size is required.", 400);
  if (size > maxUploadBytes) return jsonError("File is larger than the configured upload limit.", 413, { maxUploadBytes });

  const uploadUrl = presignedPutUrl({
    accountId: requiredEnv.accountId,
    accessKeyId: requiredEnv.accessKeyId,
    secretAccessKey: requiredEnv.secretAccessKey,
    bucket: requiredEnv.bucket,
    storagePath,
  });

  return NextResponse.json({
    uploadUrl,
    storagePath,
    bucket: requiredEnv.bucket,
    expiresInSeconds: UPLOAD_URL_EXPIRES_SECONDS,
    requiredHeaders: {
      "Content-Type": contentType,
    },
  });
}
