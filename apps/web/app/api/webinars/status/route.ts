import { NextResponse } from "next/server";

import { getLiveKitConfig, isLiveKitConfigured } from "@/lib/webinars/livekit";
import { isFullDiagnosticsAllowed } from "@/lib/security/diagnostics-access";
import { isObjectStorageConfigured, readStorageConfig } from "@/lib/storage/config";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

/** Публичная диагностика вебинаров (без секретов). */
export async function GET(req: Request) {
  const full = isFullDiagnosticsAllowed(req);
  const issues: string[] = [];
  const liveKitConfigured = isLiveKitConfigured();
  const liveKitUrl = getLiveKitConfig()?.url ?? null;

  const storageConfigured = isObjectStorageConfigured();
  const storageProvider = readStorageConfig().provider;

  if (!storageConfigured) {
    issues.push(
      "Video storage: задайте BLOB_READ_WRITE_TOKEN (Vercel Blob) или STORAGE_* (Yandex S3) на Vercel",
    );
  }

  if (!liveKitConfigured) {
    issues.push(
      "LiveKit: задайте NEXT_PUBLIC_LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET на Vercel и redeploy",
    );
  }

  let databaseReady = false;
  let webinarLessonType = false;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    issues.push("SUPABASE_SERVICE_ROLE_KEY не задан — нельзя проверить таблицы webinar_*");
  } else {
    try {
      const admin = createServiceRoleClient();

      const { error: sessionsError } = await admin.from("webinar_sessions").select("id").limit(1);
      if (sessionsError) {
        const msg = sessionsError.message ?? "";
        if (/does not exist|schema cache/i.test(msg)) {
          issues.push(
            "Supabase: таблица webinar_sessions отсутствует — выполните apps/web/supabase/BUNDLE_WEBINAR_ONLY.sql",
          );
        } else {
          issues.push(`Supabase webinar_sessions: ${msg}`);
        }
      } else {
        databaseReady = true;
      }

      const { error: chatError } = await admin.from("webinar_chat_messages").select("id").limit(1);
      if (chatError) {
        const msg = chatError.message ?? "";
        if (/does not exist|schema cache/i.test(msg)) {
          issues.push(
            "Supabase: таблица webinar_chat_messages отсутствует — выполните BUNDLE_WEBINAR_ONLY.sql",
          );
          databaseReady = false;
        } else if (databaseReady) {
          issues.push(`Supabase webinar_chat_messages: ${msg}`);
          databaseReady = false;
        }
      }

      const { error: lessonTypeError } = await admin
        .from("course_lessons")
        .select("id")
        .eq("lesson_type", "webinar")
        .limit(1);

      if (lessonTypeError) {
        const msg = lessonTypeError.message ?? "";
        if (/lesson_type|check constraint|invalid input value/i.test(msg)) {
          issues.push(
            "Supabase: lesson_type «webinar» не разрешён — выполните BUNDLE_WEBINAR_ONLY.sql (alter check)",
          );
        } else if (databaseReady) {
          issues.push(`Supabase course_lessons (webinar): ${msg}`);
        }
      } else {
        webinarLessonType = true;
      }
    } catch (e) {
      issues.push(e instanceof Error ? e.message : "Ошибка проверки Supabase");
    }
  }

  const ready = storageConfigured && databaseReady && webinarLessonType;

  if (!full) {
    return NextResponse.json({
      ok: ready,
      liveKit: { configured: liveKitConfigured },
      storage: { configured: storageConfigured },
      database: { ready: databaseReady },
      issueCount: issues.length,
    });
  }

  return NextResponse.json({
    ok: ready,
    liveKit: {
      configured: liveKitConfigured,
      url: liveKitUrl,
    },
    storage: {
      configured: storageConfigured,
      provider: storageProvider,
    },
    database: {
      ready: databaseReady,
      webinarLessonType,
      migrationSql: "apps/web/supabase/BUNDLE_WEBINAR_ONLY.sql",
    },
    routes: {
      hub: "/tools/refs/webinars",
      library: "/library/webinars",
    },
    issues,
    hints: {
      liveKit: [
        "https://cloud.livekit.io → Project → Keys",
        "NEXT_PUBLIC_LIVEKIT_URL=wss://YOUR.livekit.cloud",
        "LIVEKIT_API_KEY + LIVEKIT_API_SECRET — только server env (не NEXT_PUBLIC_)",
        "После env: Redeploy Production на Vercel",
      ],
      supabase: [
        "Dashboard → SQL Editor → вставить BUNDLE_WEBINAR_ONLY.sql → Run",
        "Realtime: webinar_chat_messages добавляется миграцией автоматически",
        "Создайте урок lesson_type=webinar в Author → откройте /tools/refs/webinars/{lessonId}",
      ],
      smoke: "curl -s https://sonogyn-pro.ru/api/webinars/status | jq",
    },
  });
}
