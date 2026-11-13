import type {
  ClassificationContextId,
  MorphologyAnatomy,
  MorphologyFeatureDefinition,
} from "./types";

export type FeatureRegistry = {
  get(featureId: string): MorphologyFeatureDefinition | undefined;
  has(featureId: string): boolean;
  list(filter?: {
    anatomy?: MorphologyAnatomy;
    classification?: ClassificationContextId;
  }): MorphologyFeatureDefinition[];
  /** Returns a new registry; the original is not mutated. Duplicate ids throw. */
  extend(definitions: readonly MorphologyFeatureDefinition[]): FeatureRegistry;
};

export function createFeatureRegistry(
  definitions: readonly MorphologyFeatureDefinition[],
): FeatureRegistry {
  const byId = new Map<string, MorphologyFeatureDefinition>();
  for (const def of definitions) {
    if (byId.has(def.featureId)) {
      throw new Error(`Duplicate morphology feature definition: ${def.featureId}`);
    }
    if (def.valueType === "quantity" && !def.unit) {
      throw new Error(`Quantity feature ${def.featureId} must declare a unit`);
    }
    if ((def.valueType === "enum" || def.valueType === "enum_set") && !def.allowedValues?.length) {
      throw new Error(`Enum feature ${def.featureId} must declare allowedValues`);
    }
    byId.set(def.featureId, def);
  }

  return {
    get: (featureId) => byId.get(featureId),
    has: (featureId) => byId.has(featureId),
    list: (filter) =>
      [...byId.values()].filter(
        (d) =>
          (!filter?.anatomy || d.anatomy === filter.anatomy) &&
          (!filter?.classification || d.applicableClassifications.includes(filter.classification)),
      ),
    extend: (more) => createFeatureRegistry([...byId.values(), ...more]),
  };
}
