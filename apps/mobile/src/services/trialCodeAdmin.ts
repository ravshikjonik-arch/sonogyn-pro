import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { requireFirestore } from "./firebase/firebase";
import { trialConfig } from "../config/trial";

function randomPart(len: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function buildCode(prefix = "DOC"): string {
  return `${prefix}-${randomPart(4)}-${randomPart(4)}`;
}

export async function createOneTimeTrialCodes(params: {
  count: number;
  days: number;
  prefix?: string;
}): Promise<string[]> {
  const { count, days, prefix } = params;
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const code = buildCode(prefix);
    await setDoc(doc(requireFirestore(), trialConfig.firebaseCollection, code), {
      active: true,
      days,
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
      kind: "pilot_colleague",
    });
    out.push(code);
  }
  return out;
}
