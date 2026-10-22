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
};

/** «12 нед 3 дн», «5,2 см» — эвристики для протоколов */
export function normalizeClinicalUnits(text: string): string {
  let out = text;

  for (const [word, digit] of Object.entries(WORD_NUMBERS)) {
    out = out.replace(new RegExp(`\\b${word}\\b`, "gi"), digit);
  }

  out = out.replace(
    /(\d{1,2})\s+нед(?:ел(?:и|ь|ю|ей))?\s+(\d{1,2})\s+дн(?:ей|я)?/gi,
    "$1 нед $2 дн",
  );

  out = out.replace(
    /(\d+)\s+цел(?:ых|ые|ая)?\s+(\d+)\s+десят(?:ых|ая|ые)?\s+(мм|см|мл)/gi,
    (_, a, b, unit) => `${a},${b} ${unit}`,
  );

  out = out.replace(/(\d+)\s*[\.,]\s*(\d+)\s*(мм|см|мл|нед|дн)\b/gi, "$1,$2 $3");

  return out.replace(/\s{2,}/g, " ").trim();
}

/** Индексы подстрок, похожих на измерения — для UI-подсветки */
export function findMeasurementSpans(text: string): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  const re = /\d+[.,]?\d*\s*(?:мм|см|мл|нед|дн|г|кг|мм\s*рт\.?\s*ст\.?|%|МЕ\/мл|мм\/с)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    spans.push({ start: m.index, end: m.index + m[0].length });
  }
  return spans;
}
