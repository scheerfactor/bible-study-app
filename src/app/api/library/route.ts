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

function slugFromPath(filePath: string) {
  return basename(filePath, ".txt");
}

export async function GET() {
  const raw = await readFile(manifestPath, "utf8");
  const entries = JSON.parse(raw) as LibraryManifestEntry[];

  return NextResponse.json({
    resources: entries.map((entry) => ({
      slug: slugFromPath(entry.file_path),
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
    })),
  });
}
