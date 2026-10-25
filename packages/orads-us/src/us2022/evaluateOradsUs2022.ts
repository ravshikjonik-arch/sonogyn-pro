import type { ClassicTypeUs2022, OradsUs2022Input, OradsUs2022Result } from "./types";

export const ORADS_US2022_META = [
  { category: 0, risk: "Неоценимая", title: "Технически неполное исследование" },
  { category: 1, risk: "0%", title: "Нормальный яичник" },
  { category: 2, risk: "< 1%", title: "Почти наверняка доброкачественное" },
  { category: 3, risk: "1–< 10%", title: "Низкий риск злокачественности" },
  { category: 4, risk: "10–< 50%", title: "Промежуточный риск" },
  { category: 5, risk: "≥ 50%", title: "Высокий риск злокачественности" },
] as const;

const need = (missing: string[]): OradsUs2022Result => ({
  category: null,
  risk: "—",
  title: "Нужно больше данных",
  rationale: "Заполните обязательные характеристики образования.",
  management: "Категория будет рассчитана автоматически.",
  missing,
});

const answer = (
  category: 0 | 1 | 2 | 3 | 4 | 5,
  rationale: string,
  management: string,
  warning?: string,
): OradsUs2022Result => ({
  category,
  risk: ORADS_US2022_META[category].risk,
  title: ORADS_US2022_META[category].title,
  rationale,
  management,
  missing: [],
  warning,
});

function managementFor(category: number, input: OradsUs2022Input): string {
  if (category === 0) return "Повторное УЗИ или МРТ для полной характеристики образования.";
  if (category === 1) return "Стандартное наблюдение; специфического ведения образования не требуется.";
  if (category === 2) {
    if (input.morphology === "classic" && input.classicType === "hemorrhagic") {
      if (input.menopause === "pre") {
        return input.sizeCm !== null && input.sizeCm > 5
          ? "Контроль УЗИ через 2–3 месяца."
          : "Специфического наблюдения не требуется.";
      }
      if (input.menopause === "postEarly") return "Повторное УЗИ через 2–3 месяца или МРТ.";
    }
    if (
      input.morphology === "unilocular" &&
      !input.solidComponent &&
      input.innerContour === "smooth" &&
      input.cystContent === "simple" &&
      input.sizeCm !== null
    ) {
      if (input.menopause === "pre" && input.sizeCm > 5) return "Контроль УЗИ через 12 месяцев.";
      if ((input.menopause === "postEarly" || input.menopause === "postLate") && input.sizeCm > 3) {
        return "Контроль УЗИ через 12 месяцев.";
      }
      return "Специфического наблюдения не требуется.";
    }
    return "Ведение гинекологом; наблюдение зависит от типа и размера образования по O-RADS US v2022.";
  }
  if (category === 3) {
    return "Ведение гинекологом. Если операция не проводится — контроль УЗИ в течение 6 месяцев; для солидного образования рассмотреть экспертное УЗИ или O-RADS МРТ.";
  }
  if (category === 4) {
    return "Ведение гинекологом с консультацией гинеколога-онколога или направление к нему. Рассмотреть МРТ для дальнейшей оценки.";
  }
  return "Направление к гинекологу-онкологу. Рекомендованы МРТ и/или КТ для уточнения характеристик и стадирования.";
}

