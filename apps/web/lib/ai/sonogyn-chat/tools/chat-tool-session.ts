import { worstStatus } from "./completeness";
import { executeClinicalTool } from "./execute";
import { META_FIELDS, NOT_ASSESSED, type AllowedAiToolName, type ToolExecutionResult } from "./schemas";

/**
 * Per-turn state of the chat tool loop (one user message). Enforces:
 * - review gate: O-RADS / IOTA results are withheld from the model and the card until a physician confirms the inputs;
 * - retry integrity: after a rejected or incomplete call, a retry may correct the invalid fields only. Dropping or
 *   changing other values is rejected once; fields first appearing in a retry carry no new user information and are
 *   treated as assumed by the model.
 */

type CallRecord = {
  input: Record<string, unknown>;
  outcome: "rejected" | "incomplete" | "computed";
  invalidFields: Set<string>;
};

const isConcrete = (v: unknown) => v !== undefined && v !== NOT_ASSESSED;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
}

function topLevel(path: string): string {
  return path.split(".")[0] ?? path;
}

export const AWAITING_REVIEW_NOTE =
  "Результат будет показан после подтверждения входных данных врачом в карточке инструмента.";

/** Chat boundary: a review-gated result is never handed to the model or shown before confirmation. */
export function toChatToolOutput(result: ToolExecutionResult): ToolExecutionResult {
  if (result.review?.state !== "pending" || !result.ok || !result.result) return result;
  const { result: _withheld, ...rest } = result;
  void _withheld;
  return { ...rest, limitations: [...(rest.limitations ?? []), AWAITING_REVIEW_NOTE] };
}

export type ChatToolSession = {
  call(tool: AllowedAiToolName, input: unknown): ToolExecutionResult;
};

export function createChatToolSession(): ChatToolSession {
  const last = new Map<AllowedAiToolName, CallRecord>();
  const integrityRejected = new Set<AllowedAiToolName>();

  return {
    call(tool, input) {
      const raw = asRecord(input);
      const prev = last.get(tool);
      let changed: string[] = [];
      let addedOnRetry: string[] = [];

      if (prev && prev.outcome !== "computed") {
        changed = Object.keys(prev.input).filter(
          (k) =>
            !(META_FIELDS as readonly string[]).includes(k) &&
            !prev.invalidFields.has(k) &&
            isConcrete(prev.input[k]) &&
            !same(prev.input[k], raw[k]),
        );
        addedOnRetry = Object.keys(raw).filter(
          (k) => !(META_FIELDS as readonly string[]).includes(k) && !(k in prev.input) && isConcrete(raw[k]) && !prev.invalidFields.has(k),
        );

        if (changed.length && !integrityRejected.has(tool)) {
          integrityRejected.add(tool);
          return {
            tool,
            ok: false,
            rejected: true,
            status: "incomplete",
            engineVersion: "n/a",
            sourceLabel: "retry-integrity",
            inputEcho: raw,
            validationIssues: changed.map((path) => ({ path, message: "значение из предыдущего вызова удалено или изменено" })),
            error: `Повторный вызов удаляет или меняет ранее переданные корректные значения (${changed.join(", ")}). Исправьте только поля с ошибкой и сохраните остальные данные пользователя; не изменяйте данные без нового сообщения пользователя.`,
          };
        }
      }

      const assumed = new Set<string>([...((raw.assumedFields as string[] | undefined) ?? []), ...addedOnRetry]);
      const effectiveInput = assumed.size ? { ...raw, assumedFields: [...assumed] } : raw;
      const result = executeClinicalTool(tool, effectiveInput);

      if (result.inputReview && changed.length) {
        result.inputReview.changedAfterRejection = changed;
        result.limitations = [
          ...(result.limitations ?? []),
          `После отклонённого вызова изменены значения: ${changed.join(", ")} — сверьте с исходными данными пользователя.`,
        ];
        result.status = worstStatus(result.status, "provisional");
      }
      if (addedOnRetry.length) {
        result.limitations = [
          ...(result.limitations ?? []),
          `Поля, впервые указанные при повторном вызове (${addedOnRetry.join(", ")}), считаются предположением модели и в расчёт не включены.`,
        ];
      }

      last.set(tool, {
        input: raw,
        outcome: result.rejected ? "rejected" : result.ok && result.status === "complete" ? "computed" : "incomplete",
        invalidFields: new Set((result.validationIssues ?? []).map((i) => topLevel(i.path))),
      });
      return toChatToolOutput(result);
    },
  };
}
