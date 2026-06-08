/**
 * Образовательные шаблоны формулировок для УЗ-протокола (аденомиоз, глубокий эндометриоз).
 * Не заменяют клинические руководства; итог всегда верифицируется врачом по изображению и анамнезу.
 */

export const UTERUS_ADENO_DIE_VERSION =
  "uterus-adeno-die-consensus v1 (образовательный CDS; ориентиры MUSA / #Enzian / consensus DIE sono)";

export type AdenomyosisUsConsensusInput = {
  globularUterus: boolean;
  asymmetricWallThickening: boolean;
  interruptedOrIllDefinedJunctionalZone: boolean;
  myometrialCystsOrLinearStriations: boolean;
  fanShapedShadowing: boolean;
  asymmetricVascularPattern: boolean;
  tendernessOnExam: boolean;
};

export type DeepEndometriosisConsensusInput = {
  uterosacralThickeningOrNodules: boolean;
  posteriorParametriumToronus: boolean;
  rectosigmoidAdhesionOrThickening: boolean;
  bladderWallLesion: boolean;
  ureterDilatationOrHydroureter: boolean;
  pouchOfDouglasTetheredKissingOvaries: boolean;
};

function countTrue(o: Record<string, boolean>): number {
  return Object.values(o).filter(Boolean).length;
}

export function evaluateAdenomyosisConsensus(input: AdenomyosisUsConsensusInput): {
  bullets: string[];
  impression: string;
  count: number;
} {
  const bullets: string[] = [];
  if (input.globularUterus) bullets.push("глобуларная конфигурация матки, асимметрия контуров");
  if (input.asymmetricWallThickening) bullets.push("асимметричное утолщение миометрия");
  if (input.interruptedOrIllDefinedJunctionalZone)
    bullets.push("нарушение/нечёткость переходной зоны миометрия–эндометрия");
  if (input.myometrialCystsOrLinearStriations)
    bullets.push("микрокистозные пространства и/или линейные эхогенные включения в миометрии");
  if (input.fanShapedShadowing) bullets.push("веерообразное затенение за миометрием");
  if (input.asymmetricVascularPattern) bullets.push("асимметричный васкулярный рисунок стенки матки");
  if (input.tendernessOnExam) bullets.push("болезненность при компрессии зондом (клинический признак)");

  const n = countTrue(input);
  const impression =
    n === 0
      ? "УЗ-признаки аденомиоза по отмеченным пунктам не выбраны."
      : n <= 2
        ? "Сочетание признаков может соответствовать лёгкой выраженности изменений миометрия на УЗИ; дифференциально — фокальная миома, постаборционные изменения."
        : n <= 4
          ? "Сочетание признаков умеренно согласуется с аденомиозом на УЗИ (ориентиры MUSA); корреляция с МРТ/клиникой по показаниям."
          : "Выраженная совокупность признаков на УЗИ в высокой степени согласуется с аденомиозом; при планировании вмешательства полезна МРТ малого таза и консультация специалиста.";

  return { bullets, impression, count: n };
}

export function evaluateDieConsensus(input: DeepEndometriosisConsensusInput): {
  sites: string[];
  impression: string;
  redFlags: string[];
  count: number;
} {
  const sites: string[] = [];
  if (input.uterosacralThickeningOrNodules) sites.push("утеро-сакральные связки — уплотнение/узловые изменения");
  if (input.posteriorParametriumToronus) sites.push("задний параметрий / торус матки — инфильтративные изменения");
  if (input.rectosigmoidAdhesionOrThickening)
    sites.push("слипчивость/утолщение ректосигмоидной области (подозрение на глубокую инвазию кишки)");
  if (input.bladderWallLesion) sites.push("вовлечение стенки мочевого пузыря на УЗИ");
  if (input.ureterDilatationOrHydroureter)
    sites.push("расширение мочеточника/гидронефроз — возможная компрессия или инфильтрация");
  if (input.pouchOfDouglasTetheredKissingOvaries)
    sites.push("фиксация органов малого таза (тугой куль-де-сак; «kissing ovaries» на УЗИ)");

  const redFlags: string[] = [];
  if (input.ureterDilatationOrHydroureter)
    redFlags.push("Учитывать урологическую симптоматику и показания к урографии/МРТ.");
  if (input.rectosigmoidAdhesionOrThickening)
    redFlags.push("При кишечной симптоматике — колопроктология/МРТ малого таза по показаниям.");
  if (input.bladderWallLesion) redFlags.push("При гематурии/урологических жалобах — уточняющее обследование.");

  const n = countTrue(input);
  const impression =
    n === 0
      ? "Локализации глубокого эндометриоза по отмеченным sono-признакам не выбраны."
      : "На УЗИ имеются признаки, совместимые с глубоким инфильтративным эндометриозом в указанных топографических зонах (Educational template по sono-маркерам DIE); уточнение объёма поражения — МРТ Enzian / хирургическая корреляция по показаниям.";

  return { sites, impression, redFlags, count: n };
}

export type CombinedUterusReportInput = {
  fibroidProtocol: string;
  adeno: AdenomyosisUsConsensusInput;
  die: DeepEndometriosisConsensusInput;
};

export function buildCombinedUterusReport(input: CombinedUterusReportInput): string {
  const ad = evaluateAdenomyosisConsensus(input.adeno);
  const di = evaluateDieConsensus(input.die);

  const blocks: string[] = [
    "МАТКА — объединённое описание (шаблон для протокола УЗИ)",
    "",
    "1) Миома (PALM-COEIN — L, FIGO leiomyoma subclassification)",
    input.fibroidProtocol.trim(),
  ];

  if (ad.count > 0) {
    blocks.push("", "2) Аденомиоз — sono-признаки (ориентиры MUSA, образовательно)");
    blocks.push(ad.bullets.map((b) => `• ${b}`).join("\n"));
    blocks.push("", `Заключение по блоку: ${ad.impression}`);
  }

  if (di.count > 0) {
    blocks.push("", "3) Глубокий инфильтративный эндометриоз (DIE) — sono-маркеры (образовательно)");
    blocks.push(di.sites.map((s) => `• ${s}`).join("\n"));
    blocks.push("", `Заключение по блоку: ${di.impression}`);
    if (di.redFlags.length) {
      blocks.push("", "Внимание:", ...di.redFlags.map((r) => `• ${r}`));
    }
  }

  if (ad.count > 0 || di.count > 0) {
    blocks.push(
      "",
      "Итог: сочетание находок на УЗИ требует клинической корреляции; при планировании хирургии или при подозрении на инвазию смежных органов рекомендуется МРТ малого таза и мультидисциплинарная оценка."
    );
  } else {
    blocks.push(
      "",
      "Итог: дополнительные патологии матки/таза по выбранным пунктам не описаны — при наличии симптомов используйте полный sono-протокол и клинический контекст."
    );
  }

  blocks.push("", `Версия шаблона: ${UTERUS_ADENO_DIE_VERSION}`);

  return blocks.join("\n");
}
