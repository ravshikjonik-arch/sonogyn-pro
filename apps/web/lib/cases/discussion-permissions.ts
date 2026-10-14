import type { CaseDiscussionRole, CaseLifecycleAction } from "@repo/types";
import type { CaseLifecycleStatus } from "@repo/types";
import { canTransitionLifecycle } from "@repo/types";

export type ProfileAccessSnapshot = {
  userId: string;
  role: "user" | "moderator" | "author" | "admin";
  medicalAccessStatus: string;
  medicalVerifiedAt: string | null;
};

export type CaseAccessSnapshot = {
  id: string;
  userId: string;
  lifecycleStatus: CaseLifecycleStatus | null;
  status: string;
  channelId: string | null;
};

export function resolveCaseDiscussionRoles(
  profile: ProfileAccessSnapshot,
  caseRow: CaseAccessSnapshot,
  opts: { isParticipant: boolean },
): CaseDiscussionRole[] {
  const roles = new Set<CaseDiscussionRole>();

  if (caseRow.userId === profile.userId) roles.add("author");
  if (opts.isParticipant) roles.add("participant");
  if (profile.medicalAccessStatus === "verified_doctor" && profile.medicalVerifiedAt) {
    roles.add("verified_doctor");
  }
  if (
    profile.role === "moderator" ||
    profile.role === "admin" ||
    (profile.medicalAccessStatus === "verified_doctor" && profile.medicalVerifiedAt)
  ) {
    roles.add("expert");
  }
  if (profile.role === "moderator" || profile.role === "author") roles.add("moderator");
  if (profile.role === "admin") roles.add("admin");

  return [...roles];
}

export function canPerformLifecycleAction(input: {
  action: CaseLifecycleAction;
  lifecycle: CaseLifecycleStatus;
  roles: CaseDiscussionRole[];
  isOwner: boolean;
}): boolean {
  if (!canTransitionLifecycle(input.lifecycle, input.action)) return false;

  switch (input.action) {
    case "resolve":
      return input.isOwner || input.roles.includes("moderator") || input.roles.includes("admin");
    case "confirm":
      return input.roles.includes("expert") || input.roles.includes("moderator") || input.roles.includes("admin");
    case "archive":
      return input.roles.includes("moderator") || input.roles.includes("admin");
    case "reopen":
      return input.isOwner || input.roles.includes("moderator") || input.roles.includes("admin");
    case "publish_knowledge_base":
      return input.roles.includes("moderator") || input.roles.includes("admin");
    default:
      return false;
  }
}

export function canModerateComments(roles: CaseDiscussionRole[]): boolean {
  return roles.includes("moderator") || roles.includes("admin");
}

export function canPinExpertComment(roles: CaseDiscussionRole[]): boolean {
  return (
    roles.includes("expert") ||
    roles.includes("moderator") ||
    roles.includes("admin")
  );
}

export function canEditCaseContent(roles: CaseDiscussionRole[]): boolean {
  return roles.includes("author");
}

export function canChangeConfirmedDiagnosis(roles: CaseDiscussionRole[]): boolean {
  return roles.includes("expert") || roles.includes("moderator") || roles.includes("admin");
}

/** Parse @mentions from plain text — returns UUID-like tokens only if valid. */
export function extractMentionTokens(body: string): string[] {
  const matches = body.match(/@([0-9a-f-]{36})/gi) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}
