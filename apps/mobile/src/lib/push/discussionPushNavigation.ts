import type { NavigationContainerRef } from "@react-navigation/native";
import * as Linking from "expo-linking";

import { openWebPath } from "../clinical-tools/openClinicalTool";
import type { RootStackParamList } from "../../navigation/paramLists";

export type DiscussionPushPayload = {
  type: "new_comment" | "new_question";
  caseId: string;
  channelId?: string;
};

export type ChatMessagePushPayload = {
  type: "new_chat_message";
  channelId: string;
  channelSlug?: string;
};

export type CommunityPushPayload = DiscussionPushPayload | ChatMessagePushPayload;

export function buildDiscussionCaseWebPath(payload: DiscussionPushPayload): string {
  const params = new URLSearchParams({ from: "push" });
  if (payload.channelId) params.set("channelId", payload.channelId);
  return `/cases/${payload.caseId}?${params.toString()}`;
}

export function buildChatChannelWebPath(payload: ChatMessagePushPayload): string {
  const params = new URLSearchParams({ tab: "chat", from: "push" });
  if (payload.channelSlug) params.set("channel", payload.channelSlug);
  else params.set("channelId", payload.channelId);
  return `/cases?${params.toString()}`;
}

export function parseDiscussionPushData(data: unknown): CommunityPushPayload | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const rawType = record.type;

  if (rawType === "new_chat_message") {
    const channelRaw = record.channelId ?? record.channel_id;
    if (typeof channelRaw !== "string" || !channelRaw.trim()) return null;
    const slugRaw = record.channelSlug ?? record.channel_slug;
    const channelSlug =
      typeof slugRaw === "string" && slugRaw.trim() ? slugRaw.trim() : undefined;
    return {
      type: "new_chat_message",
      channelId: channelRaw.trim(),
      channelSlug,
    };
  }

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

/** Custom scheme / universal link: …://discussions/case/<uuid> or …://chat/<channelId> */
export function parseDiscussionDeepLink(url: string | null): CommunityPushPayload | null {
  if (!url) return null;

  const parsed = Linking.parse(url);
  const path = [parsed.hostname, parsed.path].filter(Boolean).join("/").replace(/^\/+/, "");

  const chatMatch = path.match(/(?:^|\/)chat\/([^/?#]+)/i);
  if (chatMatch?.[1]) {
    return { type: "new_chat_message", channelId: chatMatch[1] };
  }

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

  const channelIdRaw = parsed.queryParams?.channelId ?? parsed.queryParams?.channel_id;
  const channelId =
    typeof channelIdRaw === "string"
      ? channelIdRaw
      : Array.isArray(channelIdRaw)
        ? channelIdRaw[0]
        : null;
  if (parsed.queryParams?.type === "new_chat_message" && channelId?.trim()) {
    const slugRaw = parsed.queryParams?.channel ?? parsed.queryParams?.channelSlug;
    const channelSlug =
      typeof slugRaw === "string" ? slugRaw : Array.isArray(slugRaw) ? slugRaw[0] : undefined;
    return {
      type: "new_chat_message",
      channelId: channelId.trim(),
      channelSlug: channelSlug?.trim() || undefined,
    };
  }

  return null;
}

export async function navigateToCommunityPush(
  navigationRef: NavigationContainerRef<RootStackParamList> | null,
  payload: CommunityPushPayload,
): Promise<void> {
  if (navigationRef?.isReady()) {
    navigationRef.navigate("Main");
  }
  const path =
    payload.type === "new_chat_message"
      ? buildChatChannelWebPath(payload)
      : buildDiscussionCaseWebPath(payload);
  await openWebPath(path);
}

/** @deprecated use navigateToCommunityPush */
export async function navigateToDiscussionCase(
  navigationRef: NavigationContainerRef<RootStackParamList> | null,
  payload: DiscussionPushPayload,
): Promise<void> {
  await navigateToCommunityPush(navigationRef, payload);
}
