import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { NextResponse } from "next/server";

type LibraryManifestEntry = {
  title: string;
  author: string;
  year: number;
  category: string;
  source_url: string;
  source_license_url: string;
  file_path: string;
  public_domain_status: string;
  commercial_use_status: string;
  rights_basis: string;
  notes: string;
  import_status: string;
  word_count?: number;
  file_size_bytes?: number;
  checksum_sha256?: string;
};

const manifestPath = resolve(process.cwd(), "data", "library", "manifests", "curated-public-domain-resources.json");
const libraryRoot = resolve(process.cwd(), "data", "library", "verified");

function slugFromPath(filePath: string) {
  return basename(filePath, ".txt");
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const raw = await readFile(manifestPath, "utf8");
  const entries = JSON.parse(raw) as LibraryManifestEntry[];
  const entry = entries.find((candidate) => slugFromPath(candidate.file_path) === slug);

  if (!entry) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const filePath = resolve(libraryRoot, basename(entry.file_path));
  if (!filePath.startsWith(libraryRoot)) {
    return NextResponse.json({ error: "Invalid resource path." }, { status: 400 });
  }

  const text = await readFile(filePath, "utf8");

  return NextResponse.json({
    resource: {
      slug,
      title: entry.title,
      author: entry.author,
      year: entry.year,
      category: entry.category,
      description: entry.notes,
      rights_status: entry.public_domain_status,
      commercial_use_status: entry.commercial_use_status,
      source_url: entry.source_url,
      source_license_url: entry.source_license_url,
      rights_basis: entry.rights_basis,
      word_count: entry.word_count ?? null,
      file_size_bytes: entry.file_size_bytes ?? null,
      checksum_sha256: entry.checksum_sha256 ?? null,
      added_at: entry.import_status,
    },
    text,
  });
}
