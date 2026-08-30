export const COMMENTARY_EXCERPT_LIMIT = 700;

/** Validate a contiguous quotation without rewriting the source's wording. */
export function validateCommentaryExcerpt(source: string, candidate: string) {
  const text = candidate.trim();
  if (!text) return { text, start: -1, error: "Select or paste an excerpt from the source text." };
  if (text.length > COMMENTARY_EXCERPT_LIMIT) return { text, start: -1, error: `Choose no more than ${COMMENTARY_EXCERPT_LIMIT} characters for one readable slide.` };
  const start = source.indexOf(text);
  if (start < 0) return { text, start, error: "This wording does not exactly match the source. Copy one continuous excerpt without rewriting it." };
  return { text, start, error: "" };
}
