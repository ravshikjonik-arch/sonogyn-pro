import { ruToken } from "../postprocess/word-boundary";

/** Канонический термин → типичные ошибки STT. Расширяйте по мере аудита. */
export const MEDICAL_GLOSSARY_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bo\s*raids\b|\bo\s*rads\b|\bораds\b/giu, "O-RADS"],
  [ruToken(String.raw`о\s*радс`), "O-RADS"],
  [/\bb\s*i\s*rads\b/giu, "BI-RADS"],
  [ruToken(String.raw`би\s*радс`), "BI-RADS"],
  [/\bt\s*i\s*rads\b/giu, "TI-RADS"],
  [ruToken(String.raw`ти\s*радс`), "TI-RADS"],
  [/\bi\s*o\s*ta\b/giu, "IOTA"],
  [ruToken("иота"), "IOTA"],
  [/\bfigo\b/giu, "FIGO"],
  [ruToken("фиго"), "FIGO"],
  [/\bfmf\b/giu, "FMF"],
  [ruToken("фмф"), "FMF"],
  [ruToken("твп"), "ТВП"],
  [ruToken("ктр"), "КТР"],
  [ruToken("бпр"), "БПР"],
  [ruToken("ож"), "ОЖ"],
  [ruToken("дбк"), "ДБК"],
  [ruToken("ияж"), "ИАЖ"],
  [ruToken("пмп"), "ПМП"],
  [ruToken("эндометри"), "эндометрий"],
  [ruToken("миометри"), "миометрий"],
  [/\bisuog\b/giu, "ISUOG"],
];

export function applyMedicalGlossary(text: string): string {
  let out = text;
  for (const [pattern, replacement] of MEDICAL_GLOSSARY_REPLACEMENTS) {
    pattern.lastIndex = 0;
    out = out.replace(pattern, replacement);
  }
  return out;
}
