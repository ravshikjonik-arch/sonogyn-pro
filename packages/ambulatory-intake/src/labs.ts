export type LabTier = "A_route" | "B_clinical" | "C_not_routine";

export type LabItem = {
  id: string;
  labelRu: string;
  tier: LabTier;
  indicationRu: string;
  goalRu: string;
  basisRu: string;
  conditionsRu: string;
  timingRu?: string;
  /** Show when these visit reasons are selected; empty = always in B/C lists */
  reasonIds?: string[];
};

export const LAB_ITEMS: LabItem[] = [
  {
    id: "lab.route.check",
    labelRu: "Сверка возраста / периодичности / критериев маршрута",
    tier: "A_route",
    indicationRu: "Профилактика / диспансеризация / ДОРЗ",
    goalRu: "Не назначить лишний объём и не пропустить предусмотренный",
    basisRu: "Действующий порядок — статус REVIEW_REQUIRED до сверки номера",
    conditionsRu: "Только если выбран профилактический / диспансерный маршрут",
    reasonIds: ["preventive", "dispensarization"],
  },
  {
    id: "lab.microscopy",
    labelRu: "Микроскопия влагалищного отделяемого",
    tier: "A_route",
    indicationRu: "Если предусмотрено применимым алгоритмом программы",
    goalRu: "Скрининг / оценка выделений по маршруту",
    basisRu: "Алгоритм диспансеризации / ДОРЗ — после сверки",
    conditionsRu: "Не рутинно вне программы без показаний",
    reasonIds: ["primary", "preventive", "dispensarization", "discharge", "cervix"],
  },
  {
    id: "lab.hpv",
    labelRu: "ВПЧ-тестирование",
    tier: "A_route",
    indicationRu: "Возраст + интервал + алгоритм скрининга",
    goalRu: "Скрининг патологии шейки",
    basisRu: "Порядок / КР скрининга шейки — сверка",
    conditionsRu: "Не всем подряд вне возраста/интервала",
    reasonIds: ["primary", "followup", "preventive", "dispensarization", "cervix"],
  },
  {
    id: "lab.cytology",
    labelRu: "Цитология шейки матки",
    tier: "A_route",
    indicationRu: "По алгоритму скрининга или результатам предыдущего теста",
    goalRu: "Скрининг CIN / РШМ",
    basisRu: "КР / порядок скрининга — сверка",
    conditionsRu: "Учитывать интервал и предыдущие результаты",
    reasonIds: ["primary", "followup", "preventive", "dispensarization", "cervix"],
  },
  {
    id: "lab.cbc",
    labelRu: "ОАК",
    tier: "B_clinical",
    indicationRu: "Кровопотеря, анемия, воспаление, предоперационно по показаниям",
    goalRu: "Оценка гемоглобина / воспаления",
    basisRu: "Клинические показания + КР темы",
    conditionsRu: "Не рутинно всем здоровым без жалоб",
    reasonIds: ["bleeding", "cycle", "aub", "myoma", "pelvic_pain"],
  },
  {
    id: "lab.ferritin",
    labelRu: "Ферритин",
    tier: "B_clinical",
    indicationRu: "Подозрение на железодефицит / меноррагия",
    goalRu: "Оценка запасов железа",
    basisRu: "Клинические показания",
    conditionsRu: "Не скрининг «на всякий случай»",
    reasonIds: ["bleeding", "cycle", "myoma"],
  },
  {
    id: "lab.tsh",
    labelRu: "ТТГ",
    tier: "B_clinical",
    indicationRu: "Клиника гипо/гипертиреоза, бесплодие/цикл по показаниям",
    goalRu: "Исключение тиреоидной патологии",
    basisRu: "Клинические показания / КР темы",
    conditionsRu: "Не всем подряд",
    reasonIds: ["cycle", "infertility", "preconception"],
  },
  {
    id: "lab.prolactin",
    labelRu: "Пролактин",
    tier: "B_clinical",
    indicationRu: "Галакторея, аменорея, подозрение на гиперпролактинемию",
    goalRu: "Диагностика гиперпролактинемии",
    basisRu: "Клинические показания",
    conditionsRu: "Не рутинная панель «гормоны»",
    reasonIds: ["cycle", "infertility"],
  },
  {
    id: "lab.gonadotropins",
    labelRu: "ФСГ / ЛГ / эстрадиол",
    tier: "B_clinical",
    indicationRu: "Аменорея, подозрение на ПНЯ, бесплодие — по дню цикла",
    goalRu: "Оценка оси гипоталамус–гипофиз–яичники",
    basisRu: "Клинические показания",
    conditionsRu: "Срок/фаза цикла критичны",
    timingRu: "По дню цикла, если влияет на интерпретацию",
    reasonIds: ["cycle", "infertility", "menopause"],
  },
  {
    id: "lab.hcg",
    labelRu: "β-ХГЧ",
    tier: "B_clinical",
    indicationRu: "Исключение беременности при кровотечении/боли/задержке",
    goalRu: "Исключение беременности / внематочной",
    basisRu: "Клиническая безопасность",
    conditionsRu: "Приоритет при красных флагах",
    reasonIds: ["bleeding", "pelvic_pain", "cycle", "pregnancy"],
  },
  {
    id: "lab.glucose",
    labelRu: "Глюкоза / HbA1c",
    tier: "B_clinical",
    indicationRu: "СПКЯ, ожирение, планирование беременности, симптомы",
    goalRu: "Скрининг нарушений углеводного обмена",
    basisRu: "Клинические показания",
    conditionsRu: "Не всем без факторов риска",
    reasonIds: ["pcos", "preconception", "pregnancy", "menopause"],
  },
  {
    id: "lab.ua",
    labelRu: "Общий анализ мочи",
    tier: "B_clinical",
    indicationRu: "Дизурия, беременность по маршруту, системные симптомы",
    goalRu: "Исключение ИМП / протеинурии по ситуации",
    basisRu: "Клинические показания / акушерский маршрут",
    conditionsRu: "По показаниям",
    reasonIds: ["pregnancy", "pelvic_pain", "discharge"],
  },
  {
    id: "lab.pcr",
    labelRu: "ПЦР/NAAT на конкретные ИППП",
    tier: "B_clinical",
    indicationRu: "Клиника / контакт / скрининг по показаниям",
    goalRu: "Этиологическая диагностика",
    basisRu: "КР по ИППП",
    conditionsRu: "Целевые патогены, не «панель на 20» без основания",
    reasonIds: ["sti", "discharge", "pid", "infertility"],
  },
  {
    id: "lab.tumor_markers_routine",
    labelRu: "Онкомаркеры «всем подряд»",
    tier: "C_not_routine",
    indicationRu: "Не рекомендовано рутинно без клинического основания",
    goalRu: "—",
    basisRu: "Избегать гипердиагностики",
    conditionsRu: "Не отмечать как выполненное назначение без показаний",
  },
  {
    id: "lab.hormone_panel_all",
    labelRu: "Расширенная гормональная панель без показаний",
    tier: "C_not_routine",
    indicationRu: "Не рутинно",
    goalRu: "—",
    basisRu: "Назначения только при основании",
    conditionsRu: "См. tier B для точечных тестов",
  },
  {
    id: "lab.wide_pcr",
    labelRu: "Расширенные ПЦР-панели без показаний",
    tier: "C_not_routine",
    indicationRu: "Не рутинно",
    goalRu: "—",
    basisRu: "Целевое тестирование",
    conditionsRu: "Использовать NAAT по показаниям",
  },
];

export function labsForReasons(reasonIds: string[]): {
  route: LabItem[];
  clinical: LabItem[];
  notRoutine: LabItem[];
} {
  const set = new Set(reasonIds);
  const match = (item: LabItem) => {
    if (!item.reasonIds || item.reasonIds.length === 0) return true;
    return item.reasonIds.some((id) => set.has(id));
  };
  return {
    route: LAB_ITEMS.filter((i) => i.tier === "A_route" && match(i)),
    clinical: LAB_ITEMS.filter((i) => i.tier === "B_clinical" && match(i)),
    notRoutine: LAB_ITEMS.filter((i) => i.tier === "C_not_routine"),
  };
}
