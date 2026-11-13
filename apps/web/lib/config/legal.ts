import { SUPPORT_EMAIL } from "@/lib/config/platform";

/**
 * Публичные реквизиты оператора. Не выдумывать ИНН/ОГРН/адрес —
 * заполняются через env на Vercel / .env.local.
 *
 * TODO (владелец): задать NEXT_PUBLIC_LEGAL_* после регистрации ИП/ООО.
 */
export const LEGAL_DOCS_VERSION = "2026-11-13";

export const MEDICAL_DEVICE_DISCLAIMER_RU =
  "SonoGyn Pro не является медицинским изделием (без регистрационного удостоверения Росздравнадзора).";

export type LegalPublicProfile = {
  entityName: string | null;
  inn: string | null;
  ogrn: string | null;
  address: string | null;
  phone: string | null;
  supportEmail: string;
  pdnEmail: string;
  responseHoursRu: string;
  docsVersion: string;
  /** true, если в env есть имя и ИНН — можно показывать «© … ИНН …» */
  hasRegisteredEntity: boolean;
};

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : null;
}

export function readLegalPublicProfile(): LegalPublicProfile {
  const entityName = env("NEXT_PUBLIC_LEGAL_ENTITY_NAME");
  const inn = env("NEXT_PUBLIC_LEGAL_INN");
  const ogrn = env("NEXT_PUBLIC_LEGAL_OGRN");
  const address = env("NEXT_PUBLIC_LEGAL_ADDRESS");
  const phone = env("NEXT_PUBLIC_LEGAL_PHONE");
  const supportEmail = env("NEXT_PUBLIC_SUPPORT_EMAIL") ?? SUPPORT_EMAIL;
  const pdnEmail = env("NEXT_PUBLIC_PDN_EMAIL") ?? supportEmail;

  return {
    entityName,
    inn,
    ogrn,
    address,
    phone,
    supportEmail,
    pdnEmail,
    responseHoursRu: "Ответ на обращения: обычно в течение 3 рабочих дней",
    docsVersion: LEGAL_DOCS_VERSION,
    hasRegisteredEntity: Boolean(entityName && inn),
  };
}

/** Строка для футера: с реквизитами или честный TODO без выдуманного ИНН. */
export function formatLegalCopyrightLine(profile: LegalPublicProfile = readLegalPublicProfile()): string {
  const year = new Date().getFullYear();
  if (profile.hasRegisteredEntity && profile.entityName && profile.inn) {
    return `© ${year} ${profile.entityName}, ИНН ${profile.inn}`;
  }
  return `© ${year} SonoGyn Pro · реквизиты оператора уточняются`;
}

export const CROSS_BORDER_TRANSFER_TODO_RU = [
  "Вариант A (предпочтительно для РФ): локализовать Auth/БД в регионе РФ и обновить политику.",
  "Вариант B: оформить трансграничную передачу по 152-ФЗ (договор / adequacy / иные основания) с юристом и отразить основание в политике.",
] as const;
