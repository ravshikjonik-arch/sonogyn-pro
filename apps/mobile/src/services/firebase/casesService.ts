import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import type { CaseRecord, OrganType, OradsSnapshot } from "../../features/case/types";
import { requireFirestore, requireStorage } from "./firebase";

function db() {
  return requireFirestore();
}

function st() {
  return requireStorage();
}

const CASES_COLLECTION = "cases";

type CreateCaseInput = {
  userId: string;
  organ: OrganType;
  description: string;
  result?: string;
  imageUri?: string;
  oradsSnapshot?: OradsSnapshot;
};

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((v) => stripUndefinedDeep(v))
      .filter((v) => v !== undefined) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      if (v === undefined) return;
      out[k] = stripUndefinedDeep(v);
    });
    return out as T;
  }
  return value;
}

async function uploadCaseImage(imageUri: string, caseId: string): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const fileRef = ref(st(), `cases/${caseId}/${Date.now()}.jpg`);
  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(fileRef);
}

export async function createCase(input: CreateCaseInput): Promise<CaseRecord> {
  const cleanSnapshot = input.oradsSnapshot ? stripUndefinedDeep(input.oradsSnapshot) : undefined;
  const baseRef = await addDoc(collection(db(), CASES_COLLECTION), {
    userId: input.userId,
    organ: input.organ,
    description: input.description.trim(),
    result: input.result || "",
    oradsSnapshot: cleanSnapshot || null,
    imageUrl: "",
    createdAt: serverTimestamp(),
  });

  let imageUrl = "";
  if (input.imageUri) {
    try {
      imageUrl = await uploadCaseImage(input.imageUri, baseRef.id);
      await updateDoc(baseRef, { imageUrl });
    } catch (error) {
      // Keep case creation resilient even if Storage is unavailable.
      // User still gets a published case without image.
      console.warn(
        "[createCase] Image upload skipped:",
        error instanceof Error ? error.message : "unknown error"
      );
    }
  }

  return {
    id: baseRef.id,
    userId: input.userId,
    organ: input.organ,
    description: input.description.trim(),
    result: input.result || "",
    oradsSnapshot: cleanSnapshot,
    imageUrl,
    createdAt: Date.now(),
  };
}

export async function getCases(): Promise<CaseRecord[]> {
  const q = query(
    collection(db(), CASES_COLLECTION),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data() as {
      userId: string;
      organ: OrganType;
      description: string;
      result?: string;
      oradsSnapshot?: OradsSnapshot | null;
      imageUrl?: string;
      createdAt?: { toMillis?: () => number } | number;
    };
    const createdAt =
      typeof data.createdAt === "number"
        ? data.createdAt
        : data.createdAt && "toMillis" in data.createdAt && data.createdAt.toMillis
          ? data.createdAt.toMillis()
          : 0;

    return {
      id: doc.id,
      userId: data.userId || "",
      organ: data.organ,
      description: data.description || "",
      imageUrl: data.imageUrl || "",
      result: data.result || "",
      oradsSnapshot: data.oradsSnapshot || undefined,
      createdAt,
    };
  });
}

export async function getCaseById(caseId: string): Promise<CaseRecord | null> {
  const snap = await getDoc(doc(db(), CASES_COLLECTION, caseId));
  if (!snap.exists()) return null;
  const data = snap.data() as {
    userId: string;
    organ: OrganType;
    description: string;
    result?: string;
    oradsSnapshot?: OradsSnapshot | null;
    imageUrl?: string;
    createdAt?: { toMillis?: () => number } | number;
  };
  const createdAt =
    typeof data.createdAt === "number"
      ? data.createdAt
      : data.createdAt && "toMillis" in data.createdAt && data.createdAt.toMillis
        ? data.createdAt.toMillis()
        : 0;

  return {
    id: snap.id,
    userId: data.userId || "",
    organ: data.organ,
    description: data.description || "",
    imageUrl: data.imageUrl || "",
    result: data.result || "",
    oradsSnapshot: data.oradsSnapshot || undefined,
    createdAt,
  };
}

export async function getCommentCountsByCaseIds(
  caseIds: string[]
): Promise<Record<string, number>> {
  if (caseIds.length === 0) return {};
  const chunks: string[][] = [];
  for (let i = 0; i < caseIds.length; i += 10) {
    chunks.push(caseIds.slice(i, i + 10));
  }
  const out: Record<string, number> = {};
  await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(
        collection(db(), "comments"),
        where("caseId", "in", chunk)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const data = d.data() as { caseId: string };
        out[data.caseId] = (out[data.caseId] || 0) + 1;
      });
    })
  );
  return out;
}
