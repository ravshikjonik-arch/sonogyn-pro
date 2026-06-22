export type OradsMenopauseSource = "text" | "ui" | "profile";
export type OradsAgeSource = "text" | "profile";

export type ResolveOradsAssistContextInput = {
  /** Parsed from free text (parseOradsProtocolText). */
  textMenopause?: "pre" | "post";
  textAgeYears?: number;
  /** UI selector in assist panel. */
  uiMenopause?: "pre" | "post";
  /** Age from patient profile (caller resolves date_of_birth → years). */
  profileAgeYears?: number;
};

export type OradsAssistContext = {
  ageYears?: number;
  ageSource?: OradsAgeSource;
  menopause: "pre" | "post";
  menopauseSource: OradsMenopauseSource;
  /** Hint only — do not auto-switch menopause when age ≥ 50. */
  postMenopauseHint: boolean;
};

export function resolveOradsAssistContext(input: ResolveOradsAssistContextInput): OradsAssistContext {
  let ageYears = input.textAgeYears;
  let ageSource: OradsAgeSource | undefined = ageYears !== undefined ? "text" : undefined;

  const profileAge = input.profileAgeYears;
  if (profileAge !== undefined && profileAge >= 0) {
    ageYears = profileAge;
    ageSource = "profile";
  }

  let menopause: "pre" | "post" = "pre";
  let menopauseSource: OradsMenopauseSource = "ui";

  if (input.textMenopause) {
    menopause = input.textMenopause;
    menopauseSource = "text";
  } else if (input.uiMenopause) {
    menopause = input.uiMenopause;
    menopauseSource = "ui";
  }

  const postMenopauseHint = ageYears !== undefined && ageYears >= 50 && menopause === "pre";

  return { ageYears, ageSource, menopause, menopauseSource, postMenopauseHint };
}
