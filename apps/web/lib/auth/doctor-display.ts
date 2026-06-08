/** ФИО → «Якубов Р.В.» (фамилия, затем инициалы имени и отчества) */

/** Основатель SonoGyn Pro — эталон для подписи кабинета и примеров в UI */
export const PRODUCT_OWNER_FIO = "Якубов Равшан Вахобжонович" as const;
export const PRODUCT_OWNER_FIO_SHORT = "Якубов Р.В." as const;

const PATRONYMIC_SUFFIX =
  /(?:ович|евич|ьич|онович|оновна|ична|овна|евна|инична)$/i;

const SURNAME_SUFFIX =
  /(?:ов|ев|ёв|ин|ын|ский|ская|ко|юк|ук|ец|ая|ий|ян|дзаде|швили)$/i;

function isPatronymic(part: string): boolean {
  const s = part.trim();
  return s.length >= 5 && PATRONYMIC_SUFFIX.test(s);
}

function looksLikeSurname(part: string): boolean {
  const s = part.trim();
  if (s.length < 3 || isPatronymic(s)) return false;
  return SURNAME_SUFFIX.test(s);
}

/** Приводит к порядку: фамилия · имя · отчество */
export function normalizeRussianFio(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (isPatronymic(b) && !isPatronymic(c)) {
      return `${c} ${a} ${b}`;
    }
    if (!isPatronymic(a) && !isPatronymic(b) && isPatronymic(c)) {
      return `${b} ${a} ${c}`;
    }
  }
  if (parts.length === 2) {
    const [a, b] = parts;
    if (looksLikeSurname(b) && !looksLikeSurname(a)) {
      return `${b} ${a}`;
    }
  }
  return fullName.trim();
}

export function buildFioAbbreviation(fullName: string): string | null {
  const normalized = normalizeRussianFio(fullName);
  const parts = normalized.split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];

  const family = parts[0];
  const initials = parts
    .slice(1)
    .map((p) => {
      const ch = p.charAt(0).toUpperCase();
      return ch ? `${ch}.` : "";
    })
    .join("");

  return initials ? `${family} ${initials}` : family;
}

export function getDoctorInitials(fullName: string, maxLen = 2): string {
  const parts = normalizeRussianFio(fullName).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, maxLen).toUpperCase();
  const fromGiven = parts
    .slice(1)
    .map((p) => p.charAt(0))
    .join("");
  if (fromGiven.length >= maxLen) return fromGiven.slice(0, maxLen).toUpperCase();
  return (parts[0].charAt(0) + fromGiven).slice(0, maxLen).toUpperCase();
}

export function resolveDoctorFullName(sources: {
  profileFullName?: string | null;
  userMetadataFullName?: string | null;
  devFullName?: string | null;
  emailFallback?: string | null;
}): string | null {
  const fromProfile = sources.profileFullName?.trim();
  if (fromProfile) return fromProfile;

  const fromMeta = sources.userMetadataFullName?.trim();
  if (fromMeta) return fromMeta;

  const fromDev = sources.devFullName?.trim();
  if (fromDev) return fromDev;

  const email = sources.emailFallback?.trim();
  if (email?.includes("@")) return email.split("@")[0] ?? null;

  return null;
}

export type DoctorCabinetLabel = {
  cabinetTitle: string;
  doctorLine: string | null;
  abbrev: string | null;
  initials: string;
};

export function buildDoctorCabinetLabel(fullName: string | null): DoctorCabinetLabel {
  const cabinetTitle = "Кабинет врача";
  if (!fullName) {
    return { cabinetTitle, doctorLine: null, abbrev: null, initials: "Вр" };
  }
  const normalized = normalizeRussianFio(fullName);
  const abbrev = buildFioAbbreviation(normalized);
  return {
    cabinetTitle,
    doctorLine: abbrev ?? fullName,
    abbrev,
    initials: getDoctorInitials(normalized),
  };
}
