import { ruToken } from "./word-boundary";

type VoiceCommandReplacement = string | "UNDO_LAST_WORD" | "CLEAR" | "READ";

const COMMAND_PATTERNS: ReadonlyArray<readonly [RegExp, VoiceCommandReplacement]> = [
  [ruToken("точка"), "."],
  [ruToken("запятая"), ","],
  [ruToken("восклицательный знак"), "!"],
  [ruToken("вопросительный знак"), "?"],
  [ruToken("новая строка|перенос строки"), "\n"],
  [ruToken("новый абзац"), "\n\n"],
  [ruToken("удалить последнее слово|отменить"), "UNDO_LAST_WORD"],
  [ruToken("очистить поле|очистить"), "CLEAR"],
  [ruToken("прочитать"), "READ"],
];

export type VoiceCommandSideEffect = "read" | "clear" | null;

export function applyVoiceCommands(input: string): {
  text: string;
  sideEffect: VoiceCommandSideEffect;
} {
  let sideEffect: VoiceCommandSideEffect = null;
  let text = input;

  for (const [pattern, repl] of COMMAND_PATTERNS) {
    pattern.lastIndex = 0;
    if (repl === "READ") {
      if (pattern.test(text)) sideEffect = "read";
      pattern.lastIndex = 0;
      text = text.replace(pattern, "");
      continue;
    }
    if (repl === "CLEAR") {
      if (pattern.test(text)) return { text: "", sideEffect: "clear" };
      continue;
    }
    if (repl === "UNDO_LAST_WORD") {
      if (!pattern.test(text)) continue;
      pattern.lastIndex = 0;
      text = text.replace(pattern, "");
      text = text.replace(/\s+\S+\s*$/u, " ").trimEnd();
      continue;
    }
    text = text.replace(pattern, repl);
  }

  return { text: text.replace(/\s+([.,!?])/gu, "$1").trim(), sideEffect };
}
