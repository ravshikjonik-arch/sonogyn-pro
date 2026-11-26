import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { registryClassificationByKey } from "../../evidence-retrieval/src/registry/registry";

import { CONSENSUS_ROOMS, getConsensusRoomForClassificationKey } from "./consensus-rooms";

describe("consensus-rooms", () => {
  it("has unique room ids", () => {
    const ids = CONSENSUS_ROOMS.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("maps o-rads-us to orads room", () => {
    assert.equal(getConsensusRoomForClassificationKey("o-rads-us")?.id, "orads-us");
  });

  it("every room classification key exists in registry", () => {
    for (const room of CONSENSUS_ROOMS) {
      for (const key of room.classificationKeys) {
        assert.ok(registryClassificationByKey(key), `room ${room.id}: нет классификации ${key}`);
      }
    }
  });
});