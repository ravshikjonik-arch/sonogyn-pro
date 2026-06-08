import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import type { CommentRecord } from "../../features/case/types";
import { requireFirestore } from "./firebase";

function db() {
  return requireFirestore();
}

const COMMENTS_COLLECTION = "comments";

export async function addComment(input: {
  caseId: string;
  userId: string;
  text: string;
}): Promise<CommentRecord> {
  const createdAt = Date.now();
  const ref = await addDoc(collection(db(), COMMENTS_COLLECTION), {
    caseId: input.caseId,
    userId: input.userId,
    text: input.text.trim(),
    createdAt,
  });
  return {
    id: ref.id,
    caseId: input.caseId,
    userId: input.userId,
    text: input.text.trim(),
    createdAt,
  };
}

export async function getComments(caseId: string): Promise<CommentRecord[]> {
  const q = query(
    collection(db(), COMMENTS_COLLECTION),
    where("caseId", "==", caseId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data() as {
      caseId: string;
      userId: string;
      text: string;
      createdAt: number;
    };
    return {
      id: doc.id,
      caseId: data.caseId,
      userId: data.userId || "",
      text: data.text || "",
      createdAt: data.createdAt || 0,
    };
  });
}
