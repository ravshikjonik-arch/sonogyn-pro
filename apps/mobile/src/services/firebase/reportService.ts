import { addDoc, collection, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { requireFirestore } from "./firebase";

export type ReportTargetType = "case" | "comment";
export type ReportReason = "spam" | "abuse" | "other";

export const bannedWords = ["мат1", "мат2", "оскорбление"];

export function containsBadWords(text: string): boolean {
  const normalized = text.toLowerCase();
  return bannedWords.some((w) => normalized.includes(w.toLowerCase()));
}

function db() {
  return requireFirestore();
}

export async function reportContent(input: {
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason;
  userId: string;
}) {
  const createdAt = Date.now();
  const ref = await addDoc(collection(db(), "reports"), {
    targetId: input.targetId,
    targetType: input.targetType,
    reason: input.reason,
    reportedBy: input.userId,
    createdAt,
  });
  return {
    id: ref.id,
    ...input,
    createdAt,
  };
}

export async function banUser(userId: string) {
  await setDoc(
    doc(db(), "users", userId),
    {
      isBanned: true,
    },
    { merge: true }
  );
}

export async function deleteCase(caseId: string) {
  await deleteDoc(doc(db(), "cases", caseId));
}

export async function deleteComment(commentId: string) {
  await deleteDoc(doc(db(), "comments", commentId));
}

export async function isUserBanned(userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db(), "users", userId));
  if (!snap.exists()) return false;
  const data = snap.data() as { isBanned?: boolean };
  return !!data.isBanned;
}
