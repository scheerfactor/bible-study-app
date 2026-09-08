export const COMMENTARY_EXCERPT_LIMIT = 700;

/** Literal, case-insensitive search; offsets always refer to unchanged source text. */
export function findCommentaryMatches(source: string, query: string) {
  const phrase = query.trim();
  if (!phrase) return [];
  const pattern = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");
  return Array.from(source.matchAll(pattern), (match) => ({ start: match.index, end: match.index + match[0].length }));
}

export function commentaryMatchContext(source: string, match: { start: number; end: number }) {
  const start = Math.max(0, match.start - 160);
  const end = Math.min(source.length, match.end + 160);
  return { start, end, before: source.slice(start, match.start), matched: source.slice(match.start, match.end), after: source.slice(match.end, end), text: source.slice(start, end) };
}

/** Validate a contiguous quotation without rewriting the source's wording. */
export function validateCommentaryExcerpt(source: string, candidate: string) {
  const text = candidate.trim();
  if (!text) return { text, start: -1, error: "Select or paste an excerpt from the source text." };
  if (text.length > COMMENTARY_EXCERPT_LIMIT) return { text, start: -1, error: `Choose no more than ${COMMENTARY_EXCERPT_LIMIT} characters for one readable slide.` };
  const start = source.indexOf(text);
  if (start < 0) return { text, start, error: "This wording does not exactly match the source. Copy one continuous excerpt without rewriting it." };
  return { text, start, error: "" };
}