/** ACR O-RADS US v2022 assessment categories (deterministic). */
export function evaluateOradsUs2022(input: OradsUs2022Input): OradsUs2022Result {
  if (input.incomplete) {
    return answer(
      0,
      "Ключевые характеристики не могут быть достоверно оценены из-за технических факторов.",
      managementFor(0, input),
    );
  }
  if (!input.morphology) return need(["Выберите тип образования"]);
  if (input.morphology === "normal") {
    return answer(
      1,
      "Нет патологического образования; фолликул ≤ 3 см или типичное жёлтое тело.",
      managementFor(1, input),
    );
  }

  const isClassic = input.morphology === "classic";
  if (!isClassic && input.extraSigns !== "none") {
    const sign = input.extraSigns === "ascites" ? "Асцит" : "Узелки на брюшине";
    return answer(
      5,
      `${sign} при аднексальном образовании — критерий высокой категории риска.`,
      managementFor(5, input),
    );
  }

  if (isClassic) {
    if (!input.classicType) return need(["Выберите типичное доброкачественное образование"]);
    const extraovarian = ["paraovarian", "peritoneal", "hydrosalpinx"].includes(input.classicType);
    if (!extraovarian && input.sizeCm === null) return need(["Укажите максимальный размер"]);
    if (input.classicType === "hemorrhagic") {
      if (!input.menopause) return need(["Укажите менопаузальный статус"]);
      if (input.menopause === "postLate") {
        return {
          category: null,
          risk: "—",
          title: "Требуется переклассификация",
          rationale: "Типичная геморрагическая киста не должна встречаться в поздней постменопаузе (≥ 5 лет).",
          management: "Пересмотрите УЗ-характеристики и классифицируйте образование по фактической морфологии.",
          missing: [],
          warning: "Не присваивайте O-RADS 2 автоматически в поздней постменопаузе.",
        };
      }
    }
    const category = !extraovarian && input.sizeCm !== null && input.sizeCm >= 10 ? 3 : 2;
    const names: Record<Exclude<ClassicTypeUs2022, "">, string> = {
      dermoid: "Типичная дермоидная киста",
      endometrioma: "Типичная эндометриома",
      hemorrhagic: "Типичная геморрагическая киста",
      paraovarian: "Типичная параовариальная киста",
      peritoneal: "Типичная перитонеальная инклюзионная киста",
      hydrosalpinx: "Типичный гидросальпинкс",
    };
    const sizeRule =
      category === 3
        ? "размер ≥ 10 см"
        : extraovarian
          ? "типичное внеяичниковое образование любого размера"
          : "размер < 10 см";
    return answer(
      category,
      `${names[input.classicType]}; ${sizeRule}.`,
      managementFor(category, input),
    );
  }

  if (input.sizeCm === null || input.sizeCm <= 0) return need(["Укажите максимальный размер в сантиметрах"]);

  if (input.morphology === "solid") {
    if (input.outerContour === "irregular") {
      return answer(
        5,
        "Солидное образование (≥ 80%) с неровным наружным контуром; любой размер и васкуляризация.",
        managementFor(5, input),
      );
    }
    if (!input.colorScore) return need(["Выберите цветовую шкалу"]);
    let category: 3 | 4 | 5;
    let rationale: string;
    if (input.colorScore === 1) {
      category = 3;
      rationale = "Солидное образование с ровным наружным контуром и цветовой шкалой 1.";
    } else if (input.colorScore === 4) {
      category = 5;
      rationale = "Солидное образование с ровным наружным контуром и цветовой шкалой 4.";
    } else if (input.shadowing) {
      category = 3;
      rationale = "Солидное образование с ровным контуром, акустической тенью и цветовой шкалой 2–3.";
    } else {
      category = 4;
      rationale = "Солидное образование с ровным контуром, без акустической тени, цветовая шкала 2–3.";
    }
    return answer(category, rationale, managementFor(category, input));
  }

  if (input.solidComponent) {
    if (input.morphology === "unilocular") {
      const category = input.papillae === "4+" ? 5 : 4;
      const feature =
        input.papillae === "4+"
          ? "4 и более папиллярных разрастаний"
          : input.papillae === "1-3"
            ? "1–3 папиллярных разрастания"
            : "солидный компонент без папиллярных разрастаний";
      return answer(
        category,
        `Однокамерная киста: ${feature}; любой размер и васкуляризация.`,
        managementFor(category, input),
      );
    }
    if (!input.colorScore) return need(["Выберите цветовую шкалу"]);
    const category = input.colorScore >= 3 ? 5 : 4;
    return answer(
      category,
      `Двух- или многокамерная киста с солидным компонентом; цветовая шкала ${input.colorScore}.`,
      managementFor(category, input),
    );
  }

  if (input.innerContour === "irregular") {
    const category = input.morphology === "unilocular" ? 3 : 4;
    return answer(
      category,
      `${input.morphology === "unilocular" ? "Однокамерная" : "Двух- или многокамерная"} киста без солидного компонента с неровным внутренним контуром.`,
      managementFor(category, input),
    );
  }

  if (input.morphology === "unilocular") {
    if (input.cystContent === "simple" && !input.menopause) return need(["Укажите менопаузальный статус"]);
    let category: 1 | 2 | 3 = input.sizeCm >= 10 ? 3 : 2;
    if (input.cystContent === "simple" && input.menopause === "pre" && input.sizeCm <= 3) category = 1;
    const content = input.cystContent === "simple" ? "Простая" : "Непростая";
    return answer(
      category,
      `${content} однокамерная киста с ровным внутренним контуром, ${input.sizeCm} см.`,
      managementFor(category, input),
    );
  }

  if (input.morphology === "bilocular") {
    const category = input.sizeCm >= 10 ? 3 : 2;
    return answer(
      category,
      `Двухкамерная киста без солидного компонента с ровным внутренним контуром, ${input.sizeCm} см.`,
      managementFor(category, input),
    );
  }

  if (!input.colorScore) return need(["Выберите цветовую шкалу"]);
  const category = input.colorScore === 4 || input.sizeCm >= 10 ? 4 : 3;
  return answer(
    category,
    `Многокамерная киста без солидного компонента с ровным контуром, ${input.sizeCm} см, цветовая шкала ${input.colorScore}.`,
    managementFor(category, input),
  );
}
