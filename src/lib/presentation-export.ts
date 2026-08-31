export type PresentationExportMode = "slides-only" | "presenter";

export function presentationExportOptions(mode: PresentationExportMode, slug: string, notes: string) {
  const includeSpeakerNotes = mode === "presenter";
  return {
    includeSpeakerNotes,
    subject: includeSpeakerNotes ? notes || "Church presentation slides" : "Church presentation slides",
    filename: `${slug}-${includeSpeakerNotes ? "presenter-with-notes" : "slides-only"}.pptx`,
  };
}
