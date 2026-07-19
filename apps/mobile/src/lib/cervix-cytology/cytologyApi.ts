import {
  BethesdaAssistInputSchema,
  interpretBethesdaAssist,
  type BethesdaAssistInput,
  type BethesdaAssistResult,
} from "@repo/cervix-pathology-reference/cytology";

import { getWebApiBase } from "../../api/chatBackend";
import { supabaseMobile } from "../supabase/mobileClient";

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-sonogyn-client": "mobile",
  };
  if (supabaseMobile) {
    const { data } = await supabaseMobile.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** API при наличии сессии; иначе локальный rule-engine из пакета. */
export async function askBethesdaAssist(input: BethesdaAssistInput): Promise<BethesdaAssistResult> {
  const parsed = BethesdaAssistInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Проверьте поля формы Bethesda");
  }

  const base = getWebApiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/api/education/cytology/bethesda-assist`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        const json = (await res.json()) as { result?: BethesdaAssistResult };
        if (json.result) return json.result;
      }
    } catch {
      // offline / API недоступен — локальный движок ниже
    }
  }

  return interpretBethesdaAssist(parsed.data);
}
