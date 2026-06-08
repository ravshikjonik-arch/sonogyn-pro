import type { IdeaFormValues } from "./schema";
import {
  boolRu,
  ruAdnexaLine,
  ruDiagramRegions,
  ruMobility,
  ruNoduleLine,
  ruSlidingLine,
  ruUterusLine,
  severityRu,
} from "./idea-labels-ru";
import { calculateEndometriosisScore, type ScoreResult } from "./scoring";

export type GeneratedReport = {
  ultrasoundFindingsSummary: { stepId: string; title: string; bullets: string[]; abnormal: boolean }[];
  impressionAuto: string;
  riskSummary: ScoreResult;
  surgicalPlanningNotes: string[];
};

function fmtTenderness(
  present: boolean,
  sev: "mild" | "moderate" | "severe" | undefined,
): string {
  if (!present) return boolRu(false);
  return sev ? `${boolRu(true)} (${severityRu[sev]})` : boolRu(true);
}

/**
 * Правило-ориентированное текстовое резюме. Требуется клиническая корреляция — не самостоятельный диагноз.
 */
export function buildIdeaReport(data: IdeaFormValues): GeneratedReport {
  const score = calculateEndometriosisScore(data);

  const s1 = data.step1;
  const step1Abnormal =
    s1.uterus.adenomyosisSuspicion ||
    s1.adnexaLeft.endometriomaPresent ||
    s1.adnexaRight.endometriomaPresent ||
    s1.uterus.myometrium === "heterogeneous" ||
    s1.uterus.size === "enlarged";

  const step1Bullets = [ruUterusLine(s1.uterus), ruAdnexaLine("справа", s1.adnexaRight), ruAdnexaLine("слева", s1.adnexaLeft)];
  if (s1.freeTextComment.trim()) step1Bullets.push(`Комментарий: ${s1.freeTextComment.trim()}`);

  const s2 = data.step2;
  const step2Abnormal =
    s2.softMarkers.tendernessOnProbePalpation ||
    s2.softMarkers.fixedOvaries ||
    s2.softMarkers.peritonealFluid ||
    s2.ovarianMobilityLeft !== "mobile" ||
    s2.ovarianMobilityRight !== "mobile" ||
    Object.values(s2.siteTenderness).some((x) => x.present);

  const step2Bullets = [
    `Мягкие маркеры: болезненность при пальпации датчиком — ${boolRu(s2.softMarkers.tendernessOnProbePalpation)}; фиксация яичников — ${boolRu(s2.softMarkers.fixedOvaries)}; свободная жидкость в полости малого таза — ${boolRu(s2.softMarkers.peritonealFluid)}.`,
    `Подвижность яичников: справа — ${ruMobility(s2.ovarianMobilityRight)}; слева — ${ruMobility(s2.ovarianMobilityLeft)}.`,
    `Локальная болезненность — куль-де-ак: ${fmtTenderness(s2.siteTenderness.pouchOfDouglas.present, s2.siteTenderness.pouchOfDouglas.severity)}; крестцово-маточные связки справа/слева: ${fmtTenderness(s2.siteTenderness.uterosacralRight.present, s2.siteTenderness.uterosacralRight.severity)} / ${fmtTenderness(s2.siteTenderness.uterosacralLeft.present, s2.siteTenderness.uterosacralLeft.severity)}; дно пузыря: ${fmtTenderness(s2.siteTenderness.bladderBase.present, s2.siteTenderness.bladderBase.severity)}.`,
  ];

  const s3 = data.step3;
  const step3Abnormal = Object.values(s3.slidingSign).some((v) => v !== "present");
  const step3Bullets = [ruSlidingLine(s3.slidingSign), ruDiagramRegions(s3.diagramSelectedRegionIds)];

  const s4 = data.step4;
  const step4Abnormal = s4.nodules.length > 0;
  const step4Bullets =
    s4.nodules.length === 0
      ? ["Узлы глубокого эндометриоза в листе не отмечены."]
      : s4.nodules.map((n, i) => ruNoduleLine(n, i));

  const parts: string[] = [];
  if (s1.adnexaLeft.endometriomaPresent || s1.adnexaRight.endometriomaPresent) {
    const l = s1.adnexaLeft.endometriomaPresent;
    const r = s1.adnexaRight.endometriomaPresent;
    let side = "";
    if (l && r) side = "с двух сторон";
    else if (l) side = "слева";
    else if (r) side = "справа";
    parts.push(`УЗИ-картина эндометриомы яичника (${side}). Клиническая корреляция и динамика наблюдения — по протоколу.`);
  }
  if (step3Abnormal) {
    parts.push(
      "Изменения признака скольжения повышают подозрение на глубокий инфильтрирующий эндометриоз; рекомендуется сопоставление с клиникой и при необходимости МРТ малого таза (по показаниям).",
    );
  }
  if (s4.nodules.some((n) => n.location === "rectovaginal_septum")) {
    parts.push(
      "Отмечены узлы в проекции ректовагинальной перегородки — важно оценить вовлечение кишки и планирование объёма резекции (мультидисциплинарно).",
    );
  }
  if (parts.length === 0) {
    parts.push(
      "Структурированный лист IDEA заполнен; по правилам модуля выраженных «красных флагов» не выявлено. Заключение и тактика — по клиническим рекомендациям и очному осмотру.",
    );
  }

  const impressionAuto = parts.join(" ");

  const surgicalPlanningNotes: string[] = [];
  if (score.structuresAtRisk.length) {
    surgicalPlanningNotes.push(`Структуры, на которые указывает карта узлов: ${score.structuresAtRisk.join("; ")}.`);
  }
  if (score.recommendMri) {
    surgicalPlanningNotes.push(
      "Рассмотреть дооперационную МРТ малого таза при подозрении на мультикомпартментное вовлечение (мочеточники, кишка).",
    );
  }
  if (s2.softMarkers.fixedOvaries) {
    surgicalPlanningNotes.push(
      "При фиксации яичников и риске вовлечения соседних органов — обсудить объём хирургического доступа в мультидисциплинарном формате.",
    );
  }

  return {
    ultrasoundFindingsSummary: [
      { stepId: "1", title: "Матка и придатки", bullets: step1Bullets, abnormal: step1Abnormal },
      { stepId: "2", title: "Мягкие маркеры и подвижность", bullets: step2Bullets, abnormal: step2Abnormal },
      { stepId: "3", title: "Признак скольжения", bullets: step3Bullets, abnormal: step3Abnormal },
      { stepId: "4", title: "Узлы глубокого эндометриоза", bullets: step4Bullets, abnormal: step4Abnormal },
    ],
    impressionAuto,
    riskSummary: score,
    surgicalPlanningNotes,
  };
}

export function mergeImpression(auto: string, manual: string): string {
  const m = manual.trim();
  return m.length > 0 ? m : auto;
}
