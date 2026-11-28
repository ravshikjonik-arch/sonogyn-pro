/**
 * toolRegistry — реестр инструментов «клинического мозга» (изменение №8, этап 1).
 * Все встроенные инструменты сидят на детерминированных движках этого пакета;
 * новые нозологии (orads-us, tirads-acr, birads-us, iota-models и т.д.) подключаются
 * через registerTool() без изменения ядра — 3 артефакта: движок + knowledge-пак + тул.
 */
import { bishopScore } from "./bishop.js";
import { assessVbacPreLabor } from "./vbac.js";
import { estimateFetalWeight } from "./estimatedFetalWeight.js";
import { fmfScreening } from "./fmfScreening.js";
import { classifyMyomaFigo, FIGO_CITATION } from "./myomaFigo.js";
import { cerebroplacentalRatio, datingFromCrl, ntReference } from "./fmfAssessment.js";
import { STANDARD_DISCLAIMER, validateSlots } from "./toolContract.js";
import type {
  CalcContract,
  Citation,
  SlotSpec,
  ToolDefinition,
  ToolFailure,
  ToolResult,
} from "./toolContract.js";

const FMF_COURSE: Citation = {
  organization: "FMF",
  document: "The 11-13 weeks scan (курс Fetal Medicine Foundation, fetalmedicine.org)",
  year: 2026,
  status: "учебный пересказ фактов курса, не оригинальный текст",
  url: "https://fetalmedicine.org",
};

const CIT_DATING: Citation = {
  organization: "LOINC",
  document: "LOINC 11914-9 · Robinson & Fleming 1975 — формула срока по КТР",
  year: 1975,
  status: "официальная формула",
};

const CIT_NT: Citation[] = [
  {
    organization: "Wright et al.",
    document: "Ultrasound Obstet Gynecol 2008 — mixture model, калибровка NT-центилей",
    year: 2008,
    status: "публикация",
  },
  {
    organization: "NHS FASP",
    document: "PMC3104819 — медианы NT по срокам (якоря фитирования)",
    year: 2011,
    status: "публикация",
  },
];

const CIT_BISHOP: Citation = {
  organization: "E.H. Bishop",
  document: "Am J Obstet Gynecol 1964;90:831 — оригинальная шкала зрелости шейки",
  year: 1964,
  status: "классическая шкала",
};

const CIT_VBAC: Citation = {
  organization: "Gracias et al.",
  document: "Obstet Gynecol 2004 — калибровка модели прогноза VBAC",
  year: 2004,
  status: "публикация",
};

const CIT_EFW: Citation = {
  organization: "Hadlock et al.",
  document: "1985 — формула EFW по БПД/ОГ/ОЖ/ДБ (Hadlock IV)",
  year: 1985,
  status: "публикация",
};

const CIT_CPR: Citation = {
  organization: "ISUOG / FMF",
  document: "практика интерпретации CPR (MCA PI / UA PI) — учебный пересказ",
  year: 2026,
  status: "порог 1.0/0.7/0.6 — общепринятая интерпретация, решение за врачом",
};

const S = (
  name: string,
  type: SlotSpec["type"],
  description: string,
  required = true,
  unit?: string,
  options?: Array<string | number>,
): SlotSpec => ({ name, type, description, required, unit, options });

/* eslint-disable @typescript-eslint/no-explicit-any */
function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

