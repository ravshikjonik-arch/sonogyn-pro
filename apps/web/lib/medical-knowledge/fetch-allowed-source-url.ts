import { checkUrlIngestAllowlist, type UrlIngestHostPolicy } from "@repo/medical-knowledge";

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_TEXT_CHARS = 200_000;

export type FetchedSourceDocument = {
  url: string;
  policy: UrlIngestHostPolicy;
  titleHint: string | null;
  text: string;
  contentKind: "pdf" | "html" | "text";
  bytes: number;
};

function stripHtml(html: string): { title: string | null; text: string } {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { title, text };
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const joined = Array.isArray(text) ? text.join("\n\n") : String(text ?? "");
  return joined.replace(/\s+\n/g, "\n").trim();
}

/**
 * Download an allowlisted https URL and extract plain text (PDF text layer or HTML).
 * Scanned PDFs without a text layer return empty → caller should fail softly.
 */
export async function fetchAllowedSourceDocument(rawUrl: string): Promise<FetchedSourceDocument> {
  const check = checkUrlIngestAllowlist(rawUrl);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  const res = await fetch(check.normalized, {
    redirect: "follow",
    headers: {
      "User-Agent": "SonoGynPro-VaultIngest/1.0 (+https://sonogyn-pro.ru; admin library import)",
      Accept: "application/pdf,text/html,application/xhtml+xml,text/plain,*/*",
    },
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    throw new Error(`Не удалось скачать: HTTP ${res.status}`);
  }

  const finalUrl = res.url || check.normalized;
  const finalCheck = checkUrlIngestAllowlist(finalUrl);
  if (!finalCheck.ok) {
    throw new Error(`Редирект на запрещённый домен: ${finalCheck.reason}`);
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength === 0) throw new Error("Пустой ответ сервера");
  if (buf.byteLength > MAX_BYTES) {
    throw new Error(`Файл больше ${MAX_BYTES / (1024 * 1024)} МБ`);
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const looksPdf =
    contentType.includes("pdf") ||
    finalUrl.toLowerCase().includes(".pdf") ||
    (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46); // %PDF

  if (looksPdf) {
    const text = (await extractPdfText(buf)).slice(0, MAX_TEXT_CHARS);
    if (text.length < 40) {
      throw new Error(
        "PDF без текстового слоя (вероятно скан). Нужен Docling/OCR — пока вставьте текст вручную или используйте текстовый PDF.",
      );
    }
    const name = decodeURIComponent(finalUrl.split("/").pop() || "document.pdf");
    return {
      url: finalCheck.normalized,
      policy: finalCheck.policy,
      titleHint: name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").slice(0, 200) || null,
      text,
      contentKind: "pdf",
      bytes: buf.byteLength,
    };
  }

  if (contentType.includes("html") || contentType.includes("text/plain") || contentType.includes("xml")) {
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    if (contentType.includes("html") || raw.includes("<html")) {
      const { title, text } = stripHtml(raw);
      if (text.length < 40) throw new Error("На странице слишком мало текста");
      return {
        url: finalCheck.normalized,
        policy: finalCheck.policy,
        titleHint: title,
        text: text.slice(0, MAX_TEXT_CHARS),
        contentKind: "html",
        bytes: buf.byteLength,
      };
    }
    const text = raw.replace(/\s+/g, " ").trim();
    if (text.length < 40) throw new Error("Слишком мало текста");
    return {
      url: finalCheck.normalized,
      policy: finalCheck.policy,
      titleHint: null,
      text: text.slice(0, MAX_TEXT_CHARS),
      contentKind: "text",
      bytes: buf.byteLength,
    };
  }

  throw new Error(`Неподдерживаемый тип: ${contentType || "unknown"}`);
}
