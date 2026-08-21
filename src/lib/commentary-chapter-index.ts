import chapterIndex from "../../data/commentary/reports/commentary-chapter-file-index.json";

export type CommentaryChapterIndex = {
  schema_version: number;
  catalog_file_count: number;
  indexed_file_count: number;
  row_count: number;
  chapter_count: number;
  files: string[];
  chapters: Record<string, number[]>;
};

export const commentaryChapterIndex = chapterIndex as CommentaryChapterIndex;