const TOOL_DEFS: ToolDefinition[] = [
  {
    id: "obstetrics_dating_crl",
    nosology: "obstetrics",
    title: "Срок беременности по КТР",
    keywords: ["ктр", "crl", "срок", "dating", "гестационный"],
    slots: [S("crlMm", "number", "КТР — копчико-теменной размер", true, "мм")],
    run: (s) => {
      const r = datingFromCrl(s.crlMm as number);
      return {
        ok: true,
        result: asObject(r),
        chain: ["GA(дни) = 8.052·√CRL(мм) + 23.73 · округление до дня"],
        citations: [CIT_DATING, FMF_COURSE],
        disclaimer: STANDARD_DISCLAIMER,
      };
    },
  },
  {
    id: "obstetrics_nt_reference",
    nosology: "obstetrics",
    title: "NT-центили и MoM",
    keywords: ["nt", "твп", "центиль", "мом", "99-й"],
    slots: [
      S("crlMm", "number", "КТР", true, "мм"),
      S("ntMm", "number", "измеренная NT (необязательно — тогда только референсы)", false, "мм"),
    ],
    run: (s) => {
      const r = ntReference(s.crlMm as number, s.ntMm as number | undefined);
      return {
        ok: true,
        result: asObject(r),
        chain: ["log10(median NT) = f(CRL) — калибровка по Wright 2008 + NHS-якоря; MoM = NT/median; z-оценка в log10-пространстве"],
        citations: CIT_NT,
        disclaimer: STANDARD_DISCLAIMER,
      };
    },
  },
  {
    id: "obstetrics_cpr",
    nosology: "obstetrics",
    title: "Цереброплацентарное отношение (CPR)",
    keywords: ["cpr", "цпо", "мка", "пка", "допплер", "brain-sparing"],
    slots: [
      S("uaPi", "number", "PI пупочной артерии", true),
      S("mcaPi", "number", "PI средней мозговой артерии", true),
    ],
    run: (s) => {
      const r = cerebroplacentalRatio(s.uaPi as number, s.mcaPi as number);
      return {
        ok: true,
        result: asObject(r),
        chain: ["CPR = MCA PI / UA PI · бэнды: ≥1.0 норма; 0.7–1.0 пограничный; 0.6–0.7 снижен; <0.6 выраженно снижен"],
        citations: [CIT_CPR],
        disclaimer: STANDARD_DISCLAIMER,
      };
    },
  },
  {
    id: "obstetrics_fmf_screening",
    nosology: "obstetrics",
    title: "FMF-скрининг 11–13 нед: риск Т21/Т18/Т13",
    keywords: ["fmf", "скрининг", "трисомия", "т21", "down", "risk", "pappa", "b-hcg"],
    slots: [
      S("ageYears", "number", "возраст пациентки", true, "лет"),
      S("gestationalWeeks", "number", "гестационный срок", true, "нед"),
      S("ntMm", "number", "NT", true, "мм"),
      S("fetalHeartRateBpm", "number", "ЧСС плода", true, "уд/мин"),
      S("nasalBone", "enum", "носовая кость", true, undefined, ["present", "absent"]),
      S("ductusVenosusAWave", "enum", "a-волна венозного протока", true, undefined, ["normal", "reversed"]),
      S("tricuspidRegurgitation", "boolean", "трикуспидальная регургитация", true),
      S("freeBetaHcgMom", "number", "свободный β-hCG, MoM", true),
      S("pappaMom", "number", "PAPP-A, MoM", true),
    ],
    run: (s) => {
      const r = fmfScreening(s as never);
      const plain = asObject(r);
      return {
        ok: true,
        result: plain,
        chain: Array.isArray(plain.chain) ? (plain.chain as string[]) : undefined,
        citations: [FMF_COURSE],
        disclaimer: STANDARD_DISCLAIMER,
        redFlags: Array.isArray(plain.redFlags)
          ? (plain.redFlags as Array<{ code?: string }>).map((f) => String(f.code ?? ""))
          : undefined,
      };
    },
  },
  {
    id: "obstetrics_bishop_score",
    nosology: "obstetrics",
    title: "Шкала Бишопа (готовность шейки к родам)",
    keywords: ["bishop", "шишка", "индукция", "зрелость шейки"],
    slots: [
      S("dilation", "enum", "раскрытие, баллы", true, undefined, [0, 1, 2, 3]),
      S("effacement", "enum", "сглаженность, баллы", true, undefined, [0, 1, 2, 3]),
      S("station", "enum", "предлежащая часть, баллы", true, undefined, [0, 1, 2, 3]),
      S("consistency", "enum", "консистенция, баллы", true, undefined, [0, 1, 2]),
      S("position", "enum", "позиция, баллы", true, undefined, [0, 1, 2]),
    ],
    run: (s) => {
      const r = bishopScore(s as never);
      const plain = asObject(r);
      return {
        ok: true,
        result: plain,
        chain: ["сумма баллов 5 признаков · ≥6 — благоприятная шейка"],
        citations: [CIT_BISHOP],
        disclaimer: STANDARD_DISCLAIMER,
      };
    },
  },
  {
    id: "obstetrics_vbac_pre",
    nosology: "obstetrics",
    title: "Прогноз успешных родов после КС (VBAC/TOLAC, до родов)",
    keywords: ["vbac", "tolac", "рубец", "кс", "единые роды"],
    slots: [
      S("singleLtcs", "boolean", "однократное поперечное КС", true),
      S("nonRecurringIndication", "boolean", "показание к прошлому КС нерекуррентное", true),
      S("priorVaginalBirth", "boolean", "были вагинальные роды", true),
      S("interval18Months", "boolean", "интервал от КС ≥18 мес", true),
      S("noMacrosomiaSuspected", "boolean", "макросомии не предполагается", true),
      S("cephalicSingleton", "boolean", "одноплодие, головное", true),
      S("noPlacentaPrevia", "boolean", "нет previa/vasa previa", true),
      S("noClassicalScar", "boolean", "нет классического рубца", true),
      S("noUterineRuptureHistory", "boolean", "нет разрыва матки/≥2 рубцов", true),
      S("continuousMonitoringAvailable", "boolean", "доступен непрерывный CTG и экстренное КС", true),
    ],
    run: (s) => {
      const r = assessVbacPreLabor(s as never);
      const plain = asObject(r);
      return {
        ok: true,
        result: plain,
        chain: ["балльная модель по 10 предикторам · категория + допуск к TOLAC"],
        citations: [CIT_VBAC],
        disclaimer: STANDARD_DISCLAIMER,
      };
    },
  },
  {
    id: "obstetrics_efw_hadlock",
    nosology: "obstetrics",
    title: "Расчётная масса плода (Hadlock IV)",
    keywords: ["вес плода", "efw", "hadlock", "фетометрия", "масса"],
    slots: [
      S("bpdMm", "number", "БПД", false, "мм"),
      S("hcMm", "number", "окружность головы", false, "мм"),
      S("acMm", "number", "окружность живота", false, "мм"),
      S("flMm", "number", "ДБ — длина бедра", false, "мм"),
    ],
    run: (s) => {
      const r = estimateFetalWeight(s as never);
      if (!r) return null;
      const plain = asObject(r);
      return {
        ok: true,
        result: plain,
        chain: [`формула ${String(plain.formula)} · граммовка расчётная, не диагноз`],
        citations: [CIT_EFW],
        disclaimer: STANDARD_DISCLAIMER,
      };
    },
  },
  {
    id: "uterus_myoma_figo",
    nosology: "uterus",
    title: "Классификация миомы матки по FIGO (типы 0–8)",
    keywords: ["миом", "figo", "узел", "матка", "интрамуральн", "субсерозн", "подслизист"],
    slots: [
      S("primaryLocation", "enum", "локализация узла", true, undefined, [
        "submucosal",
        "intramural",
        "subserosal",
        "cervical_or_parasitic",
      ]),
      S("pedunculatedIntracavitary", "boolean", "подслизистый: на ножке внутри полости? (тип 0)", false),
      S("intramuralExtension", "enum", "подслизистый: интрамуральное распространение", false, undefined, ["less50", "ge50"]),
      S("contactsEndometrium", "boolean", "интрамуральный: контакт с эндометрием?", false),
      S("pedunculatedSubserosal", "boolean", "субсерозный: на ножке?", false),
      S("subserosalExtension", "enum", "субсерозный: интрамуральное распространение", false, undefined, ["less50", "ge50"]),
    ],
    run: (s) => {
      const r = classifyMyomaFigo(s as never);
      if (!r) return null;
      return {
        ok: true,
        result: asObject(r),
        chain: r.chain,
        citations: [FIGO_CITATION as unknown as Citation],
        disclaimer: STANDARD_DISCLAIMER,
      };
    },
  },
];

