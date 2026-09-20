import type { LedgerState } from "@/lib/types";

const DB_NAME = "ledger-offline";
const DB_VERSION = 1;
const SNAPSHOT = "snapshots";
const QUEUE = "queue";
const LS_SNAP = "ledger.offline.snapshot.v1.";
const LS_QUEUE = "ledger.offline.queue.v1.";

export type QueueKind = "save" | "wipe";

export type QueueOp = {
  id: number;
  userId: string;
  kind: QueueKind;
  state: LedgerState | null;
  createdAt: string;
};

export type SnapshotRow = {
  userId: string;
  state: LedgerState;
  updatedAt: string;
};

let memoryId = 1;
let useMemory = false;
const memSnaps = new Map<string, SnapshotRow>();
const memQueue: QueueOp[] = [];

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("no indexedDB"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SNAPSHOT)) {
        db.createObjectStore(SNAPSHOT, { keyPath: "userId" });
      }
      if (!db.objectStoreNames.contains(QUEUE)) {
        const store = db.createObjectStore(QUEUE, { keyPath: "id", autoIncrement: true });
        store.createIndex("userId", "userId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  if (useMemory) return fn(null as unknown as IDBDatabase);
  try {
    const db = await openDb();
    try {
      return await fn(db);
    } finally {
      db.close();
    }
  } catch {
    useMemory = true;
    return fn(null as unknown as IDBDatabase);
  }
}

function lsRead<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsWrite(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getSnapshot(userId: string): Promise<LedgerState | null> {
  return withDb(async (db) => {
    if (!db) {
      const row = memSnaps.get(userId) ?? lsRead<SnapshotRow | null>(LS_SNAP + userId, null);
      return row?.state ?? null;
    }
    const tx = db.transaction(SNAPSHOT, "readonly");
    const row = await requestToPromise(tx.objectStore(SNAPSHOT).get(userId) as IDBRequest<SnapshotRow | undefined>);
    return row?.state ?? null;
  });
}

export async function putSnapshot(userId: string, state: LedgerState): Promise<void> {
  const row: SnapshotRow = { userId, state, updatedAt: new Date().toISOString() };
  await withDb(async (db) => {
    if (!db) {
      memSnaps.set(userId, row);
      lsWrite(LS_SNAP + userId, row);
      return;
    }
    const tx = db.transaction(SNAPSHOT, "readwrite");
    tx.objectStore(SNAPSHOT).put(row);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function clearSnapshot(userId: string): Promise<void> {
  await withDb(async (db) => {
    if (!db) {
      memSnaps.delete(userId);
      if (typeof localStorage !== "undefined") localStorage.removeItem(LS_SNAP + userId);
      return;
    }
    const tx = db.transaction(SNAPSHOT, "readwrite");
    tx.objectStore(SNAPSHOT).delete(userId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function listQueue(userId: string): Promise<QueueOp[]> {
  return withDb(async (db) => {
    if (!db) {
      const fromLs = lsRead<QueueOp[]>(LS_QUEUE + userId, []);
      const fromMem = memQueue.filter((op) => op.userId === userId);
      return (fromMem.length ? fromMem : fromLs).sort((a, b) => a.id - b.id);
    }
    const tx = db.transaction(QUEUE, "readonly");
    const index = tx.objectStore(QUEUE).index("userId");
    const rows = await requestToPromise(index.getAll(userId) as IDBRequest<QueueOp[]>);
    return (rows ?? []).sort((a, b) => a.id - b.id);
  });
}

async function writeQueueOp(userId: string, kind: QueueKind, state: LedgerState | null): Promise<void> {
  await withDb(async (db) => {
    const op: Omit<QueueOp, "id"> & { id?: number } = {
      userId,
      kind,
      state,
      createdAt: new Date().toISOString(),
    };
    if (!db) {
      const next: QueueOp = { ...op, id: memoryId++ };
      memQueue.push(next);
      lsWrite(
        LS_QUEUE + userId,
        memQueue.filter((item) => item.userId === userId),
      );
      return;
    }
    const tx = db.transaction(QUEUE, "readwrite");
    tx.objectStore(QUEUE).add(op);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function enqueueOp(userId: string, kind: QueueKind, state: LedgerState | null): Promise<void> {
  if (kind === "save") {
    const existing = await listQueue(userId);
    await Promise.all(
      existing.filter((op) => op.kind === "save").map((op) => removeQueueOp(userId, op.id)),
    );
  }
  await writeQueueOp(userId, kind, state);
}

export async function removeQueueOp(userId: string, id: number): Promise<void> {
  await withDb(async (db) => {
    if (!db) {
      const idx = memQueue.findIndex((item) => item.id === id);
      if (idx >= 0) memQueue.splice(idx, 1);
      lsWrite(
        LS_QUEUE + userId,
        memQueue.filter((item) => item.userId === userId),
      );
      return;
    }
    const tx = db.transaction(QUEUE, "readwrite");
    tx.objectStore(QUEUE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function queueLength(userId: string): Promise<number> {
  return (await listQueue(userId)).length;
}
