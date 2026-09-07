import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve(process.env.SUNDAY_TEST_OUTPUT || '/private/tmp/sunday-school-check');
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true});
try {
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
await page.goto('http://localhost:3107/#sermons');
for (const chapter of [2,3,6]) {
 await page.getByRole('button',{name:`2 Corinthians ${chapter} lesson`,exact:true}).click();
 await page.getByRole('heading',{name:'Sunday School teaching plan',exact:true}).waitFor();
 assert.match(await page.locator('body').innerText(), /Planned: 35 minutes/);
 await page.getByRole('button',{name:'Save',exact:true}).click();
 const saved = await page.evaluate(()=>Object.values(localStorage).flatMap(v=>{try{const a=JSON.parse(v); return Array.isArray(a)?a:[]}catch{return []}}).filter(x=>x?.lessonPlan));
 const lesson=saved.find(s=>s.passage===`2 Corinthians ${chapter}:1-${chapter===2?17:18}`);
 assert.ok(lesson,'lesson persisted');
 assert.ok(lesson.slides.length>18,'no silent 18-slide cap');
 assert.ok(lesson.slides.some(s=>s.bibleText.includes(`2 Corinthians ${chapter}:${chapter===2?17:18} `)),'last verse included');
 for(const segment of lesson.lessonPlan.segments){
   const question=lesson.slides.find(s=>s.type==='Question'&&s.body===segment.question);
   assert.equal(question?.speakerNotes,segment.answer);
   assert.ok(!lesson.slides.some(s=>(s.body+' '+s.bibleText).includes(segment.answer)),'answer is private');
 }
 const noteDownload=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download Preaching Notes',exact:true}).click();
 const notes=await noteDownload; await notes.saveAs(path.join(output,`2-corinthians-${chapter}-teacher-notes.md`));
 assert.match(await readFile(await notes.path(),'utf8'),/Teacher answer guide/);
 await page.getByRole('button',{name:'Slide Builder',exact:true}).click();
 const offlineDownload=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download offline presentation',exact:true}).click();
 const offline=await offlineDownload; const offlinePath=path.join(output,`2-corinthians-${chapter}-presentation.html`); await offline.saveAs(offlinePath);
 const audience=await browser.newPage({viewport:{width:1280,height:720}});
 await audience.context().setOffline(true);
 await audience.goto('file://'+offlinePath);
 assert.equal(await audience.locator('.slide:visible').count(),1);
 await audience.keyboard.press('End'); assert.equal(await audience.locator('#count').innerText(),`${lesson.slides.length} / ${lesson.slides.length}`);
 await audience.keyboard.press('b'); assert.ok(await audience.locator('#blank').isVisible());
 await audience.keyboard.press('b'); assert.ok(await audience.locator('#blank').isHidden());
 await audience.keyboard.press('Home'); await audience.keyboard.press('ArrowRight'); assert.equal(await audience.locator('#count').innerText(),`2 / ${lesson.slides.length}`);
 for(let i=0;i<lesson.slides.length;i++) { await audience.evaluate(i=>show(i),i); assert.ok(await audience.locator('.slide:visible').evaluate(el=>el.scrollHeight<=el.clientHeight+1),`slide ${i+1} fits`); }
 await audience.keyboard.press('Home'); await audience.screenshot({path:path.join(output,`2-corinthians-${chapter}-preview.png`)});
 await audience.close();
 const pptDownload=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download PowerPoint',exact:true}).click();
 const ppt=await pptDownload; assert.ok(ppt.suggestedFilename().endsWith('.pptx'));await ppt.saveAs(path.join(output,`2-corinthians-${chapter}.pptx`));
 await page.getByRole('button',{name:'Builder',exact:true}).click();
 console.log(`2 Corinthians ${chapter}: ${lesson.slides.length} slides; saved plan, final verse, private answers PASS`);
}
await page.getByRole('button',{name:'Preaching Mode',exact:true}).click();
assert.match(await page.locator('body').innerText(), /0–6 min: Respond to God's grace now/);
console.log('Timed teaching mode PASS');
await page.getByRole('button',{name:'Back to Builder',exact:true}).click();
await page.setViewportSize({width:390,height:844});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile layout fits');
await page.getByRole('heading',{name:'Sunday School teaching plan',exact:true}).scrollIntoViewIfNeeded();
await page.screenshot({path:path.join(output,'mobile-plan.png')});
await page.getByRole('button',{name:'Study lesson passage',exact:true}).click();
assert.match(await page.locator('body').innerText(),/2 Corinthians 6/);
console.log('Mobile layout and passage navigation PASS');
for(const chapter of [2,3,6]) {
 const commentary=await page.request.get(`http://localhost:3107/api/commentary/chapter/2%20Corinthians/${chapter}`);
 const rows=await commentary.json();
 const strong=await page.request.get(`http://localhost:3107/api/strongs?book=2%20Corinthians&chapter=${chapter}`);
 const mappings=await strong.json();
 console.log(`Study API chapter ${chapter}: commentary ${commentary.status()} (${Array.isArray(rows)?rows.length:0} rows), Strong's ${strong.status()} (${mappings.mappings?.length ?? 0} mappings; ${mappings.mapping_source ?? 'unavailable'})`);
}

await page.goto('http://localhost:3107/#sermons');
await page.getByRole('button',{name:'Load John 3 Sample',exact:true}).click();
await page.getByLabel('Passage',{exact:true}).fill('2 Corinthians 2');
await page.getByRole('button',{name:'Slide Builder',exact:true}).click();
page.once('dialog',dialog=>dialog.accept());
await page.getByRole('button',{name:'Generate Slide Outline',exact:true}).click();
await page.getByRole('button',{name:'Builder',exact:true}).click();
await page.getByRole('button',{name:'Save',exact:true}).click();
const regression=await page.evaluate(()=>Object.values(localStorage).flatMap(v=>{try{const a=JSON.parse(v);return Array.isArray(a)?a:[]}catch{return []}}).find(x=>x?.title==='Ye Must Be Born Again'));
assert.ok(regression.slides.some(s=>s.bibleText.includes('2 Corinthians 2:17 ')),'whole chapter retained');
assert.equal(regression.slides.at(-1).type,'Closing / Invitation');
await page.getByRole('button',{name:'Add a timed teaching plan',exact:true}).click();
await page.getByRole('heading',{name:'Sunday School teaching plan',exact:true}).waitFor();
console.log('Legacy lesson, whole-chapter reading, final closing slide, generic teaching plan PASS');

console.log('Page errors:',errors); assert.deepEqual(errors,[]);
} finally {await browser.close();}
