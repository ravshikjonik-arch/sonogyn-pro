/**
 * Учебный слой Медведева: как мерить, что значит, когда бить тревогу.
 * Используется в web FMF и mobile — помощник + учитель одновременно.
 */

export type MedvedevTeachCard = {
  title: string;
  howToMeasure: string;
  clinicalMeaning: string;
  redFlags?: string[];
  appendix?: string;
  /** id топика /reference?topic= */
  referenceTopicId?: string;
};

export const MEDVEDEV_TEACH_BY_MARKER: Record<string, MedvedevTeachCard> = {
  nt: {
    title: "ТВП (NT)",
    howToMeasure: "Сагитталь, нейтральная голова. КТР 45–84 мм. Калиперы on-to-on по внутренним контурам гиперэхогенных линий, без амниотической оболочки.",
    clinicalMeaning: "Маркер I скрининга. Интерпретация — по перцентилю Медведева (Прил. 11), не только порог 3,5 мм.",
    redFlags: [">95-го перц. или отсутствие НК — комбинированный риск хромосомопатий"],
    appendix: "Прил. 11",
    referenceTopicId: "nt",
  },
  nasalBone: {
    title: "Носовая кость",
    howToMeasure: "Срединный профиль, обе кортикальные линии. I трим.: длина ДНК; II трим.: Прил. 12.",
    clinicalMeaning: "Отсутствие или гипоплазия — маркер риска (трисомии, особенно 21).",
    redFlags: ["Не визуализируется", "Длина <5-го перцентиля"],
    appendix: "Прил. 11 / 12",
    referenceTopicId: "nt",
  },
  bpd: {
    title: "BPD (БПР)",
    howToMeasure: "Аксиально: таламус + зрительные бугры, без мозжечка. Калиперы outer-inner ⊥ к М-эхо.",
    clinicalMeaning: "Датирование во II трим. + рост. Сравнение с p5/p50/p95 для срока.",
    appendix: "Прил. 1",
    referenceTopicId: "bpd",
  },
  hc: {
    title: "HC (ОГ)",
    howToMeasure: "Тот же уровень, что BPD. Трассировка по внешнему контуру черепа.",
    clinicalMeaning: "Микро/макроцефалия, асимметрия роста. ЗВУР часто по AC/EFW, но HC важен для головы.",
    appendix: "Прил. 1",
    referenceTopicId: "hc",
  },
  ac: {
    title: "AC (ОЖ)",
    howToMeasure: "Поперечный живот: желудок + воротная вена + пупочная вена. Почки не включать.",
    clinicalMeaning: "Ключевой маркер плодового питания. <5-го или >95-го перц. — ЗВУР / макросомия.",
    redFlags: ["AC <5-го перц.", "AC >95-го перц."],
    appendix: "Прил. 1",
    referenceTopicId: "ac",
  },
  fl: {
    title: "FL (ДБ)",
    howToMeasure: "Только диафиз, без эпифизов. Угол ~90° к лучу.",
    clinicalMeaning: "Сkeletal dysplasia при extreme discordance; в ЗВУР — «спared» FL.",
    appendix: "Прил. 1",
    referenceTopicId: "fl",
  },
  efw: {
    title: "EFW (масса)",
    howToMeasure: "Hadlock III/IV из BPD, HC, AC, FL. Перцентиль — по полосам компонентов Медведева.",
    clinicalMeaning: "Итоговая оценка роста. <10-го перц. — ЗВУР; >90-го — крупный плод.",
    redFlags: ["EFW <5–10 перц.", "EFW >90–95 перц."],
    appendix: "Прил. 1 + Hadlock",
    referenceTopicId: "efw",
  },
  lateralVentricle: {
    title: "Лат. желудочки",
    howToMeasure: "Axial head: ширина atrium/atrium horn, мм. Не путать с субэpendимальными кистами.",
    clinicalMeaning: ">10 мм — вентрикуломегалия; сравнивайте и с p95 Медведева для срока.",
    redFlags: [">10 мм", ">95-го перцентиля"],
    appendix: "стр. 622 / Прил. 1",
  },
  cisternaMagna: {
    title: "Большая цистерна",
    howToMeasure: "Сагитталь/аксиаль: максимальный зазор между мозжечком и затылком.",
    clinicalMeaning: ">10 мм — mega cisterna; <2 мм — Dandy-Walker spectrum.",
    redFlags: [">10 мм", "мозжечок гипоплазирован"],
    appendix: "стр. 622",
  },
  cerebellumTransverse: {
    title: "Мозжечок (поперечный)",
    howToMeasure: "Transthalamic plane + caudal tilt: поперечный диаметр мозжечка.",
    clinicalMeaning: "Гипоплазия — Dandy-Walker, Joubert; сочетать с ККР/ПЗР (Прил. 7).",
    appendix: "Прил. 1 / 7",
  },
  corpusCallosum: {
    title: "ДМТ (мозолистое тело)",
    howToMeasure: "Срединный сагитталь: линейка от переднего рога к splenium.",
    clinicalMeaning: "Укорочение — agenesis/hypoplasia corpus callosum; нужна expert US/MRI.",
    appendix: "Прил. 5",
  },
  csp: {
    title: "ППП (CSP)",
    howToMeasure: "Axial: ширина полости между листками прозрачной перегородки.",
    clinicalMeaning: "Расширение >95-го перц. — связь с гипogenesis corpus callosum, PRO/VM.",
    redFlags: [">95-го перц.", "CSP персистирует после 36–37 нед"],
    appendix: "Прил. 10",
  },
  dvPi: {
    title: "PI венозного протока",
    howToMeasure: "I скрининг 11–14 нед: free loop DV, Прил. 40 (FMF). II/III: тот же срез, Прил. 41 (Kessler, 21+ нед).",
    clinicalMeaning: "Повышение — сердечная недостаточность, анемия, хромосомопатии (I трим.); позднее — застой, гипоксия.",
    redFlags: [">95-го перц.", "reversed a-wave в III трим."],
    appendix: "Прил. 40 / 41",
    referenceTopicId: "doppler-ob",
  },
  mcaPi: {
    title: "PI СМА",
    howToMeasure: "Средняя мозговая артерия: sample gate в systolic peak, angle ≤30°. III скрининг и допплер-контроль.",
    clinicalMeaning: "Снижение PI (<5-го перц.) — централизация; повышение — анемия, гиперволемия.",
    redFlags: ["PI <5-го перц. при нормальном UA — гипоксия", "PI >95-го перц. — анемия плода"],
    appendix: "Прил. 39",
    referenceTopicId: "doppler-ob",
  },
  mcaPsv: {
    title: "ПССК СМА",
    howToMeasure: "СМА: gate на peak systolic velocity, angle ≤30°, без fetal breathing. Медиана и порог 1,5 MoM — Прил. 38 (Mari).",
    clinicalMeaning: "PSV >1,5 MoM — подозрение на анемию плода (сочетать с PI СМА, DV, КТГ). Ниже медианы при централизации.",
    redFlags: [">1,5 MoM — анемия плода", "быстрый рост PSV в динамике"],
    appendix: "Прил. 38",
    referenceTopicId: "doppler-ob",
  },
  leftAtrium: {
    title: "Левое предсердие",
    howToMeasure: "4-камерный срез: inner-inner ширина LA в end-systole. Shapiro — p2.5/p50/p97.5.",
    clinicalMeaning: "Дilatation — ASD, AV valve disease, arrhythmia.",
    appendix: "Прил. 16",
  },
  rightAtrium: {
    title: "Правое предсердие",
    howToMeasure: "4-chamber: ширина RA. Сравнение с Shapiro для срока.",
    clinicalMeaning: "Увеличение — tricuspid regurgitation, Ebstein, total anomalous PV return.",
    appendix: "Прил. 17",
  },
  leftVentricle: {
    title: "Левый желудочек",
    howToMeasure: "4-chamber: ширина LV в end-systole, inner-inner.",
    clinicalMeaning: "Hypoplasia — HLHS spectrum; asymmetry LV/RV — coarctation.",
    appendix: "Прил. 18",
  },
  rightVentricle: {
    title: "Правый желудочек",
    howToMeasure: "4-chamber: ширина RV. Сравнить с LV.",
    clinicalMeaning: "RV dominance — pulmonary stenosis/atresia, ToF.",
    appendix: "Прил. 19",
  },
  aorta: {
    title: "Диаметр аорты",
    howToMeasure: "3-vessel view или LVOT: inner-inner aortic root.",
    clinicalMeaning: "Hypoplasia — coarctation, IAA; compare with pulmonary artery (3VT).",
    appendix: "Прил. 20",
  },
  orbitDiameter: {
    title: "Диаметр глазницы",
    howToMeasure: "Axial orbit plane: lens visible, measure orbit diameter outer-inner.",
    clinicalMeaning: "Microphthalmia / anophthalmia — syndromes, infections.",
    appendix: "Прил. 13",
  },
  thymusPerimeter: {
    title: "Периметр тимуса",
    howToMeasure: "Sagittal/coronal: trace thymus contour in 3-vessel/trachea plane area.",
    clinicalMeaning: "Hypoplasia — DiGeorge, intrauterine infection.",
    appendix: "Прил. 14",
  },
  uaRi: {
    title: "ИР артерии пуповины (UA RI)",
    howToMeasure: "Free loop пуповины, Doppler gate на всю width сосуда. Медведев — Прил. 37 (RI, не PI).",
    clinicalMeaning: "RI >95-го перц. — плацентарная недостаточность, ЗВУР; сочетать с PI СМА и DV.",
    redFlags: [">95-го перц. RI UA", "reversed end-diastolic flow"],
    appendix: "Прил. 37",
    referenceTopicId: "doppler-ob",
  },
  uaPi: {
    title: "PI артерии пуповины",
    howToMeasure: "Стандартный PI UA; в книге Медведева 2016 — таблица RI (Прил. 37), не PI. Используйте поле «ИР АП».",
    clinicalMeaning: "Повышение PI — placental insufficiency (оценка по локальным протоколам / Marsal).",
    appendix: "см. Прил. 37 (RI)",
    referenceTopicId: "doppler-ob",
  },
  uterinePiMean: {
    title: "PI маточных артерий",
    howToMeasure: "Среднее L/R на уровне cross-over с подвздошными. Срок обязателен.",
    clinicalMeaning: ">95-го перц. — риск преэклампsii / ЗВУР placentar.",
    appendix: "Прил. 36",
    referenceTopicId: "doppler-ob",
  },
  afi: {
    title: "ИАЖ (амниотический индекс)",
    howToMeasure: "Сумма 4 карманов (cm) × 10 = мм, или прямо в мм. Moore — Прил. 35.",
    clinicalMeaning: "<5-го перц. — маловодие; >95-го — многоводие. Сочетать с doppler и ростом.",
    redFlags: ["<5-го перц.", ">95-го перц.", "резкое снижение в динамике"],
    appendix: "Прил. 35",
    referenceTopicId: "doppler-ob",
  },
  placentaThickness: {
    title: "Толщина плаценты",
    howToMeasure: "Средняя толщина на периферии, не включая миометрий. Яковенко — Прил. 34.",
    clinicalMeaning: "Отклонения — плацентарная патология, ЗВУР, преэклампsia (контекст!).",
    appendix: "Прил. 34",
  },
  fingerII: {
    title: "Длина пальца II",
    howToMeasure: "Axial hand: три phalanges, mid-finger length. Tovbin — Прил. 33, 14–27 нед.",
    clinicalMeaning: "Укорочение — skeletal dysplasia, syndromes; сравнить все 5 пальцев.",
    appendix: "Прил. 33",
  },
};

