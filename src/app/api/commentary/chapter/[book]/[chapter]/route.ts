import { NextResponse } from "next/server";
import { readTextContent } from "@/lib/server-content-storage";

type CommentaryChapterIndex = {
  schema_version: number;
  files: string[];
  chapters: Record<string, number[]>;
};

type CommentaryRow = {
  book?: unknown;
  chapter?: unknown;
  [key: string]: unknown;
};

const publicCommentaryFilePattern = /^[a-z0-9-]+(?:commentary|samples|batch)\.json$/;
const commentaryBookIndexAliases: Record<string, string> = {
  "Song of Solomon": "Solomon's Song",
};
let chapterIndexPromise: Promise<CommentaryChapterIndex> | null = null;

function loadChapterIndex() {
  chapterIndexPromise ??= readTextContent(
    ["data", "commentary", "reports", "commentary-chapter-file-index.json"],
    {
      errorLabel: "Commentary chapter index",
      revalidateSeconds: 60 * 60 * 24,
    },
  ).then((raw) => JSON.parse(raw) as CommentaryChapterIndex);

  return chapterIndexPromise;
}

async function readCommentaryRows(fileName: string) {
  if (!publicCommentaryFilePattern.test(fileName)) {
    throw new Error(`Invalid indexed commentary file: ${fileName}`);
  }

  const raw = await readTextContent(["data", "imports", fileName], {
    errorLabel: "Commentary import",
    revalidateSeconds: 60 * 60 * 24,
  });
  const rows = JSON.parse(raw) as CommentaryRow[];

  if (!Array.isArray(rows)) {
    throw new Error(`Commentary import must contain an array: ${fileName}`);
  }

  return rows;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ book: string; chapter: string }> },
) {
  const { book: encodedBook, chapter: chapterValue } = await context.params;
  const book = decodeURIComponent(encodedBook).trim();
  const chapter = Number(chapterValue);

  if (!book || !Number.isInteger(chapter) || chapter < 1) {
    return NextResponse.json({ error: "Invalid commentary chapter." }, { status: 400 });
  }

  try {
    const index = await loadChapterIndex();
    const indexedBook = commentaryBookIndexAliases[book] ?? book;
    const fileIndexes = index.chapters[`${indexedBook}|${chapter}`];

    if (!fileIndexes) {
      return NextResponse.json({ error: "Commentary chapter not found." }, { status: 404 });
    }

    const fileNames = fileIndexes
      .map((fileIndex) => index.files[fileIndex])
      .filter((fileName): fileName is string => Boolean(fileName));
    if (fileNames.length !== fileIndexes.length) {
      throw new Error("Commentary chapter index references an unknown file.");
    }

    const groups = await Promise.all(fileNames.map((fileName) => readCommentaryRows(fileName)));
    const entries = groups
      .flat()
      .filter((row) => String(row.book ?? "").trim() === indexedBook && Number(row.chapter) === chapter)
      .map((row) => indexedBook === book ? row : { ...row, book });

    return NextResponse.json(entries, {
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=86400",
        "x-commentary-source-files": String(fileNames.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Commentary chapter could not be loaded." }, { status: 500 });
  }
}
