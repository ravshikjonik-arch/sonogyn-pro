import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  doctorPublicCode,
  formatDoctorChatDisplayName,
  isSharedChatEmail,
} from "./doctor-chat-identity";

describe("doctor-chat-identity", () => {
  it("detects shared guest emails", () => {
    assert.equal(isSharedChatEmail("open-access@sonogyn.pro"), true);
    assert.equal(isSharedChatEmail("chat-guest@sonogyn.pro"), true);
    assert.equal(isSharedChatEmail("doctor@clinic.ru"), false);
  });

  it("builds stable public codes from uuid", () => {
    assert.equal(doctorPublicCode("711573aa-bbbb-cccc-dddd-eeeeeeeeeeee"), "711573");
  });

  it("prefers FIO and labels empty/generic names with public №", () => {
    const named = formatDoctorChatDisplayName({
      userId: "711573aa-bbbb-cccc-dddd-eeeeeeeeeeee",
      fullName: "Петров Пётр",
    });
    assert.ok(named.length > 2);
    assert.equal(
      formatDoctorChatDisplayName({
        userId: "711573aa-bbbb-cccc-dddd-eeeeeeeeeeee",
        fullName: "Врач",
      }),
      "Врач №711573",
    );
    assert.equal(
      formatDoctorChatDisplayName({
        userId: "711573aa-bbbb-cccc-dddd-eeeeeeeeeeee",
        email: "open-access@sonogyn.pro",
      }),
      "Гость",
    );
  });
});
