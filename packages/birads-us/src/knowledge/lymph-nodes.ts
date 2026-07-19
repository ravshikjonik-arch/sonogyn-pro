import knowledgeJson from "./lymph-nodes-birads2025.json";

export type BiradsLymphNodesKnowledge = typeof knowledgeJson;

export const BIRADS_LYMPH_NODES_KNOWLEDGE = knowledgeJson as BiradsLymphNodesKnowledge;

export function getBiradsLymphNodesKnowledge(): BiradsLymphNodesKnowledge {
  return BIRADS_LYMPH_NODES_KNOWLEDGE;
}
