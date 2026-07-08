import { NextResponse } from "next/server";

const githubRawBase = "https://raw.githubusercontent.com/scheerfactor/bible-study-app";

const contentHealthChecks = [
  {
    id: "jfb-footer-cleanup",
    label: "JFB commentary footer cleanup",
    path: "data/imports/jfb-reviewed-beta-depth-epistles-batch-2-commentary.json",
    forbiddenMarker: "[ Table of Contents ]",
  },
  {
    id: "pulpit-wrapper-cleanup",
    label: "Pulpit Commentary wrapper cleanup",
    path: "data/imports/pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json",
    forbiddenMarker: "Whole Bible (48)",
  },
  {
    id: "matthew-henry-invalid-row",
    label: "Matthew Henry invalid row removed",
    path: "data/imports/matthew-henry-reviewed-completion-batch-09-commentary.json",
    forbiddenMarker: "matthew-henry-habakkuk-1-matthew-henry-completion-batch-09",
  },
] as const;

function encodedPath(relativePath: string) {
  return relativePath.split("/").map(encodeURIComponent).join("/");
}

function repositoryContentUrl(relativePath: string) {
  const ref = process.env.VERCEL_GIT_COMMIT_SHA ?? "main";
  return `${githubRawBase}/${encodeURIComponent(ref)}/${encodedPath(relativePath)}`;
}

function publicContentUrl(relativePath: string) {
  const baseUrl = (process.env.CONTENT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_CONTENT_BASE_URL)?.replace(/\/+$/, "");
  if (!baseUrl) return null;
  return `${baseUrl}/${encodedPath(relativePath)}`;
}

async function inspectContent(url: string, forbiddenMarker: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    const text = response.ok ? await response.text() : "";
    const markerFound = response.ok ? text.includes(forbiddenMarker) : false;

    return {
      ok: response.ok && !markerFound,
      status: response.status,
      bytes: text.length,
      markerFound,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      bytes: 0,
      markerFound: false,
      error: error instanceof Error ? error.message : "Could not read content source.",
    };
  }
}

export async function GET() {
  const results = await Promise.all(
    contentHealthChecks.map(async (check) => {
      const publicUrl = publicContentUrl(check.path);

      return {
        id: check.id,
        label: check.label,
        path: check.path,
        repository: await inspectContent(repositoryContentUrl(check.path), check.forbiddenMarker),
        publicContent: publicUrl ? await inspectContent(publicUrl, check.forbiddenMarker) : null,
      };
    }),
  );

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "main",
      publicBaseConfigured: Boolean(process.env.CONTENT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_CONTENT_BASE_URL),
      commentaryImportsPreferRepository: false,
      results,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
