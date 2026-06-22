import type { FetalAnatomyViewId } from "./types";

export type FetalAnatomyGlossaryEntry = {
  term: string;
  aliases?: string[];
  definition: string;
  relatedViewIds?: FetalAnatomyViewId[];
};

export const FETAL_ANATOMY_GLOSSARY: FetalAnatomyGlossaryEntry[] = [
  {
    term: "CSP",
    aliases: ["Cavum septi pellucidi", "ППП"],
    definition: "Прозрачная перегородка между латеральными ventricles; отсутствие — маркер ACC/HPE.",
    relatedViewIds: ["view-05-transthalamic"],
  },
  {
    term: "ACC",
    aliases: ["Agenesis of corpus callosum", "АМТ"],
    definition: "Агенезия мозолистого тела; на УЗИ — absent CSP, colpocephaly, parallel ventricles.",
    relatedViewIds: ["view-05-transthalamic"],
  },
  {
    term: "Lemon sign",
    aliases: ["Признак «лимона»"],
    definition: "Frontal scalloping черепа — маркер open spina bifida (views 4–5).",
    relatedViewIds: ["view-04-transventricular", "view-05-transthalamic"],
  },
  {
    term: "Banana sign",
    aliases: ["Признак «банана»"],
    definition: "Anterior curvature cerebellum — Chiari II / open spina bifida (view 6).",
    relatedViewIds: ["view-06-transcerebellar"],
  },
  {
    term: "4CV",
    aliases: ["Four-chamber view", "4-камерный срез"],
    definition: "Апикальный или латеральный срез четырёх камер сердца (views 7a, 7b).",
    relatedViewIds: ["view-07a-apical-four-chamber", "view-07b-lateral-four-chamber"],
  },
  {
    term: "3VT",
    aliases: ["Three-vessel trachea view", "3 сосуда и трахея"],
    definition: "Срез верхнего средостения: PA, aorta, SVC; trachea posterior (view 10).",
    relatedViewIds: ["view-10-three-vessel-trachea"],
  },
  {
    term: "LVOT",
    aliases: ["Left ventricular outflow tract"],
    definition: "Выходной тракт ЛЖ → aorta (view 8).",
    relatedViewIds: ["view-08-lvot"],
  },
  {
    term: "RVOT",
    aliases: ["Right ventricular outflow tract"],
    definition: "Выходной тракт ПЖ → pulmonary artery (view 9).",
    relatedViewIds: ["view-09-rvot"],
  },
  {
    term: "SUA",
    aliases: ["Single umbilical artery", "ЕАП"],
    definition: "Единственная пупочная артерия — одна артерия lateral to bladder (view 14).",
    relatedViewIds: ["view-14-bladder-arteries"],
  },
  {
    term: "LUTO",
    aliases: ["Lower urinary tract obstruction", "Обструкция НМП"],
    definition: "Obstruction нижних мочевыводящих путей; megacystis, oligohydramnios (views 3, 14).",
    relatedViewIds: ["view-14-bladder-arteries"],
  },
  {
    term: "BRA",
    aliases: ["Bilateral renal agenesis", "Двусторонняя агенезия почек"],
    definition: "Отсутствие обеих почек; Potter sequence; absent bladder (views 13, 14).",
    relatedViewIds: ["view-13-kidneys", "view-14-bladder-arteries"],
  },
  {
    term: "ARPKD",
    aliases: ["Autosomal recessive polycystic kidney disease"],
    definition: "Эхогенные увеличенные kidneys с cystic change; oligohydramnios (view 13).",
    relatedViewIds: ["view-13-kidneys"],
  },
  {
    term: "MCDK",
    aliases: ["Multicystic dysplastic kidney"],
    definition: "Non-functioning kidney — cluster cysts без central pelvis (view 13).",
    relatedViewIds: ["view-13-kidneys"],
  },
  {
    term: "CDH",
    aliases: ["Congenital diaphragmatic hernia", "Диафрагмальная грыжа"],
    definition: "Abdominal organs in chest; mediastinal shift (view 3 coronal trunk).",
    relatedViewIds: ["view-03-trunk-coronal"],
  },
  {
    term: "Double bubble",
    aliases: ["Два пузыря"],
    definition: "Stomach + proximal duodenum — duodenal atresia (view 11).",
    relatedViewIds: ["view-11-umbilical-vein"],
  },
  {
    term: "CAPV",
    aliases: ["Cardiac axis", "КАПРВ", "Ось сердца"],
    definition: "Положение apex сердца; норма ~45° leftward (views 3, 7a).",
    relatedViewIds: ["view-03-trunk-coronal", "view-07a-apical-four-chamber"],
  },
  {
    term: "HLHS",
    aliases: ["Hypoplastic left heart syndrome", "ГЛОС"],
    definition: "Гипоплазия левых отделов; small LV/aorta (views 7a, 10).",
    relatedViewIds: ["view-07a-apical-four-chamber"],
  },
  {
    term: "TGA",
    aliases: ["Transposition of great arteries", "ТМС"],
    definition: "Discordant ventriculo-arterial connections; parallel great vessels.",
    relatedViewIds: ["view-08-lvot", "view-09-rvot", "view-10-three-vessel-trachea"],
  },
  {
    term: "TOF",
    aliases: ["Tetralogy of Fallot", "Тетрада Фалло"],
    definition: "VSD + overriding aorta + RVOT obstruction + RV hypertrophy.",
    relatedViewIds: ["view-09b-crossing-outflow"],
  },
  {
    term: "SCT",
    aliases: ["Sacrococcygeal teratoma", "ККТ"],
    definition: "Mixed mass at sacrum; vascular on Doppler (views 1, overview-2).",
    relatedViewIds: ["view-01-spine-sagittal", "overview-2"],
  },
  {
    term: "Overview-2",
    aliases: ["Движение 2", "Movement scan 2"],
    definition: "Transverse sweep neck → sacrum; vertebra-by-vertebra spine review.",
    relatedViewIds: ["overview-2"],
  },
];

export function searchGlossary(query: string): FetalAnatomyGlossaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return FETAL_ANATOMY_GLOSSARY;
  return FETAL_ANATOMY_GLOSSARY.filter((e) => {
    const hay = [e.term, ...(e.aliases ?? []), e.definition].join(" ").toLowerCase();
    return hay.includes(q);
  });
}
