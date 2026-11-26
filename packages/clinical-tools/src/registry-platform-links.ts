import {
  IMPLEMENTATION_LABELS,
  resolveImplementation,
  resolvePrimaryHref,
} from "../../evidence-retrieval/src/registry/consensus-hub";
import { registryClassificationByKey } from "../../evidence-retrieval/src/registry/registry";

import { getConsensusRoom, getConsensusRoomForClassificationKey } from "./consensus-rooms";
import { getClinicalRoom } from "./rooms";

export type PlatformRegistryLink = {
  key: string;
  name: string;
  href: string;
  badge: string;
};

export type GuidelineRegistryRef = {
  registryKeys?: string[];
  consensusRoomId?: string;
};

/** Ссылки на комнаты и калькуляторы платформы по ключам реестра international-standards. */
export function platformLinksForGuideline(ref: GuidelineRegistryRef): PlatformRegistryLink[] {
  const seen = new Set<string>();
  const out: PlatformRegistryLink[] = [];

  const push = (link: PlatformRegistryLink) => {
    const dedupe = `${link.href}|${link.name}`;
    if (seen.has(dedupe)) return;
    seen.add(dedupe);
    out.push(link);
  };

  const roomId = ref.consensusRoomId;
  if (roomId) {
    const consensus = getConsensusRoom(roomId);
    const clinical = getClinicalRoom(roomId);
    const href = consensus?.href ?? clinical?.href;
    const title = consensus?.title ?? clinical?.title;
    if (href && title) {
      push({ key: roomId, name: title, href, badge: "Комната консенсуса" });
    }
  }

  for (const key of ref.registryKeys ?? []) {
    const cl = registryClassificationByKey(key);
    if (!cl) continue;

    const href =
      resolvePrimaryHref(cl) ??
      getConsensusRoomForClassificationKey(key)?.href ??
      (cl.room_id ? getConsensusRoom(cl.room_id)?.href : undefined);

    if (!href) continue;

    push({
      key,
      name: cl.name,
      href,
      badge: IMPLEMENTATION_LABELS[resolveImplementation(cl)],
    });
  }

  return out;
}