export const SLICE_TEACH_BY_ID: Record<
  string,
  { teachHow: string; teachWhy: string; pitfalls?: string }
> = {
  "head-trans": {
    teachHow: "BPD plane: таламус симметричен, butterfly sign. Затем CSP и лат. желудочки.",
    teachWhy: "Базовый «трансталамический» срез — 80% находок головы.",
    pitfalls: "Наклон головы завышает BPD и лат. желудочки.",
  },
  "head-cerebellum": {
    teachHow: "От BPD plane — caudal tilt до мозжечка и cisterna magna в одной плоскости.",
    teachWhy: "Dandy-Walker, Blake pouch, vermian hypoplasia.",
  },
  "face-profile": {
    teachHow: "Median profile: nose, upper lip, chin. NB — две эchogenic lines.",
    teachWhy: "Трисомия 21: absent/hypoplastic NB; профиль — micrognathia.",
  },
  "face-orbit": {
    teachHow: "Axial orbits: lens, interocular distance. Optic tracts — coronal.",
    teachWhy: "Anophthalmia/microphthalmia, holoprosencephaly.",
  },
  "heart-4ch": {
    teachHow: "4 chambers balanced, septa intact, AV connection, regular rhythm.",
    teachWhy: "~50% сердечных ВПР видны на 4-chamber view.",
  },
  "heart-outflow": {
    teachHow: "LVOT/RVOT + 3 vessels and trachea (3VT).",
    teachWhy: "TGA, coarctation, vascular rings.",
  },
  spine: {
    teachHow: "Sagittal: skin line intact. Transverse: vertebral arches «U».",
    teachWhy: "Spina bifida, sacral agenesis.",
  },
  abdomen: {
    teachHow: "Stomach left, bladder — ниже. Cord insertion.",
    teachWhy: "Отсутствие stomach — esophageal atresia / swallowing.",
  },
};

