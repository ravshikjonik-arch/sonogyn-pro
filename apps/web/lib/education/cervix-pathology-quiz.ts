export const CERVIX_PATHOLOGY_QUIZ_DISCLAIMER =
  "Вопросы составлены по открытым КР МЗ РФ, FIGO 2018, ASCCP 2019 и IFCPC 2011 — пересказ своими словами. Не заменяют клиническое суждение и официальные протоколы. Перед клиническим применением сверяйте статус КР на cr.minzdrav.gov.ru (особенно КР по ЦИН 2024).";

export const CERVIX_PATHOLOGY_QUIZ_LINKS = {
  cytology: { href: "/tools/refs/cervix-pathology?tab=cytology", label: "Цитология · скрининг" },
  nosology: { href: "/nosologies/cervix-pathology", label: "Нозология · шейка матки" },
  library: { href: "/tools/refs", label: "Библиотека" },
  evidence: { href: "/evidence?shelf=cervix", label: "SonoEvidence · шейка" },
} as const;
