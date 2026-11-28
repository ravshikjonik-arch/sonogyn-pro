/**
 * myomaFigo — классификация миомы матки по системе FIGO (типы 0–8).
 * Реализация по опубликованной классификационной системе:
 *   FIGO (Munro MG et al. «The FIGO classification of causes of abnormal uterine
 *   bleeding in the reproductive years», Int J Gynaecol Obstet 2018) — учебный
 *   пересказ системы типов, собственные формулировки. Решение за врачом.
 *
 * Движок детерминированный: вопрос-ветвление. Если не хватает ветвного слота —
 * возвращает null (оркестратор переспросит врача), НЕ додумывает.
 */

export type FigoPrimaryLocation =
  | "cervical_or_parasitic"
  | "submucosal"
  | "intramural"
  | "subserosal";

/** Интрамуральное распространение узла. */
export type FigoExtension = "less50" | "ge50";

export interface MyomaFigoInput {
  primaryLocation: FigoPrimaryLocation;
  /** Подслизистая: узел на ножке внутри полости, без интрамурального компонента → тип 0. */
  pedunculatedIntracavitary?: boolean;
  /** Подслизистая: интрамуральное распространение (<50% → тип 1, ≥50% → тип 2). */
  intramuralExtension?: FigoExtension;
  /** Интрамуральная: контакт узла с эндометрием (да → тип 3, нет → тип 4). */
  contactsEndometrium?: boolean;
  /** Субсерозная: узел на ножке → тип 7. */
  pedunculatedSubserosal?: boolean;
  /** Субсерозная: интрамуральное распространение (≥50% → тип 5, <50% → тип 6). */
  subserosalExtension?: FigoExtension;
}

export interface MyomaFigoResult {
  figoType: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  label: string;
  category: "submucosal" | "intramural" | "subserosal" | "other";
  /** Учебный пересказ типичной тактики — не назначение; решение за врачом. */
  managementNotes: string[];
  chain: string[];
}

export const FIGO_CITATION = {
  organization: "FIGO",
  document:
    "Munro MG et al. — FIGO classification of causes of abnormal uterine bleeding (система типов миомы 0–8)",
  year: 2018,
  status: "опубликованная классификационная система, учебный пересказ",
} as const;

const NOTES: Record<number, string[]> = {
  0: [
    "Тип 0 — узел на ножке в полости матки; частая причина обильных менструаций.",
    "Типичный путь — гистероскопная миомэктомия; тактика определяется врачом.",
  ],
  1: [
    "Тип 1 — подслизистый с интрамуральным компонентом <50%; обычно доступен гистероскопной резекции.",
    "Решение за врачом с учётом размера и репродуктивных планов.",
  ],
  2: [
    "Тип 2 — подслизистый с интрамуральным компонентом ≥50%; гистероскопная миомэктомия сложнее (иногда двухэтапно или гибридные методики).",
    "Решение за врачом, по опыту центра.",
  ],
  3: [
    "Тип 3 — интрамуральный узел, контактирующий с эндометрием; учитывается при планировании миомэктомии, эмболизации и репродуктивных исходах.",
    "Тактика по симптомам и планам беременности — за врачом.",
  ],
  4: [
    "Тип 4 — чисто интрамуральный без контакта с эндометрием; чаще наблюдение, медикаментозная терапия или миомэктомия по симптомам.",
    "Решение за врачом.",
  ],
  5: [
    "Тип 5 — субсерозный с интрамуральным компонентом ≥50%; при показаниях — миомэктомия (часто лапароскопная) или эмболизация.",
    "Решение за врачом.",
  ],
  6: [
    "Тип 6 — субсерозный с интрамуральным компонентом <50%; обычно миомэктомия/наблюдение по клинике.",
    "Решение за врачом.",
  ],
  7: [
    "Тип 7 — субсерозный на ножке; учитывать риск перекрута ножки при клинике острого живота.",
    "Миомэктомия при показаниях — решение за врачом.",
  ],
  8: [
    "Тип 8 — шеечная локализация, паразитирующий узел или иные формы без прямого отношения к миометрию; ведение в специализированном центре.",
    "Решение за врачом.",
  ],
};

function labelFor(t: MyomaFigoResult["figoType"]): string {
  const map: Record<number, string> = {
    0: "подслизистый на ножке внутри полости",
    1: "подслизистый, интрамуральный компонент <50%",
    2: "подслизистый, интрамуральный компонент ≥50%",
    3: "интрамуральный с контактом с эндометрием",
    4: "чисто интрамуральный (без контакта с эндометрием)",
    5: "субсерозный, интрамуральный компонент ≥50%",
    6: "субсерозный, интрамуральный компонент <50%",
    7: "субсерозный на ножке",
    8: "шеечный / паразитирующий / иной",
  };
  return `FIGO ${t} — ${map[t]}`;
}

/** Классификация. Возвращает null, если не хватает ветвного признака (переспросить). */
export function classifyMyomaFigo(input: MyomaFigoInput): MyomaFigoResult | null {
  const chain = ["Система FIGO 0–8: локализация → ветвной признак → тип"];
  switch (input.primaryLocation) {
    case "cervical_or_parasitic": {
      const t: MyomaFigoResult["figoType"] = 8;
      return {
        figoType: t,
        label: labelFor(t),
        category: "other",
        managementNotes: NOTES[t],
        chain,
      };
    }
    case "submucosal": {
      if (input.pedunculatedIntracavitary === true) {
        const t: MyomaFigoResult["figoType"] = 0;
        return { figoType: t, label: labelFor(t), category: "submucosal", managementNotes: NOTES[t], chain };
      }
      if (input.pedunculatedIntracavitary !== false || !input.intramuralExtension) return null;
      const t: MyomaFigoResult["figoType"] = input.intramuralExtension === "less50" ? 1 : 2;
      return { figoType: t, label: labelFor(t), category: "submucosal", managementNotes: NOTES[t], chain };
    }
    case "intramural": {
      if (typeof input.contactsEndometrium !== "boolean") return null;
      const t: MyomaFigoResult["figoType"] = input.contactsEndometrium ? 3 : 4;
      return { figoType: t, label: labelFor(t), category: "intramural", managementNotes: NOTES[t], chain };
    }
    case "subserosal": {
      if (input.pedunculatedSubserosal === true) {
        const t: MyomaFigoResult["figoType"] = 7;
        return { figoType: t, label: labelFor(t), category: "subserosal", managementNotes: NOTES[t], chain };
      }
      if (input.pedunculatedSubserosal !== false || !input.subserosalExtension) return null;
      const t: MyomaFigoResult["figoType"] = input.subserosalExtension === "ge50" ? 5 : 6;
      return { figoType: t, label: labelFor(t), category: "subserosal", managementNotes: NOTES[t], chain };
    }
    default:
      return null;
  }
}