export const SCREENING_WINDOWS_TEACH = [
  {
    id: "first",
    window: "11+0 — 13+6",
    role: "I скрининг",
    teach: "КТР, ТВП, НК, DV/TR, PI UtA. Комбинированный риск + биохимия.",
  },
  {
    id: "second",
    window: "18–22 нед",
    role: "II скrининг",
    teach: "Полная анатомия по срезам + фетометрия. Основной поиск ВПР.",
  },
  {
    id: "third",
    window: "30–34 нед",
    role: "III скрининг",
    teach: "Рост, AFI, плацента, допплер. Поздние ВПР и плацентарная недостаточность.",
  },
];

export function getTeachForMarker(marker: string): MedvedevTeachCard | null {
  const aliases: Record<string, string> = {
    nasalBoneLength: "nasalBone",
    ivVentricle: "lateralVentricle",
    piUmb: "dvPi",
    piMca: "dvPi",
    piRight: "uterinePiMean",
    piLeft: "uterinePiMean",
    uterinePiMean: "uterinePiMean",
    dvPi: "dvPi",
    mcaPi: "mcaPi",
    mcaPsv: "mcaPsv",
    uaRi: "uaRi",
    uaPi: "uaRi",
    afi: "afi",
    placentaThickness: "placentaThickness",
    fingerLengthIIMm: "fingerII",
    fingerII: "fingerII",
    orbitExtra: "orbitDiameter",
    orbitIntra: "orbitDiameter",
    thymusTransverse: "thymusPerimeter",
  };
  const key = aliases[marker] ?? marker;
  return MEDVEDEV_TEACH_BY_MARKER[key] ?? null;
}

