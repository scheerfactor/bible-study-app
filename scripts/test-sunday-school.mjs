import assert from 'node:assert/strict';
import { SUNDAY_LESSONS, normalizeLessonPlan, lessonSchedule, lessonPlanMarkdown } from '../src/lib/sunday-school.ts';
for (const [id, lesson] of Object.entries(SUNDAY_LESSONS)) {
  const plan = normalizeLessonPlan(JSON.parse(JSON.stringify(lesson.plan)));
  assert.equal(lessonSchedule(plan).at(-1).end, 35);
  assert.equal(plan.segments.length, 4);
  assert.ok(plan.segments.every(s => s.passage.startsWith(`2 Corinthians ${id}:`) && s.question && s.answer && s.application));
  assert.match(lessonPlanMarkdown(plan), /Teacher answer guide/);
  assert.match(lessonPlanMarkdown(plan), /Hymn \/ media planning/);
  assert.equal(new Set(plan.segments.map(s => s.id)).size, 4);
}
assert.equal(normalizeLessonPlan(undefined), undefined);
assert.equal(normalizeLessonPlan([]), undefined);
const damaged = normalizeLessonPlan({ segments: [null, { minutes: Infinity }, { minutes: -5 }, { minutes: 999 }, { minutes: '8', question: 7 }] });
assert.deepEqual(damaged.segments.map(s => s.minutes), [5, 1, 120, 8]);
assert.equal(damaged.segments[3].question, '');
assert.equal(normalizeLessonPlan(SUNDAY_LESSONS['3'].plan).date, '');
assert.equal(normalizeLessonPlan(SUNDAY_LESSONS['6'].plan).date, '2026-10-11');
console.log('Sunday School tests passed: templates, timing, export, legacy absence, malformed backups.');
const { offlinePresentationHtml } = await import('../src/lib/offline-presentation.ts');
const html = offlinePresentationHtml('<script>alert(1)</script>', [{title:'Test',subtitle:'KJV',body:'<img src=x onerror=alert(1)>',bibleText:'',speakerNotes:'PRIVATE ANSWER'}]);
assert.ok(!html.includes('PRIVATE ANSWER'));
assert.ok(!html.includes('<img src=x'));
assert.ok(html.includes('&lt;script&gt;'));
console.log('Offline export escaping and teacher-note exclusion PASS');