const registry = new Map<string, ToolDefinition>();
for (const t of TOOL_DEFS) registry.set(t.id, t);

/** Расширение реестра новыми нозологиями (adnexa/breast/thyroid/uterus...). */
export function registerTool(tool: ToolDefinition): void {
  if (registry.has(tool.id)) {
    throw new Error(`tool id already registered: ${tool.id}`);
  }
  registry.set(tool.id, tool);
}

export function getTool(id: string): ToolDefinition | undefined {
  return registry.get(id);
}

export function listTools(): ToolDefinition[] {
  return [...registry.values()];
}

export function listToolIds(): string[] {
  return [...registry.keys()];
}

/** runTool — валидация слотов по контракту и запуск движка. */
export function runTool(id: string, slots: Record<string, unknown>): ToolResult | ToolFailure {
  const tool = registry.get(id);
  if (!tool) {
    return { ok: false, error: "unknown_tool", message: `Инструмент не найден: ${id}` };
  }
  const check = validateSlots(tool, slots);
  if (!check.ok) {
    return { ok: false, error: check.error, message: check.message, missingSlots: check.missingSlots };
  }
  const result = tool.run(check.value);
  if (!result) {
    return {
      ok: false,
      error: "insufficient_slots",
      message: "Данных недостаточно для расчёта (движок вернул null) — запросить дополнительные измерения.",
    };
  }
  return result;
}

/** buildContract — финальный ответ ассистента по единому контракту. */
export function buildContract(
  outcome: ToolResult | ToolFailure,
  opts: { tool?: string; slots?: Record<string, unknown>; intent?: CalcContract["intent"]; notes?: string[] } = {},
): CalcContract {
  if (outcome.ok) {
    return {
      intent: opts.intent ?? "calculate",
      tool: opts.tool,
      slots: opts.slots,
      result: outcome.result,
      chain: outcome.chain,
      citations: outcome.citations,
      disclaimer: outcome.disclaimer,
      notes: opts.notes,
    };
  }
  return {
    intent: opts.intent ?? "calculate",
    tool: opts.tool,
    slots: opts.slots,
    citations: [],
    disclaimer: STANDARD_DISCLAIMER,
    missingSlots: outcome.missingSlots,
    notes: [outcome.message, ...(opts.notes ?? [])],
  };
}
