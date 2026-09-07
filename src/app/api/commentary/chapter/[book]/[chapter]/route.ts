import { NextResponse } from "next/server";
import { commentaryChapterIndex } from "@/lib/commentary-chapter-index";
import { readTextContent } from "@/lib/server-content-storage";
import spurgeonGospelKingdomRows from "../../../../../../../data/imports/spurgeon-reviewed-gospel-kingdom-matthew-commentary.json";
import andrewMurrayHoliestRows from "../../../../../../../data/imports/andrew-murray-reviewed-holiest-of-all-hebrews-commentary.json";
import ironsideExpositionPhaseTwoRows from "../../../../../../../data/imports/h-a-ironside-exposition-phase-2-commentary.json";
import ironsidePhilippiansRows from "../../../../../../../data/imports/h-a-ironside-reviewed-philippians-commentary.json";
import ironsideColossiansRows from "../../../../../../../data/imports/h-a-ironside-reviewed-colossians-commentary.json";
import ironsideRomansRows from "../../../../../../../data/imports/h-a-ironside-reviewed-romans-commentary.json";
import georgeClarkJohnRows from "../../../../../../../data/imports/george-w-clark-reviewed-john-commentary.json";
import josephAlexanderMarkRows from "../../../../../../../data/imports/joseph-addison-alexander-reviewed-mark-commentary.json";
import gaebeleinActsRows from "../../../../../../../data/imports/a-c-gaebelein-reviewed-acts-commentary.json";
import gaebeleinMatthewRows from "../../../../../../../data/imports/a-c-gaebelein-reviewed-matthew-commentary.json";
import gaebeleinRevelationRows from "../../../../../../../data/imports/a-c-gaebelein-reviewed-revelation-commentary.json";
import gaebeleinDanielRows from "../../../../../../../data/imports/a-c-gaebelein-reviewed-daniel-commentary.json";
import gaebeleinJoelRows from "../../../../../../../data/imports/a-c-gaebelein-reviewed-joel-commentary.json";
import ironsideEstherRows from "../../../../../../../data/imports/h-a-ironside-reviewed-esther-commentary.json";

type CommentaryRow = {
  book?: unknown;
  chapter?: unknown;
  [key: string]: unknown;
};

const publicCommentaryFilePattern = /^[a-z0-9-]+(?:commentary|samples|batch)\.json$/;
const commentaryBookIndexAliases: Record<string, string> = {
  "Song of Solomon": "Solomon's Song",
};

async function readCommentaryRows(fileName: string) {
  if (!publicCommentaryFilePattern.test(fileName)) {
    throw new Error(`Invalid indexed commentary file: ${fileName}`);
  }

  if (fileName === "spurgeon-reviewed-gospel-kingdom-matthew-commentary.json") {
    return spurgeonGospelKingdomRows as CommentaryRow[];
  }
  if (fileName === "andrew-murray-reviewed-holiest-of-all-hebrews-commentary.json") {
    return andrewMurrayHoliestRows as CommentaryRow[];
  }
  if (fileName === "h-a-ironside-exposition-phase-2-commentary.json") {
    return ironsideExpositionPhaseTwoRows as CommentaryRow[];
  }
  if (fileName === "h-a-ironside-reviewed-philippians-commentary.json") {
    return ironsidePhilippiansRows as CommentaryRow[];
  }
  if (fileName === "h-a-ironside-reviewed-colossians-commentary.json") {
    return ironsideColossiansRows as CommentaryRow[];
  }
  if (fileName === "h-a-ironside-reviewed-romans-commentary.json") {
    return ironsideRomansRows as CommentaryRow[];
  }
  if (fileName === "george-w-clark-reviewed-john-commentary.json") {
    return georgeClarkJohnRows as CommentaryRow[];
  }
  if (fileName === "joseph-addison-alexander-reviewed-mark-commentary.json") {
    return josephAlexanderMarkRows as CommentaryRow[];
  }
  if (fileName === "a-c-gaebelein-reviewed-acts-commentary.json") {
    return gaebeleinActsRows as CommentaryRow[];
  }
  if (fileName === "a-c-gaebelein-reviewed-matthew-commentary.json") {
    return gaebeleinMatthewRows as CommentaryRow[];
  }
  if (fileName === "a-c-gaebelein-reviewed-revelation-commentary.json") {
    return gaebeleinRevelationRows as CommentaryRow[];
  }
  if (fileName === "a-c-gaebelein-reviewed-daniel-commentary.json") {
    return gaebeleinDanielRows as CommentaryRow[];
  }
  if (fileName === "a-c-gaebelein-reviewed-joel-commentary.json") {
    return gaebeleinJoelRows as CommentaryRow[];
  }
  if (fileName === "h-a-ironside-reviewed-esther-commentary.json") {
    return ironsideEstherRows as CommentaryRow[];
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
    const index = commentaryChapterIndex;
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
