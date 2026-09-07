export type TeachingSegment = {
  id: string;
  title: string;
  passage: string;
  minutes: number;
  notes: string;
  question: string;
  answer: string;
  application: string;
};
export type LessonPlan = {
  date: string;
  objective: string;
  segments: TeachingSegment[];
  prayer: string;
  resources: string;
  media: string;
};

export function normalizeLessonPlan(value: unknown): LessonPlan | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const plan = value as Record<string, unknown>;
  const text = (value: unknown) => typeof value === "string" ? value : "";
  return {
    date: text(plan.date), objective: text(plan.objective), prayer: text(plan.prayer),
    resources: text(plan.resources), media: text(plan.media),
    segments: Array.isArray(plan.segments) ? plan.segments.filter((s) => s && typeof s === "object").map((s, i) => ({
      id: `segment-${i}`, title: text(s.title), passage: text(s.passage),
      minutes: Number.isFinite(Number(s.minutes)) ? Math.min(120, Math.max(1, Math.round(Number(s.minutes)))) : 5,
      notes: text(s.notes), question: text(s.question), answer: text(s.answer), application: text(s.application),
    })) : [],
  };
}
export function lessonSchedule(plan: LessonPlan) {
  let minute = 0;
  return plan.segments.map((segment) => {
    const start = minute;
    minute += segment.minutes;
    return { ...segment, start, end: minute };
  });
}
export function lessonSegmentNotes(segment: TeachingSegment) {
  return [segment.passage && `Read: ${segment.passage} (KJV)`, segment.notes,
    segment.question && `Discuss: ${segment.question}`, segment.answer && `Teacher answer guide: ${segment.answer}`,
    segment.application && `Apply: ${segment.application}`].filter(Boolean).join("\n\n");
}
export function lessonPlanMarkdown(plan?: LessonPlan) {
  if (!plan) return "";
  return ["## Sunday School Teaching Plan", `Date: ${plan.date || "If asked / not scheduled"}`,
    `Objective: ${plan.objective}`, ...lessonSchedule(plan).flatMap(s => [
      `### ${s.start}–${s.end} min: ${s.title}`, lessonSegmentNotes(s),
    ]), "### Prayer", plan.prayer, "### Resource comparison and source notes", plan.resources,
    "### Hymn / media planning (teacher only)", plan.media].join("\n\n");
}
const segment = (title: string, passage: string, minutes: number, notes: string, question: string, answer: string, application: string): TeachingSegment =>
  ({ id: passage, title, passage, minutes, notes, question, answer, application });
