export type PresentationExportMode = "slides-only" | "presenter";

export const POWERPOINT_BODY_LIMIT = 1400;
export type PowerPointSlideText = { id?: string; title: string; bibleText: string; body: string };

export function powerPointBodyText(value: string) {
  return value.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
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
