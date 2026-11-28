export * from "./types.js";
export * from "./bm25.js";
export * from "./bus.js";
export * from "./packs.js";
export * from "./visionChecklists.js";
export * from "./pubmed.js";

import { KnowledgeBus } from "./bus.js";
import { BUILTIN_PACKS } from "./packs.js";

/** Шина со всеми встроенными паками нозологий (FMF-пак подключается потребителем). */
export function createDefaultBus(): KnowledgeBus {
  const bus = new KnowledgeBus();
  for (const pack of BUILTIN_PACKS) bus.registerPack(pack);
  return bus;
}
