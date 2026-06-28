import type { NavigationContainerRef } from "@react-navigation/native";
import * as Linking from "expo-linking";

import { openWebPath } from "../clinical-tools/openClinicalTool";
import type { RootStackParamList } from "../../navigation/paramLists";

export type DiscussionPushPayload = {
  type: "new_comment" | "new_question";
  caseId: string;
  channelId?: string;
};

export function buildDiscussionCaseWebPath(payload: DiscussionPushPayload): string {
  const params = new URLSearchParams({ from: "push" });
  if (payload.channelId) params.set("channelId", payload.channelId);
  return `/cases/${payload.caseId}?${params.toString()}`;
}

export function parseDiscussionPushData(data: unknown): DiscussionPushPayload | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const rawType = record.type;
  const rawCaseId = record.caseId ?? record.case_id;

  if (rawType !== "new_comment" && rawType !== "new_question") return null;
  if (typeof rawCaseId !== "string" || !rawCaseId.trim()) return null;

  const channelRaw = record.channelId ?? record.channel_id;
  const channelId = typeof channelRaw === "string" && channelRaw.trim() ? channelRaw.trim() : undefined;

  return {
    type: rawType,
    caseId: rawCaseId.trim(),
    channelId,
  };
}

/** Custom scheme / universal link: …://discussions/case/<uuid> */
export function parseDiscussionDeepLink(url: string | null): DiscussionPushPayload | null {
  if (!url) return null;

  const parsed = Linking.parse(url);
  const path = [parsed.hostname, parsed.path].filter(Boolean).join("/").replace(/^\/+/, "");
  const pathMatch = path.match(/(?:^|\/)discussions\/case\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    return { type: "new_comment", caseId: pathMatch[1] };
  }

  const caseIdRaw = parsed.queryParams?.caseId ?? parsed.queryParams?.case_id;
  const caseId =
    typeof caseIdRaw === "string" ? caseIdRaw : Array.isArray(caseIdRaw) ? caseIdRaw[0] : null;
  if (caseId?.trim()) {
    const typeRaw = parsed.queryParams?.type;
    const type =
      typeRaw === "new_question" || typeRaw === "new_comment" ? typeRaw : "new_comment";
    const channelRaw = parsed.queryParams?.channelId ?? parsed.queryParams?.channel_id;
    const channelId =
      typeof channelRaw === "string" ? channelRaw : Array.isArray(channelRaw) ? channelRaw[0] : undefined;
    return { type, caseId: caseId.trim(), channelId: channelId?.trim() || undefined };
  }

  return null;
}

export async function navigateToDiscussionCase(
  navigationRef: NavigationContainerRef<RootStackParamList> | null,
  payload: DiscussionPushPayload,
): Promise<void> {
  if (navigationRef?.isReady()) {
    navigationRef.navigate("Main");
  }
  await openWebPath(buildDiscussionCaseWebPath(payload));
}