const resources = "Read the whole chapter in KJV first. In Commentary Explorer, select two or three available authors and compare the same verses. Record each author/work, verse, explanation, agreement or difference, and your conclusion from Scripture here. Availability is not doctrinal endorsement. Check author cautions. Do not assume owned Logos books are licensed for import.\nWord study: use Webster and the verse-linked Strong's entry; distinguish the English definition, lexical range, and meaning in context.\nCross-references: read each suggested passage in context; record why it helps, not just the reference.";
const media = "Use an app-provided simple Scripture or open-Bible background. Hymn suggestion only; verify the specific lyrics, arrangement, recording, and church permissions before using media. No recording or lyrics are bundled. A five-minute pre-class question slide can be added in Slide Builder; music playback and video production remain separate work.";
export const SUNDAY_LESSONS = {
  "2": {
    title: "The Ministry of Forgiveness", passage: "2 Corinthians 2:1-17",
    theme: "Restore the repentant and serve sincerely in Christ",
    introduction: "Read the chapter and recall Paul's sorrowful concern for the church. Ask what a church should do when discipline has accomplished its purpose.",
    illustration: "Original analogy: medicine aims at healing, not keeping a patient ill. Church discipline should seek restoration; do not use the analogy to minimize sin or necessary protection.",
    plan: {
      date: "2026-09-13", objective: "Explain Paul's call to forgive and comfort, then identify a concrete way to reaffirm love without excusing sin.",
      segments: [
        segment("Love behind a painful letter", "2 Corinthians 2:1-4", 7, "Trace Paul's grief, tears, and abundant love. Correction and affection belong together.", "What does verse 4 reveal about Paul's motive?", "He wrote so they would know his abundant love, not merely to grieve them.", "Examine your motive before correcting someone."),
        segment("Forgive, comfort, and confirm love", "2 Corinthians 2:5-11", 15, "Follow the movement from sufficient punishment to forgiveness and comfort. Do not insist that the unnamed offender is certainly the man of 1 Corinthians 5; compare the contexts and acknowledge the identification is debated. Emphasize the danger of overwhelming sorrow and Satan's advantage.", "What should follow when correction has done its work?", "Verses 7-8 call for forgiveness, comfort, and confirmed love. Verse 11 connects their response with resisting Satan's advantage.", "Plan a fitting act of encouragement toward a repentant believer. Forgiveness need not erase wise boundaries."),
        segment("Christ's savour and sincere ministry", "2 Corinthians 2:12-17", 10, "Notice Paul's unrest about Titus, thanksgiving for Christ's triumph, and different responses to the gospel. Verse 17 contrasts corrupting God's word with sincerity before God.", "What governs faithful ministry when responses differ?", "Christ's triumph and accountability before God, rather than popularity or manipulating the message.", "Speak God's truth sincerely even when results vary."),
        segment("Response and prayer", "2 Corinthians 2:7-8", 3, "Summarize correction, restoration, and sincere ministry. Return to the passage before the closing prayer.", "What act of confirmed love can you practice this week?", "Invite specific, discreet answers; do not invite disclosure of another person's private sin.", "Choose one action and pray for grace to carry it out."),
      ], prayer: "Ask the Lord for humility in correction, readiness to forgive, comfort for the sorrowful, and sincerity in handling His word.",
      resources: resources + "\nSuggested word studies: confirm (2:8), devices (2:11), savour (2:14-16), corrupt (2:17). Compare Matthew 18:15-17; Galatians 6:1; Ephesians 4:32. These are study prompts, not imported commentary.",
      media: "Suggested hymn: Grace Greater Than Our Sin. " + media,
    } satisfies LessonPlan,
  },
  "3": {
    title: "Our Sufficiency Is of God", passage: "2 Corinthians 3:1-18", theme: "The Spirit's ministry and the glory of Christ",
    introduction: "Review Paul's sincerity in 2:17, then follow his question about letters of commendation. Keep the old and new testament contrast in its chapter context.",
    illustration: "Original analogy: a letter introduces its sender, but changed lives make a testimony visible. Keep the illustration subordinate to Paul's language in verses 2-3.",
    plan: {
      date: "", objective: "Explain why ministry depends on God and how beholding the Lord's glory relates to a changed life.",
      segments: [
        segment("A living epistle", "2 Corinthians 3:1-3", 7, "Contrast external credentials with the Corinthians as an epistle of Christ. Note the Spirit's work on hearts.", "What evidence of ministry does Paul point to?", "The Corinthians themselves, described as an epistle of Christ ministered by the apostles.", "Consider what your conduct communicates about Christ."),
        segment("Sufficiency from God", "2 Corinthians 3:4-6", 8, "Paul denies self-sufficiency and locates his sufficiency in God. Do not use letter and spirit to dismiss careful reading or obedience to Scripture.", "Where does Paul locate his sufficiency?", "In God, who made them able ministers of the new testament.", "Prepare diligently while depending on the Lord."),
        segment("Greater glory and the removed vail", "2 Corinthians 3:7-16", 12, "Read Exodus 34:29-35 for the setting. Trace glory, condemnation, righteousness, and the turning to the Lord. Avoid treating Paul's contrast as permission to despise the Old Testament or Israel.", "What happens when the heart turns to the Lord?", "Verse 16 says the vail is taken away. Explain this within Paul's contrast of the two ministries.", "Read Scripture looking to Christ rather than resting in outward privilege."),
        segment("Changed into the same image", "2 Corinthians 3:17-18", 8, "Connect liberty with the Spirit and transformation with beholding the Lord's glory, not self-directed freedom from holiness.", "What kind of change is described in verse 18?", "Change into the same image from glory to glory by the Spirit of the Lord.", "Name one area where Christ's likeness should increasingly appear."),
      ], prayer: "Thank God for His sufficiency; ask for understanding of His word and growth in the likeness of Christ.",
      resources: resources + "\nStudy sufficiency (3:5), testament (3:6), vail (3:13-16), liberty (3:17). Compare Exodus 34:29-35; Jeremiah 31:31-34; James 1:22-25.",
      media: "Suggested hymn: Take My Life, and Let It Be. " + media,
    } satisfies LessonPlan,
  },
  "6": {
    title: "Faithful Ministry and a Separated Walk", passage: "2 Corinthians 6:1-18", theme: "Receive God's grace seriously and walk in holiness",
    introduction: "Read 5:20-21 as context, then read chapter 6. Follow the appeal, the marks of ministry, the open heart, and the call to separation.",
    illustration: "Original analogy: two animals pulling a load in opposing directions cannot work as a team. Use this only to illuminate the unequal yoke; let the passage define the spiritual issue.",
    plan: {
      date: "2026-10-11", objective: "Identify marks of faithful ministry and apply separation from unbelieving compromise while maintaining a loving witness.",
      segments: [
        segment("Respond to God's grace now", "2 Corinthians 6:1-2", 6, "Connect Paul's appeal with reconciliation in chapter 5. Read the quotation in verse 2 and note its urgency.", "How should the accepted time shape our response?", "We should respond to God's grace seriously and without delay.", "Do not postpone responding to the gospel or obeying known truth."),
        segment("Commending the ministry", "2 Corinthians 6:3-10", 12, "Group Paul's hardships, character qualities, and paradoxes. Faithfulness is not measured simply by comfort or public approval.", "What marks faithful service under pressure?", "Patience, pureness, knowledge, longsuffering, kindness, the Holy Ghost, love unfeigned, and truth appear among Paul's marks.", "Choose a Christlike response in a present difficulty."),
        segment("An open heart", "2 Corinthians 6:11-13", 5, "Observe Paul's affection and appeal to the Corinthians as children. Keep the pastoral tone as the next exhortation is read.", "What response does Paul seek from the Corinthians?", "An enlarged, receptive heart rather than restricted affection.", "Receive faithful biblical counsel with humility."),
        segment("The temple of the living God", "2 Corinthians 6:14-18", 12, "Trace the five contrasts and God's promises. Apply the unequal yoke to binding partnerships that compromise allegiance to Christ. Do not present holiness as a way to earn salvation or use the passage to forbid ordinary contact with unbelievers; compare 1 Corinthians 5:9-10.", "How do God's presence and promises motivate separation?", "Believers belong to the living God; His promise to dwell among and receive His people grounds a holy response.", "Examine one commitment for spiritual compromise while continuing to love and witness to unbelievers."),
      ], prayer: "Ask for sincere ministry, patience in hardship, a receptive heart, and holy decisions grounded in belonging to the Lord.",
      resources: resources + "\nStudy succour (6:2), unfeigned (6:6), straitened (6:12), concord (6:15). Compare Isaiah 49:8; 1 Corinthians 5:9-10; 2 Corinthians 7:1.",
      media: "Suggested hymn: More Holiness Give Me. " + media,
    } satisfies LessonPlan,
  },
} as const;
export type SundayLessonId = keyof typeof SUNDAY_LESSONS;
