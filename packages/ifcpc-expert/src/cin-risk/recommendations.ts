import type {
  CinRiskCalculatorInput,
  CinRiskRecommendation,
  CinRiskTierInfo,
  InvasionRiskTier,
} from "./types";

type RecInput = {
  input: CinRiskCalculatorInput;
  cin2plus: number;
  cin3plus: number;
  invasion: number;
  cin2plusTier: CinRiskTierInfo;
  invasionTier: { tier: InvasionRiskTier; labelRu: string; color: string };
  ifcpcCounts: Record<string, number>;
};

export function buildCinRiskRecommendation(ctx: RecInput): CinRiskRecommendation {
  const { input, cin2plus, cin3plus, invasion, cin2plusTier, invasionTier, ifcpcCounts } = ctx;
  const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;

  if (invasion >= 0.05 || ifcpcCounts.suspicious_invasion > 0) {
    return {
      summary: `Высокое подозрение на инвазию (${pct(invasion)}). Риск CIN2+: ${pct(cin2plus)}.`,
      urgency: invasion >= 0.15 ? "emergency" : "urgent",
      actions: [
        "Срочная прицельная биопсия (punch) + ECC при TZ2/TZ3.",
        "Гистологическое исследование без задержки.",
        "Консультация онкогинекologa при подтверждении инвазии или некrotic/exophytic картине.",
        "МРТ малого таза по показаниям при клиническом подозрении на глубокую инвазию.",
      ],
      followUp: "Не откладывать лечение при верификации инвазии; беременность — индивидуальный мультидisciplinary консенсус.",
      references: ["ASCCP 2019", "IFCPC 2011", "NCCN Cervical Cancer", "КР МЗ РФ — РШМ"],
    };
  }

  if (cin3plus >= 0.25 || input.cytology === "hsil" || input.cytology === "agc") {
    return {
      summary: `Высокий риск CIN3+/AIS (${pct(cin3plus)}). CIN2+: ${pct(cin2plus)} (${cin2plusTier.labelRu}).`,
      urgency: "urgent",
      actions: [
        "Обязательная кольпоскопически-направленная биопсия наиболее аномального участка.",
        "При CIN2+ на биопсии — excision (LEEP/conization) по ASCCP/КР РФ.",
        "При AIS — excision с negative margins; гистерectomy если margins+ / no fertility.",
        input.pregnancy
          ? "Беременность: отложенное лечение до 6–8 нед postpartum при CIN2–3 по индивидуальному протоколу."
          : "План лечения после гистологии.",
      ],
      followUp: "Ко-тест HPV/цитология 12–24 мес после лечения CIN2+.",
      references: ["ASCCP 2019", "IFCPC 2011", "Swede Score"],
    };
  }

  if (cin2plus >= 0.15 || cin2plusTier.tier === "moderate" || cin2plusTier.tier === "high") {
    return {
      summary: `Умеренный–высокий риск CIN2+ (${pct(cin2plus)}, ${cin2plusTier.labelRu}).`,
      urgency: cin2plus >= 0.35 ? "urgent" : "soon",
      actions: [
        "Прицельная биопсия под контролем кольпоскопии (Swede ≥5 или IFCPC major).",
        "При negative biopsy и HSIL цитologии — ECC / repeat colposcopy.",
        "Документировать тип TZ и полноту SCJ.",
      ],
      followUp: "Повторная кольпоскопия 6–12 мес при CIN1 или отрицательной биопсии с HSIL+ скринингом.",
      references: ["ASCCP 2019", "IFCPC 2011"],
    };
  }

  if (input.cytology === "lsil" || input.cytology === "ascus") {
    return {
      summary: `Низкий–умеренный риск CIN2+ (${pct(cin2plus)}). ASC-US/LSIL маршрут.`,
      urgency: "routine",
      actions: [
        input.hpv16Positive || input.hpv18Positive
          ? "ВПЧ 16/18+ при LSIL/ASC-US → кольпоскопия."
          : "Кольpоскопия при стойком HPV+ или ASC-US persisting.",
        "Биопсия при любых IFCPC major или Swede ≥5.",
        "Наблюдение 12 мес при типичной метаплазии и low-risk HPV.",
      ],
      followUp: "Ко-тест или цитология по ASCCP для ASC-US/LSIL.",
      references: ["ASCCP 2019"],
    };
  }

  return {
    summary: `Низкий риск значимой невроплазии. CIN2+: ${pct(cin2plus)} (${cin2plusTier.labelRu}).`,
    urgency: "routine",
    actions: [
      "Продолжить программу скрининга по возрасту (ВПЧ/цитология).",
      "Повторная кольпоскопия только при изменении скрининга или появлении IFCPC major.",
      input.immunodeficiency
        ? "Имmunocompromised: сократить интервалы наблюдения (annual)."
        : "Стандартный интервал наблюдения.",
    ],
    followUp: "Ко-тест 3–5 лет при NILM/HPV− по локальному протоколу.",
    references: ["ASCCP 2019", "WHO cervical screening"],
  };
}
