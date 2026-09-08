'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clockText, frameAt, newItem, suggestPlan, templatePresets, timeline, validatePlan, type CountdownItem, type CountdownPlan, type LessonSource } from '@/lib/pre-class-countdown';
import PresentationImageLibrary, { type PresentationImage } from '../PresentationImageLibrary';
import styles from './countdown.module.css';

type Props = { storageScope?: string; images?: PresentationImage[]; lesson: Omit<LessonSource, 'scripture'>; resolveScripture: (passage: string) => string };
export default function CountdownBuilder(props: Props) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold" onClick={() => setOpen(true)}>Pre-class countdown</button>{open && createPortal(<Builder {...props} onClose={() => setOpen(false)} />, document.body)}</>;
}
function Builder({ lesson, resolveScripture, onClose, images = [], storageScope = "local" }: Props & { onClose: () => void }) {
  const source = { ...lesson, scripture: resolveScripture(lesson.passage) };
  const key = storageScope === "local" ? `fathers-business-countdown-v1:${lesson.id}` : `fathers-business-countdown-v1:${storageScope}:${lesson.id}`;
  const templateKey = storageScope === "local" ? "fathers-business-countdown-templates-v1" : `fathers-business-countdown-templates-v1:${storageScope}`;
  const [initial] = useState(() => {
    let raw: string | null = null;
    let error = '';
    try {
      raw = localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (validatePlan(parsed).length) throw new Error('The saved countdown is damaged. It has not been overwritten.');
        return { plan: parsed as CountdownPlan, raw, error };
      }
    } catch (problem) { error = problem instanceof Error ? problem.message : 'Local storage is unavailable.'; }
    return { plan: suggestPlan(source), raw, error };
  });
  const stored = useRef(initial.raw);
  const [plan, setPlan] = useState(initial.plan);
  const [message, setMessage] = useState(initial.error);
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState(0);
  const [editing, setEditing] = useState(false);
  const [templates, setTemplates] = useState<CountdownPlan[]>(() => {
    try { const v = JSON.parse(localStorage.getItem(templateKey) || '[]'); return Array.isArray(v) ? v.filter(x => !validatePlan(x).length) : []; } catch { return []; }
  });
  const [templateName, setTemplateName] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [blank, setBlank] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioName, setAudioName] = useState('');
  const [rights, setRights] = useState(false);
  const [rightsNote, setRightsNote] = useState('');
  const [volume, setVolume] = useState(0.3);
  const audio = useRef<HTMLAudioElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const slide = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const run = useRef({ base: 0, started: 0 });
  const frame = frameAt(plan, elapsed);
  const current = plan.items[selected] || plan.items[0];
  const errors = validatePlan(plan);
  for (const [i, item] of plan.items.entries()) {
    if (item.kind === 'verse') {
      const expected = resolveScripture(item.reference).replace(new RegExp(`^${item.reference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`), '').trim();
      if (expected !== item.body.trim()) errors.push(`Slide ${i + 1}: verse text must match the app’s KJV source. Use “Load KJV verse”.`);
    }
  }
  const background = images.find(image => image.id === plan.backgroundId);
  if (plan.backgroundId && !background) errors.push('Choose an available background image or use the plain background.');
  const musicReady = !audioUrl || (rights && rightsNote.trim().length > 0);
  function change(patch: Partial<CountdownPlan>) { setPlan(p => ({ ...p, ...patch, reviewed: false })); setDirty(true); setMessage(''); }
  function edit(patch: Partial<CountdownItem>) { change({ items: plan.items.map((item, i) => i === selected ? { ...item, ...patch } : item) }); }
  function stop() { setRunning(false); audio.current?.pause(); }
  function reset() { stop(); setElapsed(0); run.current.base = 0; if (audio.current) audio.current.currentTime = 0; }
  function play() {
    if (errors.length || !plan.reviewed || !musicReady) return;
    const base = frame.complete ? 0 : elapsed;
    setElapsed(base); run.current = { base, started: performance.now() }; setRunning(true);
    if (audio.current && audioUrl) {
      if (!base) audio.current.currentTime = 0;
      audio.current.volume = volume;
      void audio.current.play().catch(() => { setRunning(false); setMessage('Music could not start. Choose a supported local recording, or remove it to run silently.'); });
    }
  }
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const seconds = Math.min(plan.minutes * 60, run.current.base + (performance.now() - run.current.started) / 1000);
      setElapsed(seconds);
      if (audio.current) audio.current.volume = volume * Math.min(1, Math.max(0, plan.minutes * 60 - seconds) / 4);
      if (seconds >= plan.minutes * 60) { setRunning(false); audio.current?.pause(); }
    };
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [running, plan.minutes, volume]);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!presenting) return;
      if (e.key === 'Escape') { setPresenting(false); setRunning(false); audio.current?.pause(); if (document.fullscreenElement) void document.exitFullscreen(); }
      if (e.key.toLowerCase() === 'b') setBlank(b => !b);
      if (e.key === ' ') { e.preventDefault(); setRunning(false); audio.current?.pause(); }
    };
    const fullscreen = () => { if (!document.fullscreenElement) { setPresenting(false); setRunning(false); audio.current?.pause(); } };
    document.addEventListener('keydown', handler); document.addEventListener('fullscreenchange', fullscreen);
    return () => { document.removeEventListener('keydown', handler); document.removeEventListener('fullscreenchange', fullscreen); };
  }, [presenting]);
  function save() {
    if (errors.length) { setMessage(errors.join(' ')); return; }
    try {
      if (initial.error) throw new Error('The original saved countdown could not be read. Export your new draft; the original has been preserved.');
      if (localStorage.getItem(key) !== stored.current) throw new Error('This countdown changed in another tab. Export your draft before closing; reopen to load the newer copy.');
      const serialized = JSON.stringify(plan); localStorage.setItem(key, serialized); stored.current = serialized;
      setDirty(false); setMessage('Saved on this browser for this lesson.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed. Export the draft before closing.'); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'pre-class-countdown.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const audienceItem = frame.phase?.item;
  const displayItem = presenting || running || elapsed > 0 ? audienceItem : current;
  const reveal = (presenting || running || elapsed > 0) && frame.phase?.reveal;
  useLayoutEffect(() => {
    const element = slide.current;
    if (!element) return;
    const fit = () => {
      element.style.setProperty('--fit', '1');
      let scale = 1;
      while (element.scrollHeight > element.clientHeight + 1 && scale > 0.5) {
        scale -= 0.025; element.style.setProperty('--fit', String(scale));
      }
    };
    const observer = new ResizeObserver(fit); observer.observe(element); fit();
    return () => observer.disconnect();
  }, [displayItem, reveal, frame.complete, presenting]);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    shell.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const elements = Array.from(shell.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),summary') || []).filter(e => e.getClientRects().length && !e.closest('fieldset:disabled'));
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); prior?.focus(); };
  }, []);

  return <div ref={shell} className={styles.shell} role="dialog" aria-modal="true" aria-label="Pre-class countdown builder">
    <header className={styles.header}><div><small>PREPARE TO TEACH / PRE-CLASS</small><h1>Gather around the Word</h1><p>{lesson.title} · {lesson.passage}</p></div><button onClick={() => { if (dirty) { setMessage('Save or export your changes, then use “Close without saving” if needed.'); return; } stop(); onClose(); }}>Close</button></header>
    <div className={styles.layout}><section className={styles.editor}>
      <h2>1. Review your slides</h2><p>Saved separately from your lesson, on this browser. Audio must be selected each session.</p>
      <fieldset disabled={running || presenting}>
      <label>Total minutes<input type="number" min="1" max="60" value={plan.minutes} onChange={e => change({ minutes: Number(e.target.value) })} /></label>
      <details><summary>Start over with lesson suggestions</summary><label>Lesson suggestions<select defaultValue="" onChange={e => { if (!e.target.value) return; const next = suggestPlan(source, templatePresets[Number(e.target.value)]); change(next); setSelected(0); reset(); e.target.value = ''; }}><option value="">Replace with a fresh suggested sequence…</option>{templatePresets.map((p,i) => <option key={p.name} value={i}>{p.name}</option>)}</select></label>
      <p>Questions use exact KJV verse completion. Hymn candidate: <strong>{plan.hymn}</strong>. Select a recording whose rights cover your use. Announcements are added only from explicit announcement content.</p>
      {source.lessonPlan?.segments?.some(s => s.question) && <details><summary>Lesson discussion prompts to adapt</summary>{source.lessonPlan.segments.filter(s => s.question).map((s,i) => <p key={i}>{s.question}<br/><small>Teacher guide: {s.answer} · {s.passage}</small></p>)}<p>Use Add question to supply and review multiple-choice answers.</p></details>}
      {source.lessonPlan?.media && <p>Lesson media notes: {source.lessonPlan.media}</p>}</details>
      <div className={styles.actions}><PresentationImageLibrary images={images} selectedId={plan.backgroundId} label="Choose background image" onSelect={image => change({backgroundId:image.id})} />{background && <button onClick={() => change({backgroundId:undefined})}>Use plain background</button>}</div>
      <ol className={styles.sequence}>{plan.items.map((item, i) => <li key={item.id}><button className={selected === i ? styles.active : ''} onClick={() => { setSelected(i); setEditing(true); reset(); }}>{i + 1}. {item.title || item.kind}<small>{item.seconds}s{item.kind === 'question' ? ` + ${item.revealSeconds}s answer` : ''}</small></button></li>)}</ol>
      <details><summary>Add a slide</summary><div className={styles.actions}>{(['question','verse','context','phone','announcement','prayer'] as const).map(kind => <button key={kind} disabled={plan.items.length >= 40} onClick={() => { change({ items: [...plan.items, newItem(kind, kind === 'phone' ? 'Please silence your phone' : `New ${kind}`)] }); setSelected(plan.items.length); setEditing(true); reset(); }}>Add {kind}</button>)}</div></details>
      {current && <details className={styles.card} open={editing} onToggle={e=>setEditing(e.currentTarget.open)}><summary>Edit selected slide</summary><div>
        <label>Slide title<input maxLength={100} value={current.title} onChange={e => edit({ title: e.target.value })} /></label>
        <label>{current.kind === 'question' ? 'Question / verse completion' : 'Slide text'}<textarea maxLength={600} rows={4} value={current.body} onChange={e => edit({ body: e.target.value })} /></label>
        <label>Scripture reference<input value={current.reference} onChange={e => edit({ reference: e.target.value })} placeholder="2 Corinthians 2:8" /></label>
        {current.kind === 'verse' && <button onClick={() => {
          const text = resolveScripture(current.reference); const lines = text.split('\n');
          if (lines.length !== 1 || !/^.+ \d+:\d+$/.test(current.reference.trim()) || !text.startsWith(current.reference.trim() + ' ')) { setMessage('Use one exact verse reference, such as 2 Corinthians 2:8.'); return; }
          edit({ body: text.slice(current.reference.trim().length + 1), reference: current.reference.trim() });
        }}>Load KJV verse</button>}
        {current.kind === 'question' && <>{current.choices.map((choice,i) => <label key={i}>Choice {String.fromCharCode(65+i)}<input maxLength={100} value={choice} onChange={e => edit({ choices: current.choices.map((c,j) => i === j ? e.target.value : c) })} /></label>)}<label>Correct answer<select value={current.answer} onChange={e => edit({ answer: Number(e.target.value) })}>{current.choices.map((_,i) => <option key={i} value={i}>{String.fromCharCode(65+i)}</option>)}</select></label><label>Answer explanation<textarea maxLength={600} value={current.explanation} onChange={e => edit({ explanation: e.target.value })} /></label><label>Answer reveal seconds<input type="number" min={5} max={120} value={current.revealSeconds} onChange={e => edit({ revealSeconds: Number(e.target.value) })} /></label></>}
        <label>Slide seconds<input type="number" min={5} max={120} value={current.seconds} onChange={e => edit({ seconds: Number(e.target.value) })} /></label>
        <div className={styles.actions}><button disabled={selected === 0} onClick={() => { const items = [...plan.items]; [items[selected-1],items[selected]]=[items[selected],items[selected-1]]; change({ items }); setSelected(selected-1); }}>Move up</button><button disabled={selected === plan.items.length-1} onClick={() => { const items=[...plan.items]; [items[selected+1],items[selected]]=[items[selected],items[selected+1]]; change({items}); setSelected(selected+1); }}>Move down</button><button disabled={plan.items.length === 1} onClick={() => { change({ items: plan.items.filter((_,i) => i !== selected) }); setSelected(Math.max(0,selected-1)); }}>Remove slide</button></div>
      </div></details>}
      <h2>2. Confirm it is ready</h2><label><input type="checkbox" checked={plan.reviewed} onChange={e => { setPlan({ ...plan, reviewed: e.target.checked }); setDirty(true); }} /> I reviewed the answers, KJV wording, doctrine, announcements, and permission to display this content.</label>
      </fieldset>
      <div className={styles.actions}><button onClick={save}>Save countdown</button><button onClick={download}>Export backup</button><label className={styles.file}>Import backup<input type="file" accept="application/json,.json" disabled={running} onChange={async e => { const f=e.target.files?.[0]; if(!f)return; try { if(f.size>200000)throw new Error('File is too large.'); const p=JSON.parse(await f.text()); const problems=validatePlan(p); if(problems.length)throw new Error(problems.join(' ')); change({ ...p, projectId: lesson.id, reviewed: false }); setSelected(0); reset(); }catch(error){setMessage(error instanceof Error ? error.message : 'Import failed.');} e.target.value=''; }} /></label></div>
      <details><summary>Reusable templates</summary><p>Templates contain pacing, slides, and text; review announcements and content for each class. Music files and approvals are not carried over.</p><label>Template name<input value={templateName} onChange={e => setTemplateName(e.target.value)} /></label><button disabled={!templateName.trim() || errors.length > 0} onClick={() => { try { const next=[...templates.filter(t => t.title!==templateName.trim()),{...plan,title:templateName.trim(),reviewed:false}];localStorage.setItem(templateKey,JSON.stringify(next));setTemplates(next);setMessage('Template saved.');}catch{setMessage('Template could not be saved. Export a backup.');} }}>Save template</button>{templates.map(t => <button disabled={running} key={t.title} onClick={() => { change({...t, projectId:lesson.id, reviewed:false});setSelected(0);reset(); }}>Use {t.title}</button>)}</details>
      {dirty && <button onClick={() => { stop(); onClose(); }}>Close without saving</button>}
    </section><section className={styles.preview}><h2>3. Preview & present</h2>
      <div ref={stage} className={`${styles.stage} ${presenting ? styles.presenting : ''}`} aria-label="Audience preview" style={background ? {backgroundImage:`linear-gradient(rgba(7,22,15,.78),rgba(7,22,15,.82)), url("${background.url}")`,backgroundSize:"cover",backgroundPosition:"center"} : undefined} onDoubleClick={() => { if(presenting){stop();setPresenting(false);if(document.fullscreenElement)void document.exitFullscreen();} }}>
        {blank && presenting ? <div className={styles.blackout} /> : <><div className={styles.stageTop}><span>{frame.complete ? 'WELCOME' : reveal ? 'ANSWER' : displayItem?.kind.toUpperCase()}</span><div><small>CLASS BEGINS IN</small><strong role="timer">{clockText(frame.remaining)}</strong></div></div>
        <div ref={slide} key={`${displayItem?.id}-${reveal}-${frame.complete}`} className={styles.slide}>
        <h2>{frame.complete ? 'Let us begin' : reveal ? displayItem?.choices[displayItem.answer] : displayItem?.title}</h2>
        <p>{frame.complete ? plan.title : reveal ? displayItem?.explanation : displayItem?.body}</p>
        {!frame.complete && displayItem?.kind === 'question' && !reveal && <ul>{displayItem.choices.map((choice,i) => <li key={i}><span>{String.fromCharCode(65+i)}</span>{choice}</li>)}</ul>}
        {!frame.complete && displayItem?.reference && <footer>{displayItem.reference}{displayItem.kind === 'verse' ? ' · KJV' : ''}</footer>}
        </div><div className={styles.progress}><div style={{width:`${100 * (1-frame.remaining/(plan.minutes*60))}%`}} /></div></>}
      </div>
      <p>{clockText(timeline(plan).at(-1)?.end || 0)} per sequence · repeats until {plan.minutes}:00 · stops at zero and fades music over the final four seconds.</p>
      <div className={styles.actions}><button disabled={running || !!errors.length || !plan.reviewed || !musicReady} onClick={play}>{elapsed && !frame.complete ? 'Resume' : 'Start preview'}</button><button onClick={stop} disabled={!running}>Pause</button><button onClick={reset}>Reset</button><button disabled={!!errors.length || !plan.reviewed || !musicReady} onClick={() => {setPresenting(true);setBlank(false);void stage.current?.requestFullscreen?.().catch(() => setMessage('Browser fullscreen unavailable. The display fills this tab; use the browser fullscreen command.'));if(!running)play();}}>Present fullscreen</button></div>
      <details><summary>Keyboard controls & projector help</summary><p>Fullscreen: B blanks the display; Space pauses; Esc exits and pauses. Double-click exits the display. Move this browser to the projector first.</p></details>
      <details className={styles.card}><summary>Background music (optional)</summary><h2>Choose a hymn recording</h2><label>Local recording<input disabled={running} type="file" accept="audio/*" onChange={e => { const file=e.target.files?.[0];if(!file)return;setAudioUrl(URL.createObjectURL(file));setAudioName(file.name);setRights(false);setRightsNote(''); }} /></label>{audioName && <p>{audioName} <button disabled={running} onClick={() => {setAudioUrl('');setAudioName('');setRights(false);}}>Remove music</button></p>}
      <label>Recording source, license, and required attribution<textarea disabled={running} value={rightsNote} onChange={e => setRightsNote(e.target.value)} placeholder="Record permission for this recording and intended church use. Hymn text rights alone do not cover a recording." /></label><label><input type="checkbox" disabled={running} checked={rights} onChange={e => setRights(e.target.checked)} /> I confirmed recording rights and handled any required attribution.</label><label>Music volume<input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => {setVolume(Number(e.target.value));if(audio.current)audio.current.volume=Number(e.target.value);}} /></label>
      <audio ref={audio} src={audioUrl || undefined} loop onError={() => {stop();setMessage('Audio could not be decoded. Choose another recording or remove music.');}} />
      </details>
      {!!errors.length && <div className={styles.notice}><strong>Before presenting</strong><ul>{errors.map((e,i) => <li key={i}>{e}</li>)}</ul></div>}
      <p role="status" className={styles.notice}>{message || (!plan.reviewed ? 'Review the suggested content before starting.' : !musicReady ? 'Confirm recording rights before starting music.' : 'Ready for preview.')}</p>
    </section></div>
  </div>;
}
