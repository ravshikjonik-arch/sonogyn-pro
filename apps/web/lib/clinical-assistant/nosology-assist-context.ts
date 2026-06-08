import type { Nosology } from "@repo/nosology";
import { NOSOLOGY_ZONE_LABELS } from "@repo/nosology";

import type { ObgynNosologyCard } from "@/lib/clinical-assistant";

export type NosologyAssistContext = {
  code?: string;
  title: string;
  group?: string;
  mode?: "gynecology" | "obstetrics";
  ultrasoundFocus?: string[];
  redFlags?: string[];
  visitChecklist?: string[];
  protocolHints?: string[];
  /** FMF — парсинг КТР/БПР из голоса */
  voiceProfile?: "general" | "fmf";
};

export function nosologyAssistContextFromCard(card: ObgynNosologyCard): NosologyAssistContext {
  return {
    code: card.code,
    title: card.title,
    group: card.group,
    mode: card.mode,
    ultrasoundFocus: card.ultrasoundFocus,
    redFlags: card.redFlags,
    visitChecklist: card.visitChecklist,
    protocolHints: card.protocolTemplate,
    voiceProfile: card.mode === "obstetrics" ? "fmf" : "general",
  };
}

export function nosologyAssistContextFromNosology(n: Nosology): NosologyAssistContext {
  const exam = n.examinationScheme.checklist ?? n.examinationScheme.bullets ?? [];
  const dx = n.diagnostics.bullets ?? [];
  return {
    code: n.icd10,
    title: n.title,
    group: NOSOLOGY_ZONE_LABELS[n.zone],
    mode: "gynecology",
    ultrasoundFocus: exam.length ? exam : [n.description],
    redFlags: dx.filter((line) => /красн|срочн|экстрен|угроз|кровотеч/i.test(line)),
    visitChecklist: exam,
    protocolHints: [n.protocolTemplate, n.diagnosisLine].filter(Boolean),
    voiceProfile: "general",
  };
}

export function nosologyAssistContextForMode(mode: "gynecology" | "obstetrics"): NosologyAssistContext {
  return {
    title: mode === "gynecology" ? "Помощник врача-гинеколога" : "Помощник акушера",
    group: mode === "gynecology" ? "Гинекология" : "Акушерство",
    mode,
    ultrasoundFocus: [
      "Выберите нозологию ниже или загрузите снимок — подсказка по структуре описания.",
      "Укажите орган-мишень, размеры, эхоструктуру и сосудистый рисунок.",
    ],
    voiceProfile: mode === "obstetrics" ? "fmf" : "general",
  };
}

export function nosologyAssistContextForFmf(sectionLabel: string): NosologyAssistContext {
  return {
    code: "FMF",
    title: `FMF · ${sectionLabel}`,
    group: "Беременность",
    mode: "obstetrics",
    ultrasoundFocus: [
      "Стандартные срезы и измерения по протоколу FMF для выбранного окна.",
      "Голосом можно диктовать КТР, БПР, ТВП, PI допплера и др.",
    ],
    redFlags: [
      "Отсутствие эмбриона при плодном яйце ≥25 мм",
      "Кровотечение, боль, гиперемия шейки",
      "PI маточных артерий >95 перцентиля",
      "CL <25 мм при угрозе ПР",
    ],
    voiceProfile: "fmf",
  };
}
