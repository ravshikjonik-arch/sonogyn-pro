import rulesDoc from "../rules/clinical-decision-rules.json";
import { enrichCpiContext } from "../blocks/enrich-context";
import { evaluateClinicalRules } from "./rules-engine";
import type {
  CpiActionRecommendation,
  CpiClinicalAction,
  CpiClinicalRule,
  CpiDecisionExplanation,
  CpiDecisionResult,
  CpiGuidelineSource,
  CpiPatientInput,
  CpiRulesDocument,
} from "../types";
import { CPI_ACTION_LABELS_RU as ACTION_LABELS, CPI_DISCLAIMER as DISCLAIMER } from "../types";

const RULES = rulesDoc as CpiRulesDocument;

const ACTION_ORDER: CpiClinicalAction[] = [
  "oncology_referral",
  "conization",
  "lletz",
  "targeted_biopsy",
  "ecc",
  "repeat_colposcopy",
  "hpv_test_12mo",
  "observation",
];

const PRIORITY_RANK = { primary: 0, secondary: 1, conditional: 2 };

function sourceById(id: string): CpiGuidelineSource | undefined {
  return RULES.sources.find((s) => s.id === id);
}

function mergeActions(matched: ReturnType<typeof evaluateClinicalRules>): CpiActionRecommendation[] {
  const map = new Map<
    CpiClinicalAction,
    { priority: "primary" | "secondary" | "conditional"; rationales: string[]; ruleIds: string[]; sourceIds: Set<string> }
  >();

  for (const rule of matched) {
    for (const action of rule.actions) {
      const existing = map.get(action) ?? {
        priority: rule.actionPriority,
        rationales: [],
        ruleIds: [],
        sourceIds: new Set<string>(),
      };
      existing.rationales.push(rule.explanation);
      existing.ruleIds.push(rule.id);
      for (const sid of rule.sourceIds) existing.sourceIds.add(sid);
      if (PRIORITY_RANK[rule.actionPriority] < PRIORITY_RANK[existing.priority]) {
        existing.priority = rule.actionPriority;
      }
      map.set(action, existing);
    }
  }

  return ACTION_ORDER.filter((a) => map.has(a)).map((action) => {
    const data = map.get(action)!;
    const sources = [...data.sourceIds]
      .map((id) => sourceById(id))
      .filter((s): s is CpiGuidelineSource => Boolean(s));
    return {
      action,
      labelRu: ACTION_LABELS[action],
      priority: data.priority,
      rationale: data.rationales[0],
      sources,
      ruleIds: [...new Set(data.ruleIds)],
    };
  });
}

function buildDecisionTreePath(ctx: ReturnType<typeof enrichCpiContext>, matched: ReturnType<typeof evaluateClinicalRules>): string[] {
  const path: string[] = ["START: Cervical Pathology Intelligence"];
  path.push(`Block1 IFCPC → TZ=${ctx.input.transformationZoneTypeId}, major=${ctx.flags.ifcpcGrade2Count}, invasion=${ctx.flags.invasionSignsPresent}`);
  path.push(`Block2 HPV → ${ctx.hpv.label}`);
  path.push(`Block3 Cytology → ${ctx.input.cytology.toUpperCase()}`);
  if (ctx.flags.glandularPathway) path.push("Block4 Glandular/AIS pathway → ACTIVE");
  if (ctx.tz3Alert) path.push(`Block5 TZ3 Expert → ${ctx.tz3Alert.slice(0, 60)}…`);
  if (ctx.quality) path.push(`Block7 Quality → ${ctx.quality.score}/100 (${ctx.quality.label})`);
  path.push(
    `Block8 Risk → CIN2+ ${Math.round(ctx.risk.cin2plus * 1000) / 10}%, CIN3+ ${Math.round(ctx.risk.cin3plus * 1000) / 10}%, invasion ${Math.round(ctx.risk.invasion * 1000) / 10}%`,
  );
  for (const rule of matched.slice(0, 5)) {
    path.push(`RULE[${rule.priority}] ${rule.id} → ${rule.actions.join(", ")}`);
  }
  return path;
}

