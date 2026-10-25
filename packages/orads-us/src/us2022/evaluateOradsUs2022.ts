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

const STAR =
  "Интервал можно сократить по клинике. Уменьшение ≥10–15% среднего линейного размера — наблюдение прекращают. Стабильно — УЗИ через 24 месяца от первого исследования. Рост ≥10–15% — УЗИ через 12 и 24 месяца, затем гинеколог. Смена морфологии — заново по лексикону.";
const STAR_STAR =
  "Мало данных об интервале. Стабильно — контроль через 12 и 24 месяца от первого исследования, далее по клинике. Смена морфологии — заново по лексикону.";
const MRI_NOTE =
  "МРТ с контрастом точнее для солидных образований и кист с солидным компонентом.";
const CLASSIC_FOLLOW =
  "Если стабильно — можно УЗИ через 24 месяца от первого исследования, далее по клинике. У эндометриомы риск выше после менопаузы и если она существует больше 10 лет.";
const GYN = "Клиника: гинеколог по показаниям.";

function bullets(lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

function isPost(input: OradsUs2022Input): boolean {
  return input.menopause === "postEarly" || input.menopause === "postLate";
}

/** Тактика строки Assessment Categories / Classic Benign, O-RADS US v2022. */
function managementFor(category: number, input: OradsUs2022Input): string {
  if (category === 0) return "Повторить УЗИ или МРТ.";
  if (category === 1) return "Наблюдение не требуется.";
  if (category === 5) {
    return bullets([
      "Визуализация: по протоколу онкогинеколога.",
      "Клиника: онкогинеколог.",
    ]);
  }
  if (category === 4) {
    return bullets([
      "Визуализация, один из вариантов:",
      "• УЗИ-эксперт, если доступен",
      "• МРТ со шкалой O-RADS MRI",
      "• протокол онкогинеколога",
      MRI_NOTE,
      "Клиника: гинеколог с консультацией онкогинеколога или только онкогинеколог.",
    ]);
  }
  if (category === 3) {
    return bullets([
      "Визуализация:",
      "• Если не удаляют — рассмотреть УЗИ в пределах 6 месяцев.",
      "• Если образование солидное — можно УЗИ-эксперта или МРТ со шкалой O-RADS MRI.",
      STAR_STAR,
      MRI_NOTE,
      "Клиника: гинеколог.",
    ]);
  }

  if (input.morphology === "classic") {
    return classicManagement(input);
  }

  if (input.morphology === "bilocular") {
    return bullets(["Контроль УЗИ через 6 месяцев.", STAR]);
  }

  if (
    input.morphology === "unilocular" &&
    !input.solidComponent &&
    input.innerContour === "smooth" &&
    input.sizeCm !== null
  ) {
    const size = input.sizeCm;
    if (input.cystContent === "simple") {
      if (size <= 3) {
        return input.menopause === "pre"
          ? "См. фолликул: наблюдение не требуется."
          : "Наблюдение не требуется.";
      }
      if (size <= 5) {
        return input.menopause === "pre"
          ? "Наблюдение не требуется."
          : bullets(["Контроль УЗИ через 12 месяцев.", STAR]);
      }
      return bullets(["Контроль УЗИ через 12 месяцев.", STAR]);
    }
    if (size <= 3) {
      return input.menopause === "pre"
        ? "Наблюдение не требуется."
        : bullets(["Контроль УЗИ через 12 месяцев.", STAR]);
    }
    return bullets(["Контроль УЗИ через 6 месяцев.", STAR]);
  }

  return "Ведение гинекологом по строке O-RADS US v2022 для этого дескриптора.";
}

function classicManagement(input: OradsUs2022Input): string {
  const size = input.sizeCm;
  if (input.classicType === "paraovarian" || input.classicType === "peritoneal" || input.classicType === "hydrosalpinx") {
    return bullets(["Визуализация: не требуется.", GYN]);
  }
  if (input.classicType === "hemorrhagic") {
    if (input.menopause === "pre") {
      if (size !== null && size > 5) {
        return bullets(["Контроль УЗИ через 2–3 месяца.", GYN]);
      }
      return bullets(["Наблюдение не требуется.", GYN]);
    }
    if (input.menopause === "postEarly") {
      return bullets([
        "Варианты подтверждения, образование <10 см:",
        "• УЗИ через 2–3 месяца",
        "• УЗИ-эксперт, если доступен",
        "• МРТ со шкалой O-RADS MRI",
        GYN,
      ]);
    }
  }
  if (input.classicType === "dermoid") {
    if (size !== null && size <= 3) {
      return bullets(["Можно рассмотреть контроль УЗИ через 12 месяцев.", CLASSIC_FOLLOW, GYN]);
    }
    return bullets(["Если не удаляют — контроль УЗИ через 12 месяцев.", CLASSIC_FOLLOW, GYN]);
  }
  if (input.classicType === "endometrioma") {
    if (input.menopause === "pre") {
      return bullets(["Если не удаляют — контроль УЗИ через 12 месяцев.", CLASSIC_FOLLOW, GYN]);
    }
    if (isPost(input)) {
      return bullets([
        "На первом осмотре, <10 см, варианты подтверждения:",
        "• УЗИ через 2–3 месяца",
        "• УЗИ-эксперт, если доступен",
        "• МРТ со шкалой O-RADS MRI",
        "Затем, если не удаляют — контроль УЗИ через 12 месяцев.",
        CLASSIC_FOLLOW,
        GYN,
      ]);
    }
  }
  return bullets(["См. таблицу Classic Benign Lesions.", GYN]);
}

const CLASSIC_CAVEAT =
  "Classic benign — только если дескрипторы совпали полностью. Если вид лишь похож, контроль УЗИ в пределах 3 месяцев и пересчёт по другим признакам лексикона.";

function joinWarning(current: string | undefined, next: string): string {
  return current ? `${current} ${next}` : next;
}

/** Асцит и узлы брюшины повышают только O-RADS 3 и 4. В 1–2 ищут другую причину. */
function applyExtraSigns(base: OradsUs2022Result, input: OradsUs2022Input): OradsUs2022Result {
  if (input.extraSigns === "none" || base.category === null || base.category === 0) return base;
  const sign = input.extraSigns === "ascites" ? "Асцит" : "Узелки на брюшине";
  if (base.category === 3 || base.category === 4) {
    return answer(
      5,
      `${sign} без другой явной причины повышает O-RADS ${base.category} до 5.`,
      managementFor(5, input),
      "Сначала исключите иные причины асцита и узлов брюшины.",
    );
  }
  if (base.category <= 2) {
    return {
      ...base,
      warning: joinWarning(
        base.warning,
        `${sign}: в O-RADS 1–2 этот признак сам по себе не повышает категорию до 5. Ищите другую причину.`,
      ),
    };
  }
  return {
    ...base,
    rationale: `${base.rationale} Дополнительно: ${sign.toLowerCase()}.`,
  };
}

/** ACR O-RADS US v2022 assessment categories (deterministic). */
export function evaluateOradsUs2022(input: OradsUs2022Input): OradsUs2022Result {
  return applyExtraSigns(evaluateBase(input), input);
}

function evaluateBase(input: OradsUs2022Input): OradsUs2022Result {
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

  if (input.morphology === "classic") {
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
    if (input.classicType === "endometrioma" && !input.menopause) {
      return need(["Укажите менопаузальный статус"]);
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
      CLASSIC_CAVEAT,
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
    if (!input.menopause && (input.cystContent === "simple" || input.sizeCm <= 3)) {
      return need(["Укажите менопаузальный статус"]);
    }
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
