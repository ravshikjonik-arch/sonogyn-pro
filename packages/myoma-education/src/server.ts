import casesQuiz from "../content/06-cases-quiz.md";
import pregnancy from "../content/05-pregnancy-followup.md";
import specialForms from "../content/04-special-forms.md";
import doppler from "../content/03-doppler-degeneration.md";
import protocol from "../content/02-ultrasound-protocol.md";
import figo from "../content/01-figo-classification.md";

const MODULE_MARKDOWN: Record<string, string> = {
  figo,
  protocol,
  "doppler-degeneration": doppler,
  "special-forms": specialForms,
  "pregnancy-followup": pregnancy,
  "cases-quiz": casesQuiz,
};

export function readModuleMarkdown(moduleId: string): string | null {
  return MODULE_MARKDOWN[moduleId] ?? null;
}
