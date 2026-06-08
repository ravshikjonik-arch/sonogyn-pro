import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import seedData from "./data/nosologies.seed.json";
import { searchNosologies } from "./search";
import type { Nosology, NosologySearchHit, NosologyStoreMeta } from "./types";

const DB_NAME = "clinical-nosology-v1";
const STORE = "nosologies";
const META_STORE = "meta";
const SEED_VERSION = "2026-05-20-v1";

interface NosologyDB extends DBSchema {
  nosologies: {
    key: string;
    value: Nosology;
  };
  meta: {
    key: string;
    value: NosologyStoreMeta;
  };
}

let dbPromise: Promise<IDBPDatabase<NosologyDB>> | null = null;
let initPromise: Promise<void> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function getDb(): Promise<IDBPDatabase<NosologyDB>> {
  if (!isBrowser()) {
    return Promise.reject(new Error("nosologyStore доступен только в браузере"));
  }
  if (!dbPromise) {
    dbPromise = openDB<NosologyDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      },
    });
  }
  return dbPromise;
}

function validateNosology(raw: unknown): Nosology {
  const n = raw as Nosology;
  if (!n?.id || !n?.title || !n?.zone) {
    throw new Error("Некорректная нозология: отсутствуют id, title или zone");
  }
  return {
    ...n,
    keywords: n.keywords ?? [],
    examinationScheme: n.examinationScheme ?? {},
    diagnostics: n.diagnostics ?? {},
    treatment: n.treatment ?? {},
    guidelines: n.guidelines ?? {},
    diagnosisLine: n.diagnosisLine ?? n.title,
    protocolTemplate: n.protocolTemplate ?? n.description,
    updatedAt: n.updatedAt ?? new Date().toISOString(),
  };
}

async function seedNosologyStoreIfNeeded(): Promise<void> {
  const db = await getDb();
  const meta = (await db.get(META_STORE, "main")) as NosologyStoreMeta | undefined;
  const count = await db.count(STORE);

  if (meta?.seedVersion === SEED_VERSION && count > 0) {
    return;
  }

  const tx = db.transaction([STORE, META_STORE], "readwrite");
  const nosStore = tx.objectStore(STORE);
  await nosStore.clear();
  const seed = (seedData as Nosology[]).map(validateNosology);
  await Promise.all(seed.map((n) => nosStore.put(n)));
  await tx.objectStore(META_STORE).put(
    { seedVersion: SEED_VERSION, lastImportAt: new Date().toISOString() },
    "main",
  );
  await tx.done;
}

/** Первичная загрузка из JSON, если БД пуста или сменилась версия сида */
export async function initNosologyStore(): Promise<void> {
  if (!initPromise) {
    initPromise = seedNosologyStoreIfNeeded().catch((e) => {
      initPromise = null;
      throw e;
    });
  }
  return initPromise;
}

export async function getAllNosologies(): Promise<Nosology[]> {
  await initNosologyStore();
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

export async function getNosologyById(id: string): Promise<Nosology | null> {
  await initNosologyStore();
  const db = await getDb();
  return (await db.get(STORE, id)) ?? null;
}

export async function upsertNosology(nosology: Nosology): Promise<Nosology> {
  const n = validateNosology({ ...nosology, updatedAt: new Date().toISOString() });
  const db = await getDb();
  await db.put(STORE, n);
  return n;
}

export async function deleteNosology(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function searchNosologyStore(query: string): Promise<NosologySearchHit[]> {
  const all = await getAllNosologies();
  return searchNosologies(all, query);
}

export async function exportNosologiesJson(): Promise<string> {
  const all = await getAllNosologies();
  return JSON.stringify(all, null, 2);
}

export async function importNosologiesJson(json: string): Promise<number> {
  const parsed = JSON.parse(json) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("JSON должен быть массивом нозологий");
  }
  const db = await getDb();
  const tx = db.transaction([STORE, META_STORE], "readwrite");
  const nosStore = tx.objectStore(STORE);
  for (const raw of parsed) {
    await nosStore.put(validateNosology(raw));
  }
  const meta = (await db.get(META_STORE, "main")) as NosologyStoreMeta | undefined;
  await tx.objectStore(META_STORE).put(
    {
      seedVersion: meta?.seedVersion ?? SEED_VERSION,
      lastImportAt: new Date().toISOString(),
    },
    "main",
  );
  await tx.done;
  return parsed.length;
}

/** In-memory fallback for SSR/tests */
export function getSeedNosologies(): Nosology[] {
  return (seedData as Nosology[]).map(validateNosology);
}

// ——— localStorage: заметки, избранное, история ———

const RECENT_KEY = "nosology:recent";
const FAVORITES_KEY = "nosology:favorites";
const NOTES_PREFIX = "nosology:notes:";
const MAX_RECENT = 12;

function readJsonArray(key: string): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, ids: string[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(ids));
}

export function getRecentNosologyIds(): string[] {
  return readJsonArray(RECENT_KEY);
}

export function pushRecentNosology(id: string): void {
  const prev = getRecentNosologyIds().filter((x) => x !== id);
  writeJsonArray(RECENT_KEY, [id, ...prev].slice(0, MAX_RECENT));
}

export function getFavoriteNosologyIds(): string[] {
  return readJsonArray(FAVORITES_KEY);
}

export function toggleFavoriteNosology(id: string): boolean {
  const fav = getFavoriteNosologyIds();
  const has = fav.includes(id);
  const next = has ? fav.filter((x) => x !== id) : [...fav, id];
  writeJsonArray(FAVORITES_KEY, next);
  return !has;
}

export function isFavoriteNosology(id: string): boolean {
  return getFavoriteNosologyIds().includes(id);
}

export function getNosologyNotes(id: string): string {
  if (!isBrowser()) return "";
  return localStorage.getItem(`${NOTES_PREFIX}${id}`) ?? "";
}

export function saveNosologyNotes(id: string, text: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(`${NOTES_PREFIX}${id}`, text);
}
