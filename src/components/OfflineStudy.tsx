'use client';
import { useEffect, useState } from 'react';
async function isReady(worker: ServiceWorker, repair = false) {
  return new Promise<boolean>((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); resolve(false); }, repair ? 180000 : 8000);
    channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data?.ready === true); };
    worker.postMessage({ type: repair ? 'OFFLINE_REPAIR' : 'OFFLINE_STATUS' }, [channel.port2]);
  });
}
export default function OfflineStudy() {
  const [message, setMessage] = useState('Download while online before studying without a connection.');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.getRegistration('/').then(async registration => {
      if (registration?.active && await isReady(registration.active)) setMessage('Offline copy ready: KJV reading and local lesson preparation.');
    }).catch(() => {});
  }, []);
  async function download() {
    setBusy(true);
    setMessage('Downloading the app and KJV Bible. Keep this page open until ready.');
    try {
      if (!('serviceWorker' in navigator)) throw new Error('unsupported');
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      await registration.update();
      const worker = registration.installing;
      if (worker) await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 180000);
        const check = () => {
          if (worker.state === 'installed' || worker.state === 'activated') { clearTimeout(timer); resolve(); }
          if (worker.state === 'redundant') { clearTimeout(timer); reject(new Error('download failed')); }
        };
        worker.addEventListener('statechange', check); check();
      });
      if (registration.waiting) {
        setMessage('Update downloaded. Close all app tabs and reopen to use it.');
      } else {
        const ready = await navigator.serviceWorker.ready;
        if (!ready.active) throw new Error('incomplete');
        if (!await isReady(ready.active) && !await isReady(ready.active, true)) throw new Error('incomplete');
        setMessage('Offline copy ready: KJV reading and local lesson preparation.');
      }
    } catch {
      setMessage('Offline download could not finish. Reconnect and retry; check available device storage.');
    } finally { setBusy(false); }
  }
  return <details className="mx-auto w-full max-w-7xl px-4 py-2 text-sm">
    <summary className="cursor-pointer py-2 font-semibold">Install app & offline study</summary>
    <p className="my-2">On iPhone or iPad, open this site in Safari, tap Share, then Add to Home Screen.</p>
    <p className="my-2">The download includes KJV Scripture, lesson templates, and the app. Cloud sync, remote control, library books, audio, and online reference lookups need a connection. Local notes remain on this device; export a backup before clearing browser data.</p>
    <button type="button" disabled={busy} onClick={download} className="min-h-11 rounded-xl border px-4 py-2 disabled:opacity-50">{busy ? 'Downloading…' : 'Download for offline study'}</button>
    <p role="status" className="my-2">{message}</p>
  </details>;
}
