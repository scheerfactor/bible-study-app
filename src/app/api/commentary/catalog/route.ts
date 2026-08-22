import { NextResponse } from "next/server";
import { commentaryChapterIndex } from "@/lib/commentary-chapter-index";

const commentaryBookDisplayAliases: Record<string, string> = {
  "Solomon's Song": "Song of Solomon",
};

export async function GET() {
  try {
    const catalog = commentaryChapterIndex;
    const chaptersByBook = new Map<string, number[]>();

    Object.keys(catalog.chapters).forEach((chapterKey) => {
      const separatorIndex = chapterKey.lastIndexOf("|");
      if (separatorIndex < 1) return;
      const indexedBook = chapterKey.slice(0, separatorIndex).trim();
      const book = commentaryBookDisplayAliases[indexedBook] ?? indexedBook;
      const chapter = Number(chapterKey.slice(separatorIndex + 1));
      if (!book || !Number.isInteger(chapter) || chapter < 1) return;

      const chapters = chaptersByBook.get(book) ?? [];
      chapters.push(chapter);
      chaptersByBook.set(book, chapters);
    });

    const books = Array.from(chaptersByBook.entries()).map(([book, chapters]) => ({
      book,
      chapters: chapters.sort((left, right) => left - right),
    }));

    return NextResponse.json({
      schemaVersion: catalog.schema_version,
      catalogFileCount: catalog.catalog_file_count,
      indexedFileCount: catalog.indexed_file_count,
      rowCount: catalog.row_count,
      chapterCount: catalog.chapter_count,
      books,
    }, {
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Commentary catalog could not be loaded." }, { status: 500 });
  }
}
