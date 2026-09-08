export type PresentationExportMode = "slides-only" | "presenter";

export const POWERPOINT_BODY_LIMIT = 1400;
export type PowerPointSlideText = { id?: string; title: string; bibleText: string; body: string };

export function powerPointBodyText(value: string) {
  return value.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function splitPresentationBodyText(value: string, maxLength: number) {
  const normalized = powerPointBodyText(value);
  if (!normalized || normalized.length <= maxLength) return [normalized];
  const units = normalized.match(/[^.!?\n]+(?:[.!?]+[\"'’”)]*)?|\n+/g) ?? [normalized];
  const chunks: string[] = [];
  let current = "";
  const commit = () => {
    const clean = current.trim();
    if (clean) chunks.push(clean);
    current = "";
  };
  const appendWords = (text: string) => {
    for (const word of text.trim().split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxLength && current) commit();
      current = current ? `${current} ${word}` : word;
    }
  };
  for (const unit of units) {
    if (/^\n+$/.test(unit)) {
      if (current && !current.endsWith("\n")) current += "\n";
      continue;
    }
    const clean = unit.trim();
    const separator = current && !current.endsWith("\n") ? " " : "";
    if (`${current}${separator}${clean}`.length <= maxLength) {
      current = `${current}${separator}${clean}`;
    } else if (clean.length <= maxLength) {
      commit();
      current = clean;
    } else {
      commit();
      appendWords(clean);
    }
  }
  commit();
  return chunks.length ? chunks : [normalized];
}

export function powerPointTextIssues(slides: readonly PowerPointSlideText[]) {
  return slides.flatMap((slide, index) => {
    const length = powerPointBodyText(slide.bibleText || slide.body).length;
    return length > POWERPOINT_BODY_LIMIT ? [{ id: slide.id, number: index + 1, title: slide.title || "Untitled slide", length }] : [];
  });
}

export function powerPointTextWarning(slides: readonly PowerPointSlideText[]) {
  const issues = powerPointTextIssues(slides);
  return issues.length ? `PowerPoint export paused: slide${issues.length === 1 ? "" : "s"} ${issues.map((issue) => issue.number).join(", ")} exceed the ${POWERPOINT_BODY_LIMIT.toLocaleString("en-US")}-character body limit. Split the text across slides without changing its wording, then export again. Your draft is unchanged; no file was downloaded.` : "";
}

export function presentationExportOptions(mode: PresentationExportMode, slug: string, notes: string) {
  const includeSpeakerNotes = mode === "presenter";
  return {
    includeSpeakerNotes,
    subject: includeSpeakerNotes ? notes || "Church presentation slides" : "Church presentation slides",
    filename: `${slug}-${includeSpeakerNotes ? "presenter-with-notes" : "slides-only"}.pptx`,
  };
}