function buildExplanation(
  ctx: ReturnType<typeof enrichCpiContext>,
  matched: ReturnType<typeof evaluateClinicalRules>,
  actions: CpiActionRecommendation[],
): CpiDecisionExplanation {
  const allSourceIds = new Set<string>();
  for (const rule of matched) for (const sid of rule.sourceIds) allSourceIds.add(sid);

  const sources = [...allSourceIds]
    .map((id) => sourceById(id))
    .filter((s): s is CpiGuidelineSource => Boolean(s));

  const primary = actions.find((a) => a.priority === "primary");

  return {
    headline: primary
      ? `Рекомендуемое действие: ${primary.labelRu}`
      : "Наблюдение / скрининговый маршрут",
    narrative: [
      ctx.colposcopy.conclusion,
      ctx.tz3Alert,
      ctx.glandularAlert,
      `Комбинированный риск: ${ctx.combinedRiskBand}. CIN2+ ${Math.round(ctx.risk.cin2plus * 1000) / 10}%.`,
    ]
      .filter(Boolean)
      .join(" "),
    decisionTreePath: buildDecisionTreePath(ctx, matched),
    matchedRules: matched.map((r) => ({
      ruleId: r.id,
      titleRu: r.titleRu,
      explanation: r.explanation,
    })),
    blockSummaries: [
      {
        blockId: "block1-ifcpc",
        titleRu: "Кольpоскопия IFCPC",
        summary: ctx.colposcopy.conclusion,
        riskContribution: ctx.colposcopy.riskCategory,
      },
      {
        blockId: "block2-hpv",
        titleRu: "HPV Risk Engine",
        summary: ctx.hpv.label,
        riskContribution: ctx.hpv.riskBand,
      },
      {
        blockId: "block3-cytology",
        titleRu: "Цитология Bethesda",
        summary: `Категория: ${ctx.input.cytology.toUpperCase()}`,
      },
      {
        blockId: "block5-tz3",
        titleRu: "TZ3 Expert",
        summary: ctx.tz3Alert ?? "TZ3-алерт не активирован",
      },
      {
        blockId: "block8-risk",
        titleRu: "Risk Calculator",
        summary: `CIN2+ ${Math.round(ctx.risk.cin2plus * 1000) / 10}% · CIN3+ ${Math.round(ctx.risk.cin3plus * 1000) / 10}% · AIS ${Math.round(ctx.risk.ais * 1000) / 10}% · Инвазия ${Math.round(ctx.risk.invasion * 1000) / 10}%`,
      },
    ],
    sources,
  };
}

/**
 * ## Clinical Decision Engine — pseudocode
 *
 * ```
 * FUNCTION runCpiDecision(input):
 *   ctx = enrichCpiContext(input)           // Blocks 1–5, 7–8
 *   matched = evaluateRules(RULES, ctx)     // JSON Rules Engine, priority DESC
 *   actions = mergeActions(matched)         // dedupe + order
 *   explanation = buildExplanation(ctx, matched, actions)
 *   RETURN CpiDecisionResult
 * ```
 */
export function runCpiClinicalDecision(input: CpiPatientInput): CpiDecisionResult {
  const ctx = enrichCpiContext(input);
  const ruleCtx = {
    input: ctx.input,
    flags: ctx.flags,
    risk: ctx.risk,
    hpv: ctx.hpv,
    quality: ctx.quality ?? { score: 100, label: "N/A" },
  };

  const matched = evaluateClinicalRules(RULES.rules as CpiClinicalRule[], ruleCtx);
  const actions = mergeActions(matched);
  const explanation = buildExplanation(ctx, matched, actions);

  return {
    schema: "cpi.clinical-decision.v1",
    version: "1.0.0",
    computedAt: new Date().toISOString(),
    colposcopyConclusion: ctx.colposcopy.conclusion,
    colposcopyRiskCategory: ctx.colposcopy.riskCategory,
    hpvRiskBand: ctx.hpv.riskBand,
    combinedRiskBand: ctx.combinedRiskBand,
    tz3Alert: ctx.tz3Alert,
    glandularAlert: ctx.glandularAlert,
    qualityScore: ctx.quality?.score ?? null,
    qualityLabel: ctx.quality?.label ?? null,
    riskCin2plus: ctx.risk.cin2plus,
    riskCin3plus: ctx.risk.cin3plus,
    riskAis: ctx.risk.ais,
    riskInvasion: ctx.risk.invasion,
    actions,
    explanation,
    disclaimer: DISCLAIMER,
  };
}

export function getCpiRulesDocument(): CpiRulesDocument {
  return RULES;
}

export function getCpiGuidelineSources(): CpiGuidelineSource[] {
  return RULES.sources;
}