export function getSliceTeach(sliceId: string) {
  return SLICE_TEACH_BY_ID[sliceId] ?? null;
}

/** Краткая учебная строка под алертом ассистента. */
export function teachHintForAlert(alert: string): string | null {
  const a = alert.toLowerCase();
  if (a.includes("звур") || a.includes("<5") || a.includes("10 перц")) {
    return "ЗВУР: повтор через 1–2 нед, допплер, акушер 3-го уровня. Не путать с SGA при нормальном doppler.";
  }
  if (a.includes("вентрикуломегал")) {
    return "VM: corpus callosum, TORCH, МРТ/генетика по протоколу центра.";
  }
  if (a.includes("носов")) {
    return "НК: пересмотр через 30 мин; при повторном absent NB — расширенный скрининг/кaryotype по показаниям.";
  }
  if (a.includes("плацента") || a.includes("предлеж")) {
    return "Низкая плацента: на II скрининге — осторожная формулировка (миграция). ТВ-уточнение на III.";
  }
  if (a.includes("маловод") || a.includes("многовод") || a.includes("иаж")) {
    return "ИАЖ: Moore (Прил. 35) — динамика через 48–72 ч, допплер, решение с акушером.";
  }
  if (a.includes("анеми") || a.includes("1,5 mom") || a.includes("1.5 mom") || a.includes("псск")) {
    return "Анемия плода: PSV >1,5 MoM — переливание, амниоцентез HbF, консультация гематолога/акушера по протоколу.";
  }
  if (a.includes("допплер") || a.includes("pi") || a.includes("ир ап") || a.includes("пуповин")) {
    return "Допплер: динамика через 48–72 ч, КТГ, решение с акушером о сроках родов. Медведев — ИР АП (Прил. 37), не PI.";
  }
  return null;
}
