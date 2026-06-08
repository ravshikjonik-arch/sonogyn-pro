import { hadlockEfwGrams } from "./fmfMath";

type VoiceOut = {
  data: Record<string, number | boolean | string | null>;
  analysis: Record<string, string | number>;
  alerts: string[];
  report: string;
  need_clarification?: boolean;
  clarification_question?: string;
};

const TERM_MAP: Array<[RegExp, string]> = [
  [/\bбпр\b|\bбипариетал/i, "bpd"],
  [/\bлзр\b|\bлобно[\s-]?затыл/i, "ofd"],
  [/\bог\b|\bокружность головы/i, "hc"],
  [/\bож\b|\bокружность живота/i, "ac"],
  [/\bдб\b|\bбедро\b|\bдлина бедра/i, "fl"],
  [/\bплечо\b|\bплечевая кость/i, "humerus"],
  [/\bктр\b/i, "crl"],
  [/\bчсс\b|\bсердцеби/i, "fhr"],
  [/\bплодное яйцо\b/i, "gestational_sac"],
  [/\bжелудочк/i, "ventricles"],
  [/\bмозжеч/i, "cerebellum"],
  [/\bбольшая цистерна/i, "cisterna_magna"],
  [/\bносов(ая|ые) кост/i, "nasal_bone"],
  [/\bжелудок\b/i, "stomach"],
  [/\bпочки\b/i, "kidneys"],
  [/\bмочевой пузыр/i, "bladder"],
  [/\bматочн(ая|ые) артер/i, "uterine"],
  [/\bправая маточн/i, "uterine_right"],
  [/\bлевая маточн/i, "uterine_left"],
  [/\bпуповин|\bартерия пуповины/i, "umbilical"],
  [/\bсма\b|\bсреднемозгов/i, "mca"],
  [/\bвенозн(ый|ого) проток/i, "dv"],
];

const WORD_NUMBERS: Record<string, string> = {
  ноль: "0",
  один: "1",
  одна: "1",
  два: "2",
  три: "3",
  четыре: "4",
  пять: "5",
  шесть: "6",
  семь: "7",
  восемь: "8",
  девять: "9",
  десять: "10",
  одиннадцать: "11",
  двенадцать: "12",
  тринадцать: "13",
  четырнадцать: "14",
  пятнадцать: "15",
  шестнадцать: "16",
  семнадцать: "17",
  восемнадцать: "18",
  девятнадцать: "19",
  двадцать: "20",
  тридцать: "30",
  сорок: "40",
  пятьдесят: "50",
  шестьдесят: "60",
  семьдесят: "70",
  восемьдесят: "80",
  девяносто: "90",
  сто: "100",
};

function normalizeSpokenNumbers(text: string): string {
  let t = text.toLowerCase();
  for (const [w, n] of Object.entries(WORD_NUMBERS)) {
    t = t.replace(new RegExp(`\\b${w}\\b`, "g"), n);
  }
  t = t.replace(/(\d)\s+и\s+(\d)/g, "$1$2");
  t = t.replace(/(\d+)\s+точка\s+(\d+)/g, "$1.$2");
  return t;
}

function mmValue(raw: number, near: string): number {
  return /см\b/.test(near) ? Math.round(raw * 10) : raw;
}

function readBool(fragment: string): boolean | undefined {
  if (/не визуализ|не определя|нет\b/i.test(fragment)) return false;
  if (/визуализ|есть\b|определя/i.test(fragment)) return true;
  return undefined;
}

function percentileBucket(v: number): "low" | "normal" | "high" {
  if (v < 10) return "low";
  if (v > 90) return "high";
  return "normal";
}

export function parseVoiceProtocol(rawInput: string): VoiceOut {
  const text = normalizeSpokenNumbers(rawInput);
  const data: Record<string, number | boolean | string | null> = {};

  for (const [rx, key] of TERM_MAP) {
    const m = text.match(new RegExp(`${rx.source}\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)?\\s*(мм|см)?`, "i"));
    if (m && m[1]) data[key] = mmValue(Number(m[1]), m[0]);
  }

  const boolKeys = ["stomach", "kidneys", "bladder", "embryo", "nasal_bone"];
  for (const key of boolKeys) {
    if (data[key] !== undefined) continue;
    const t = TERM_MAP.find(([, k]) => k === key);
    if (!t) continue;
    const m = text.match(new RegExp(`${t[0].source}[^,.;]{0,30}`, "i"));
    if (!m) continue;
    const b = readBool(m[0]);
    if (typeof b === "boolean") data[key] = b;
  }

  if (/головн/i.test(text)) data.presentation = "cephalic";
  if (/тазов/i.test(text)) data.presentation = "breech";
  if (/попереч/i.test(text)) data.presentation = "transverse";

  const alerts: string[] = [];
  if (typeof data.ventricles === "number" && data.ventricles > 10) alerts.push("⚠️ Вентрикуломегалия");
  if (data.stomach === false) alerts.push("⚠️ Желудок не визуализируется");
  if (data.bladder === false) alerts.push("⚠️ Мочевой пузырь не визуализируется");
  if (typeof data.uterine === "number" && data.uterine > 1.4) alerts.push("⚠️ PI маточных артерий >95 перцентиля");
  if (typeof data.mca === "number" && data.mca < 1.2) alerts.push("⚠️ PI СМА снижен (централизация)");
  if (typeof data.umbilical === "number" && data.umbilical > 1.3) alerts.push("⚠️ PI артерии пуповины повышен");

  const efw = hadlockEfwGrams({
    bpd: typeof data.bpd === "number" ? data.bpd : undefined,
    hc: typeof data.hc === "number" ? data.hc : undefined,
    ac: typeof data.ac === "number" ? data.ac : undefined,
    fl: typeof data.fl === "number" ? data.fl : undefined,
  });
  if (efw !== null) data.efw = efw;

  let percentile = 50;
  if (typeof data.ac === "number") {
    if (data.ac < 120) percentile = 5;
    else if (data.ac < 150) percentile = 15;
    else if (data.ac > 260) percentile = 95;
    else percentile = 50;
  }
  data.percentile = percentile;
  const bucket = percentileBucket(percentile);
  if (bucket === "low") alerts.push("⚠️ AC/масса ниже 10 перцентиля (риск ЗВУР)");
  if (bucket === "high") alerts.push("⚠️ AC/масса выше 90 перцентиля (крупный плод)");

  const report =
    alerts.length === 0
      ? `Беременность __ недель. Фетометрия соответствует сроку. Предполагаемая масса плода ${efw ?? "___"} г (${percentile} перцентиль). Показатели кровотока в норме.`
      : `Выявлены отклонения: ${alerts.map((a) => a.replace("⚠️ ", "")).join("; ")}. Требуется клиническая корреляция и контроль в динамике.`;

  if (!("bpd" in data) && !("crl" in data)) {
    return {
      data,
      analysis: { status: "insufficient_data" },
      alerts,
      report,
      need_clarification: true,
      clarification_question: "Уточните значение БПР или КТР.",
    };
  }

  return {
    data,
    analysis: { status: alerts.length ? "suspicion" : "normal", percentile },
    alerts,
    report,
  };
}
