import fs from "fs";
import path from "path";

const CANDIDATES = [
  path.join(process.cwd(), "docs/fmf/FMF_11-13_DIGEST.md"),
  path.join(process.cwd(), "../../docs/fmf/FMF_11-13_DIGEST.md"),
];

/** Load digest for obstetric RAG (server-only). */
export function loadFmf1113Digest(): string {
  for (const file of CANDIDATES) {
    try {
      return fs.readFileSync(file, "utf8");
    } catch {
      /* try next */
    }
  }
  return "";
}

export function shouldAttachFmfDigest(text: string): boolean {
  const t = text.toLowerCase();
  return /fmf|11\s*[-–]?\s*13|твп|nt\b|толщин.*воротник|crl\s*45|скрининг\s*i|первый\s*триместр/.test(t);
}