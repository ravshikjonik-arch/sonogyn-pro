const DB_NAME = "sonogyn-messenger-v1";
const DB_VERSION = 1;
const OUTBOX = "outbox";
const CACHE = "message_cache";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("idb open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OUTBOX)) {
        const store = db.createObjectStore(OUTBOX, { keyPath: "clientUuid" });
        store.createIndex("chatId", "chatId", { unique: false });
      }
      if (!db.objectStoreNames.contains(CACHE)) {
        db.createObjectStore(CACHE, { keyPath: "chatId" });
      }
    };
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = fn(store);
        request.onerror = () => reject(request.error ?? new Error("idb request failed"));
        request.onsuccess = () => resolve(request.result as T);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(transaction.error ?? new Error("idb tx failed"));
      }),
  );
}

export async function outboxPut(entry: Record<string, unknown>): Promise<void> {
  await tx(OUTBOX, "readwrite", (s) => s.put(entry));
}

export async function outboxDelete(clientUuid: string): Promise<void> {
  await tx(OUTBOX, "readwrite", (s) => s.delete(clientUuid));
}

export async function outboxListByChat(chatId: string): Promise<Record<string, unknown>[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OUTBOX, "readonly");
    const store = transaction.objectStore(OUTBOX);
    const index = store.index("chatId");
    const request = index.getAll(chatId);
    request.onerror = () => reject(request.error ?? new Error("idb list failed"));
    request.onsuccess = () => {
      resolve((request.result as Record<string, unknown>[]) ?? []);
      db.close();
    };
  });
}

export async function outboxListAll(): Promise<Record<string, unknown>[]> {
  return tx(OUTBOX, "readonly", (s) => s.getAll());
}

export async function messageCacheGet(chatId: string): Promise<Record<string, unknown> | undefined> {
  const row = await tx<Record<string, unknown> | undefined>(CACHE, "readonly", (s) => s.get(chatId));
  return row;
}

export async function messageCacheSet(row: Record<string, unknown>): Promise<void> {
  await tx(CACHE, "readwrite", (s) => s.put(row));
}
