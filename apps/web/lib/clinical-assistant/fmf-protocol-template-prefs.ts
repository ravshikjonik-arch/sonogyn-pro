"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_SECOND_THIRD_PROTOCOL_TEMPLATE,
  type SecondThirdProtocolTemplateId,
  parseClinicalPreferences,
} from "@repo/types";

import {
  FMF_SECOND_THIRD_PROTOCOL_TEMPLATES,
  type FmfProtocolTemplateMeta,
} from "./fmf-protocol-templates";

const STORAGE_KEY = "sonogyn.fmf.secondThirdProtocolTemplate";

export function readSecondThirdProtocolTemplate(): SecondThirdProtocolTemplateId {
  if (typeof window === "undefined") return DEFAULT_SECOND_THIRD_PROTOCOL_TEMPLATE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "yakubov-2023" || raw === "sonogyn-compact") return raw;
  return DEFAULT_SECOND_THIRD_PROTOCOL_TEMPLATE;
}

export function writeSecondThirdProtocolTemplate(id: SecondThirdProtocolTemplateId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, id);
}

export function getProtocolTemplateMeta(id: SecondThirdProtocolTemplateId): FmfProtocolTemplateMeta {
  return FMF_SECOND_THIRD_PROTOCOL_TEMPLATES.find((t) => t.id === id) ?? FMF_SECOND_THIRD_PROTOCOL_TEMPLATES[0]!;
}

const PROFILE_FETCH_MS = 6000;

async function fetchWithTimeout(url: string, init?: RequestInit, ms = PROFILE_FETCH_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchProfileTemplate(): Promise<SecondThirdProtocolTemplateId | null> {
  try {
    const res = await fetchWithTimeout("/api/profile", { credentials: "same-origin" });
    if (!res.ok) return null;
    const payload = (await res.json().catch(() => null)) as {
      profile?: { clinical_preferences?: unknown };
    } | null;
    return parseClinicalPreferences(payload?.profile?.clinical_preferences).fmfSecondThirdProtocolTemplate ?? null;
  } catch {
    return null;
  }
}

async function persistProfileTemplate(id: SecondThirdProtocolTemplateId): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ clinical_preferences: { fmfSecondThirdProtocolTemplate: id } }),
  });
  if (res.ok) return { ok: true };
  const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
  const error =
    typeof payload?.error === "string"
      ? payload.error
      : payload?.error && typeof payload.error === "object"
        ? "Ошибка валидации профиля"
        : `HTTP ${res.status}`;
  return { ok: false, error };
}

type Options = {
  /** Начальное значение с сервера (страница профиля). */
  initialTemplateId?: SecondThirdProtocolTemplateId;
};

/** Шаблон II/III скрининга: кэш в браузере + синхронизация через profiles.clinical_preferences. */
export function useSecondThirdProtocolTemplate(options: Options = {}) {
  const [templateId, setTemplateIdState] = useState<SecondThirdProtocolTemplateId>(
    options.initialTemplateId ?? readSecondThirdProtocolTemplate(),
  );
  const [loading, setLoading] = useState(!options.initialTemplateId);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncedToProfile, setSyncedToProfile] = useState(Boolean(options.initialTemplateId));

  useEffect(() => {
    if (options.initialTemplateId) {
      writeSecondThirdProtocolTemplate(options.initialTemplateId);
      return;
    }

    let cancelled = false;
    const local = readSecondThirdProtocolTemplate();
    setTemplateIdState(local);

    void (async () => {
      try {
        const remote = await fetchProfileTemplate();
        if (cancelled) return;
        if (remote) {
          setTemplateIdState(remote);
          writeSecondThirdProtocolTemplate(remote);
          setSyncedToProfile(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [options.initialTemplateId]);

  const setTemplateId = useCallback(async (id: SecondThirdProtocolTemplateId) => {
    setSyncError(null);
    setTemplateIdState(id);
    writeSecondThirdProtocolTemplate(id);
    setSyncing(true);
    try {
      const result = await persistProfileTemplate(id);
      if (result.ok) {
        setSyncedToProfile(true);
      } else {
        setSyncedToProfile(false);
        setSyncError(result.error ?? "Не удалось сохранить в профиль");
      }
    } catch {
      setSyncedToProfile(false);
      setSyncError("Нет связи с сервером — выбор сохранён только на этом устройстве");
    } finally {
      setSyncing(false);
    }
  }, []);

  return {
    templateId,
    setTemplateId,
    meta: getProtocolTemplateMeta(templateId),
    loading,
    syncing,
    syncError,
    syncedToProfile,
  };
}
