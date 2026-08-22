export function normalizeLibrarySearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function librarySearchTextContainsTerm(text: string, term: string) {
  const normalizedText = normalizeLibrarySearchText(text);
  const normalizedTerm = normalizeLibrarySearchText(term);
  if (!normalizedTerm) return false;
  return ` ${normalizedText} `.includes(` ${normalizedTerm} `);
}
