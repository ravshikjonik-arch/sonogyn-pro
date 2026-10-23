import raw from "../data/nomograms.json";
import { nomogramDatasetSchema, type Nomogram, type NomogramCategory, type NomogramDataset } from "./types";

export const NOMOGRAM_DATASET: NomogramDataset = nomogramDatasetSchema.parse(raw);

export const NOMOGRAM_DISCLAIMER =
  "Справочная оценка по номограммам. Не заменяет протокол УЗИ и клиническое суждение.";

export const NOMOGRAM_CATEGORY_LABELS: Record<NomogramCategory, string> = {
  first_trimester: "I триместр (11–14 нед)",
  second_third_trimester: "Фетометрия II/III триместра",
  doppler: "Допплерометрия",
  fluid: "Жидкостные показатели",
  neurosonography: "Нейросонография",
  fetal_echo: "Эхокардиография плода",
};

const byId = new Map<string, Nomogram>();
for (const n of NOMOGRAM_DATASET.nomograms) {
  byId.set(n.id, n);
}

export function getNomogramById(id: string): Nomogram | undefined {
  return byId.get(id);
}

export function listNomogramCategories(): NomogramCategory[] {
  const seen = new Set<NomogramCategory>();
  for (const n of NOMOGRAM_DATASET.nomograms) seen.add(n.category);
  return [...seen];
}

export function listNomogramsByCategory(category: NomogramCategory): Nomogram[] {
  return NOMOGRAM_DATASET.nomograms.filter((n) => n.category === category);
}

export function listAllNomograms(): Nomogram[] {
  return [...NOMOGRAM_DATASET.nomograms];
}

export function getScoringSystem(id: string) {
  return NOMOGRAM_DATASET.scoring_systems?.find((s) => s.id === id);
}

export function listClinicalDefinitions() {
  return NOMOGRAM_DATASET.clinical_definitions ?? [];
}
