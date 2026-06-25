/**
 * Protocol Assistant — SonoGyn Pro Obstetric Expert System
 * Этап 7 · ISUOG protocol completeness
 */

export {
  assessProtocolCompleteness,
  buildProtocolChecklist,
  resolveProtocolWindow,
} from "./obstetric-expert/protocolAssistant";

export type {
  ProtocolCompletionInput,
  ProtocolCompletenessOutput,
  ProtocolGap,
} from "./obstetric-expert/protocolAssistant";
