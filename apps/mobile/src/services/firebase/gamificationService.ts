import {
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
  collection,
} from "firebase/firestore";
import type { UserProfile } from "../../features/case/types";
import { requireFirestore } from "./firebase";

function db() {
  return requireFirestore();
}

const USERS_COLLECTION = "users";
export const POINTS = {
  createCase: 10,
  addComment: 3,
  likeCase: 1,
  receiveLike: 2,
} as const;

export function calculateLevel(points: number): number {
  if (points >= 600) return 5;
  if (points >= 300) return 4;
  if (points >= 150) return 3;
  if (points >= 50) return 2;
  return 1;
}

export function starsByLevel(level: number): string {
  return "⭐".repeat(Math.max(1, Math.min(level, 5)));
}

function defaultName(userId: string): string {
  return `Доктор ${userId.slice(0, 6)}`;
}

export async function getOrCreateUserProfile(userId: string): Promise<UserProfile> {
  const ref = doc(db(), USERS_COLLECTION, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data() as Partial<UserProfile>;
    return {
      id: userId,
      points: data.points ?? 0,
      level: data.level ?? 1,
      name: data.name ?? defaultName(userId),
      isBanned: data.isBanned ?? false,
    };
  }

  const created: UserProfile = {
    id: userId,
    points: 0,
    level: 1,
    name: defaultName(userId),
    isBanned: false,
  };
  await setDoc(ref, created, { merge: true });
  return created;
}

export async function addPoints(userId: string, amount: number) {
  const ref = doc(db(), USERS_COLLECTION, userId);
  return runTransaction(db(), async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists() ? (snap.data() as Partial<UserProfile>) : null;
    const prevPoints = prev?.points ?? 0;
    const prevLevel = prev?.level ?? calculateLevel(prevPoints);

    const points = Math.max(0, prevPoints + amount);
    const level = calculateLevel(points);
    const profile: UserProfile = {
      id: userId,
      points,
      level,
      name: prev?.name ?? defaultName(userId),
      isBanned: prev?.isBanned ?? false,
    };
    tx.set(ref, profile, { merge: true });
    return {
      profile,
      levelUp: level > prevLevel,
      previousLevel: prevLevel,
      newLevel: level,
    };
  });
}

export async function getUsersByIds(userIds: string[]): Promise<Record<string, UserProfile>> {
  const uniq = Array.from(new Set(userIds.filter(Boolean)));
  if (uniq.length === 0) return {};

  const chunks: string[][] = [];
  for (let i = 0; i < uniq.length; i += 10) chunks.push(uniq.slice(i, i + 10));

  const out: Record<string, UserProfile> = {};
  await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(
        collection(db(), USERS_COLLECTION),
        where(documentId(), "in", chunk)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const data = d.data() as Partial<UserProfile>;
        out[d.id] = {
          id: d.id,
          points: data.points ?? 0,
          level: data.level ?? 1,
          name: data.name ?? defaultName(d.id),
          isBanned: data.isBanned ?? false,
        };
      });
    })
  );
  return out;
}

export async function awardCaseLike(likerUserId: string, authorUserId: string) {
  const [liker, author] = await Promise.all([
    addPoints(likerUserId, POINTS.likeCase),
    addPoints(authorUserId, POINTS.receiveLike),
  ]);
  return { liker, author };
}
