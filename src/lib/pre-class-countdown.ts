export type CountdownItem = {
  id: string; kind: 'welcome' | 'question' | 'verse' | 'context' | 'phone' | 'announcement' | 'prayer';
  title: string; body: string; reference: string; seconds: number; revealSeconds: number;
  choices: string[]; answer: number; explanation: string;
};
export type CountdownPlan = { version: 1; backgroundId?: string; title: string; projectId: string; minutes: number; items: CountdownItem[]; reviewed: boolean; hymn: string };
export type LessonSource = {
  id: string; title: string; passage: string; theme?: string;
  series?: string; scripture: string;
  announcements?: string[];
  lessonPlan?: { prayer?: string; media?: string; segments?: { question: string; answer: string; passage: string }[] };
};
export const newItem = (kind: CountdownItem['kind'], title = '', body = ''): CountdownItem => ({
  id: crypto.randomUUID(), kind, title, body, reference: '', seconds: 25, revealSeconds: 15, choices: ['', '', ''], answer: 0, explanation: '',
});
export const templatePresets = [
  { name: 'Bible challenge · 5 minutes', minutes: 5, questionSeconds: 25, revealSeconds: 25 },
  { name: 'Quiet preparation · 3 minutes', minutes: 3, questionSeconds: 25, revealSeconds: 15 },
  { name: 'Church welcome · 10 minutes', minutes: 10, questionSeconds: 30, revealSeconds: 20 },
];
export function suggestPlan(source: LessonSource, preset = templatePresets[0]): CountdownPlan {
  const items = [newItem('welcome', source.title || 'Welcome', 'Our class begins soon.'), newItem('context', 'Today in our study', [source.series, source.passage, source.theme].filter(Boolean).join('\n'))];
  // Only explicit Scripture supplied by the app's KJV resolver is eligible for verse suggestions.
  const verses = source.scripture.split('\n').filter(Boolean).slice(0, 2);
  for (const line of verses) {
    const match = line.match(/^(.+?\s\d+:\d+)\s+(.+)$/);
    if (!match) continue;
    const [, reference, body] = match;
    const words = [...new Set(body.match(/\b[A-Za-z]{5,}\b/g) || [])];
    if (words.length >= 3 && body.length <= 430) {
      const answer = words[words.length - 1];
      const question = newItem('question', 'Complete the verse', body.replace(new RegExp(`\\b${answer}\\b`), '_____'));
      Object.assign(question, { reference, choices: [words[0], answer, words[1]], answer: 1, explanation: body, seconds: preset.questionSeconds, revealSeconds: preset.revealSeconds });
      items.push(question);
    }
    if (body.length <= 600) items.push({ ...newItem('verse', 'Remember the Word', body), reference });
  }
  items.push(newItem('phone', 'Please silence your phone', 'Thank you for helping us listen together.'));
  for (const announcement of source.announcements || []) if (announcement.trim()) items.push(newItem('announcement', 'Announcement', announcement));
  if (source.lessonPlan?.prayer) items.push(newItem('prayer', 'Prepare your heart', source.lessonPlan.prayer));
  else items.push(newItem('prayer', 'Prepare your heart', 'Ask the Lord to help us understand and obey His Word.'));
  const text = `${source.title} ${source.theme}`.toLowerCase();
  const hymn = /forgiv|grace|restor/.test(text) ? 'Grace Greater Than Our Sin' : /faith|trust|foundation/.test(text) ? 'How Firm a Foundation' : 'Take My Life and Let It Be';
  return { version: 1, title: source.title || 'Pre-class countdown', projectId: source.id, minutes: preset.minutes, items, reviewed: false, hymn };
}
export function validatePlan(value: unknown): string[] {
  const p = value as CountdownPlan;
  if (!p || p.version !== 1 || typeof p.title !== 'string' || typeof p.projectId !== 'string' || typeof p.hymn !== 'string' || typeof p.reviewed !== 'boolean' || !Array.isArray(p.items)) return ['Unsupported or damaged countdown file.'];
  const errors: string[] = [];
  if (p.backgroundId !== undefined && (typeof p.backgroundId !== 'string' || !/^[a-z0-9-]{1,80}$/.test(p.backgroundId))) errors.push('Invalid background selection.');
  if (!Number.isInteger(p.minutes) || p.minutes < 1 || p.minutes > 60) errors.push('Choose a duration from 1 to 60 whole minutes.');
  if (!p.items.length || p.items.length > 40) errors.push('Include between 1 and 40 slides.');
  const ids = new Set<string>();
  for (const [i, item] of p.items.entries()) {
    if (!item || typeof item.id !== 'string' || ids.has(item.id) || !['welcome','question','verse','context','phone','announcement','prayer'].includes(item.kind) || !['title','body','reference','explanation'].every(k => typeof item[k as keyof CountdownItem] === 'string') || !Array.isArray(item.choices) || !item.choices.every(c => typeof c === 'string')) { errors.push(`Slide ${i + 1} is damaged.`); continue; }
    ids.add(item.id);
    if (!item.title.trim() || item.title.length > 100 || item.body.length > 600 || item.reference.length > 100 || item.explanation.length > 600) errors.push(`Slide ${i + 1}: use a title up to 100 characters and text up to 600 characters.`);
    if (![item.seconds, item.revealSeconds].every(n => Number.isInteger(n) && n >= 5 && n <= 120)) errors.push(`Slide ${i + 1}: timings must be 5–120 seconds.`);
    if (item.kind === 'verse' && (!item.reference.trim() || !item.body.trim())) errors.push(`Slide ${i + 1}: add a KJV reference and verse.`);
    if (item.kind === 'question' && (item.choices.length < 2 || item.choices.length > 4 || item.choices.some(c => !c.trim() || c.length > 100) || new Set(item.choices.map(c => c.trim().toLowerCase())).size !== item.choices.length || !Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.choices.length || !item.reference.trim())) errors.push(`Slide ${i + 1}: add 2–4 distinct choices, a correct answer, and a Scripture reference.`);
  }
  return errors;
}
export function timeline(plan: CountdownPlan) {
  let start = 0;
  return plan.items.flatMap(item => {
    const phases = [{ item, reveal: false, start, end: start + item.seconds }];
    start += item.seconds;
    if (item.kind === 'question') { phases.push({ item, reveal: true, start, end: start + item.revealSeconds }); start += item.revealSeconds; }
    return phases;
  });
}
export function frameAt(plan: CountdownPlan, elapsed: number) {
  const total = plan.minutes * 60;
  const remaining = Math.max(0, Math.ceil(total - elapsed));
  const phases = timeline(plan);
  const cycle = phases.at(-1)?.end || 1;
  const position = Math.max(0, elapsed) % cycle;
  return { remaining, complete: remaining === 0, phase: phases.find(p => position >= p.start && position < p.end) || phases[0] };
}
export function clockText(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }
