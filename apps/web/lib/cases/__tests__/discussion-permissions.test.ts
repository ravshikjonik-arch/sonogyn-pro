import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canPerformLifecycleAction,
  canModerateComments,
  canPinExpertComment,
  resolveCaseDiscussionRoles,
} from "../discussion-permissions";

describe("resolveCaseDiscussionRoles", () => {
  it("marks author and expert for verified doctor", () => {
    const roles = resolveCaseDiscussionRoles(
      {
        userId: "u1",
        role: "user",
        medicalAccessStatus: "verified_doctor",
        medicalVerifiedAt: "2026-01-01T00:00:00Z",
      },
      { id: "c1", userId: "u1", lifecycleStatus: "discussion", status: "published", channelId: "ch" },
      { isParticipant: true },
    );
    assert.ok(roles.includes("author"));
    assert.ok(roles.includes("expert"));
    assert.ok(roles.includes("verified_doctor"));
  });

  it("grants moderator role from profiles.role", () => {
    const roles = resolveCaseDiscussionRoles(
      {
        userId: "m1",
        role: "moderator",
        medicalAccessStatus: "doctor",
        medicalVerifiedAt: null,
      },
      { id: "c1", userId: "u2", lifecycleStatus: "open", status: "draft", channelId: "ch" },
      { isParticipant: false },
    );
    assert.ok(roles.includes("moderator"));
    assert.ok(roles.includes("expert"));
  });
});

describe("canPerformLifecycleAction", () => {
  it("allows owner resolve from discussion", () => {
    assert.equal(
      canPerformLifecycleAction({
        action: "resolve",
        lifecycle: "discussion",
        roles: ["author", "participant"],
        isOwner: true,
      }),
      true,
    );
  });

  it("denies participant confirm", () => {
    assert.equal(
      canPerformLifecycleAction({
        action: "confirm",
        lifecycle: "resolved",
        roles: ["participant"],
        isOwner: false,
      }),
      false,
    );
  });

  it("allows expert confirm", () => {
    assert.equal(
      canPerformLifecycleAction({
        action: "confirm",
        lifecycle: "resolved",
        roles: ["expert"],
        isOwner: false,
      }),
      true,
    );
  });

  it("denies archive for participant", () => {
    assert.equal(
      canPerformLifecycleAction({
        action: "archive",
        lifecycle: "discussion",
        roles: ["participant"],
        isOwner: false,
      }),
      false,
    );
  });
});

describe("moderation helpers", () => {
  it("canModerateComments only for moderator/admin", () => {
    assert.equal(canModerateComments(["moderator"]), true);
    assert.equal(canModerateComments(["participant"]), false);
  });

  it("canPinExpertComment for expert", () => {
    assert.equal(canPinExpertComment(["verified_doctor", "expert"]), true);
    assert.equal(canPinExpertComment(["participant"]), false);
  });
});
