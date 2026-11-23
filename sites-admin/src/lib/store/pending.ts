import { openDB, IDBPDatabase } from 'idb';
import { FileChange } from './types';

const DB_NAME = 'sites_admin_pending_drafts';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    },
  });
}

export async function setPendingChange(
  path: string,
  content: string,
  originalSha?: string
): Promise<void> {
  const db = await getDB();
  const change: FileChange = {
    path,
    content,
    originalSha,
  };
  await db.put(STORE_NAME, change);
}

export async function getPendingChange(path: string): Promise<FileChange | null> {
  const db = await getDB();
  const res = (await db.get(STORE_NAME, path)) as FileChange | undefined;
  return res || null;
}

export async function getAllPendingChanges(): Promise<FileChange[]> {
  const db = await getDB();
  return (await db.getAll(STORE_NAME)) as FileChange[];
}

export async function removePendingChange(path: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, path);
}

export async function clearAllPendingChanges(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

/**
 * Returns a list of unique site slugs that have at least one pending file change.
 */
export async function getSitesWithPendingChanges(): Promise<string[]> {
  const changes = await getAllPendingChanges();
  const slugs = new Set<string>();
  for (const c of changes) {
    const parts = c.path.split('/');
    if (parts.length >= 2 && !c.path.startsWith('_shared/')) {
      slugs.add(parts[0]);
    }
  }
  return Array.from(slugs);
}

