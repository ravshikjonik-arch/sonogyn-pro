import { NextResponse } from "next/server";

import { readTelegramBotToken } from "@/lib/auth/telegram-bot-config";
import { timingSafeEqual } from "@/lib/security/timing-safe";
import { isTelegramExampleUserAllowed } from "@/lib/security/telegram-example-ingest-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

type TelegramPhotoSize = {
  file_id: string;
  width?: number;
  height?: number;
  file_size?: number;
};

type TelegramDocument = {
  file_id: string;
  file_name?: string;
  mime_type?: string;
};

type TelegramMessage = {
  chat?: { id?: number | string };
  from?: { id?: number | string };
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
};

type TelegramUpdate = {
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
};

function readWebhookSecret(): string | null {
  return (
    process.env.TELEGRAM_HERMES_WEBHOOK_SECRET?.trim() ||
    process.env.TELEGRAM_EXAMPLE_INGEST_SECRET?.trim() ||
    null
  );
}

function readHermesBotToken(): string | null {
  return process.env.TELEGRAM_HERMES_BOT_TOKEN?.trim() || readTelegramBotToken();
}

function isWebhookAuthorized(request: Request): boolean {
  const secret = readWebhookSecret();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("x-telegram-bot-api-secret-token")?.trim() ?? "";
  return timingSafeEqual(secret, header);
}

function telegramApiUrl(method: string): string {
  const token = readHermesBotToken();
  if (!token) throw new Error("Telegram Hermes bot token is not configured");
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function telegramApi<T>(method: string, body: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(telegramApiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as ({ ok?: boolean; result?: T } & Record<string, unknown>) | null;
  if (!res.ok || !json?.ok) {
    console.warn("[telegram-hermes] Telegram API failed", { method, status: res.status, body: json });
    return null;
  }
  return json.result ?? null;
}

async function sendMessage(chatId: string, text: string): Promise<void> {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: text.slice(0, 4096),
    disable_web_page_preview: true,
  });
}

function bestPhoto(message: TelegramMessage): TelegramPhotoSize | null {
  const photos = message.photo ?? [];
  if (photos.length === 0) return null;
  return [...photos].sort((a, b) => (b.file_size ?? 0) - (a.file_size ?? 0))[0] ?? null;
}

function imageFileId(message: TelegramMessage): { fileId: string; fileName: string; contentType: string } | null {
  const photo = bestPhoto(message);
  if (photo?.file_id) {
    return { fileId: photo.file_id, fileName: "telegram-example.jpg", contentType: "image/jpeg" };
  }
  const doc = message.document;
  if (doc?.file_id && doc.mime_type?.startsWith("image/")) {
    return {
      fileId: doc.file_id,
      fileName: doc.file_name || "telegram-example.jpg",
      contentType: doc.mime_type,
    };
  }
  return null;
}

function parseCaption(caption: string | undefined): {
  title: string;
  description: string | null;
  anatomy: string | null;
  pathology: string | null;
} {
  const lines = (caption ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? "Учебный пример из Telegram";
  const rest = lines.slice(1);

  let anatomy: string | null = null;
  let pathology: string | null = null;
  const descriptionLines: string[] = [];

  for (const line of rest) {
    const anatomyMatch = line.match(/^(анатомия|anatomy)\s*[:：]\s*(.+)$/i);
    if (anatomyMatch?.[2]) {
      anatomy = anatomyMatch[2].trim();
      continue;
    }
    const pathologyMatch = line.match(/^(патология|pathology)\s*[:：]\s*(.+)$/i);
    if (pathologyMatch?.[2]) {
      pathology = pathologyMatch[2].trim();
      continue;
    }
    descriptionLines.push(line);
  }

  return {
    title: firstLine.slice(0, 200),
    description: descriptionLines.join("\n") || null,
    anatomy,
    pathology,
  };
}

async function downloadTelegramFile(fileId: string): Promise<Blob | null> {
  const file = await telegramApi<{ file_path?: string }>("getFile", { file_id: fileId });
  if (!file?.file_path) return null;
  const token = readHermesBotToken();
  if (!token) return null;
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`, { cache: "no-store" });
  if (!res.ok) {
    console.warn("[telegram-hermes] file download failed", { status: res.status });
    return null;
  }
  return await res.blob();
}

async function createTeachingExample(request: Request, params: {
  telegramUserId: string;
  caption: string | undefined;
  file: Blob;
  fileName: string;
  contentType: string;
}): Promise<{ ok: true; caseUrl: string } | { ok: false; error: string }> {
  const secret = process.env.TELEGRAM_EXAMPLE_INGEST_SECRET?.trim();
  if (!secret) return { ok: false, error: "Не настроен секрет Hermes ingest на сервере." };

  const meta = parseCaption(params.caption);
  const form = new FormData();
  form.set("telegram_user_id", params.telegramUserId);
  form.set("title", meta.title);
  if (meta.description) form.set("description", meta.description);
  if (meta.anatomy) form.set("anatomy", meta.anatomy);
  if (meta.pathology) form.set("pathology", meta.pathology);
  const typedFile = new Blob([await params.file.arrayBuffer()], { type: params.contentType || "image/jpeg" });
  form.set("file", typedFile, params.fileName || "telegram-example.jpg");

  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/ingest/telegram-example`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    body: form,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as { caseUrl?: string; error?: unknown } | null;
  if (!res.ok || !json?.caseUrl) {
    return { ok: false, error: typeof json?.error === "string" ? json.error : "Не удалось создать пример." };
  }
  return { ok: true, caseUrl: json.caseUrl };
}

export async function POST(request: Request) {
  if (!isWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message ?? update?.edited_message ?? null;
  const chatId = message?.chat?.id ? String(message.chat.id) : "";
  const telegramUserId = message?.from?.id ? String(message.from.id) : "";
  if (!message || !chatId || !telegramUserId) {
    return NextResponse.json({ ok: true });
  }

  if (message.text?.startsWith("/start")) {
    await sendMessage(
      chatId,
      "Hermes SonoGyn Pro снова на связи.\n\nПришлите УЗИ-изображение с подписью. Первая строка станет названием черновика. Можно добавить строки: Анатомия: ... и Патология: ...",
    );
    return NextResponse.json({ ok: true });
  }

  if (!isTelegramExampleUserAllowed(telegramUserId)) {
    await sendMessage(chatId, "Этот Telegram ID пока не разрешён для Hermes-загрузок SonoGyn Pro.");
    return NextResponse.json({ ok: true });
  }

  const image = imageFileId(message);
  if (!image) {
    await sendMessage(chatId, "Пришлите изображение УЗИ. Подпись к фото станет описанием учебного примера.");
    return NextResponse.json({ ok: true });
  }

  await telegramApi("sendChatAction", { chat_id: chatId, action: "upload_document" });
  const file = await downloadTelegramFile(image.fileId);
  if (!file) {
    await sendMessage(chatId, "Не смог скачать файл из Telegram. Попробуйте отправить изображение ещё раз.");
    return NextResponse.json({ ok: true });
  }

  const result = await createTeachingExample(request, {
    telegramUserId,
    caption: message.caption,
    file,
    fileName: image.fileName,
    contentType: image.contentType,
  });

  if (!result.ok) {
    await sendMessage(chatId, `Hermes не смог создать черновик: ${result.error}`);
    return NextResponse.json({ ok: true });
  }

  await sendMessage(
    chatId,
    `Готово. Создал черновик учебного примера:\n${result.caseUrl}\n\nПроверьте анонимизацию перед публикацией.`,
  );
  return NextResponse.json({ ok: true });
}
