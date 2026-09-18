import { archiveKey, emptyArchive, mergeArchives, parseArchive, type ArchiveSource, type TeachingArchive } from './teaching-archive';
export function readArchive<T extends ArchiveSource>(scope: string): TeachingArchive<T> {
  const raw = localStorage.getItem(archiveKey(scope));
  return raw ? parseArchive<T>(JSON.parse(raw)) : emptyArchive<T>();
}
/** Re-read before append so an open tab cannot replace records written by another tab. */
export async function appendArchive<T extends ArchiveSource>(scope: string, additions: TeachingArchive<T>): Promise<TeachingArchive<T>> {
  const write = () => {
    const current = readArchive<T>(scope);
    for (const event of additions.events) {
      if (current.events.some(e => e.id !== event.id && e.snapshot.id === event.snapshot.id && e.delivery.date === event.delivery.date && e.delivery.location === event.delivery.location))
        throw new Error('This draft is already logged at this location on this date. Create a revised copy for a separate occasion.');
    }
    const merged = mergeArchives(current, parseArchive<T>(additions));
    localStorage.setItem(archiveKey(scope), JSON.stringify(merged));
    return merged;
  };
  if (!navigator.locks) throw new Error('This browser cannot safely save the archive. Use a current browser with Web Locks support.');
  return navigator.locks.request(archiveKey(scope), write);
}
