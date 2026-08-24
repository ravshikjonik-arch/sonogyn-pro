import type { CanonicalKnowledgeArticle, SourceCitationPublic } from "../types";

export const TEST_GUIDELINE_SOURCE: SourceCitationPublic = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001",
  title: "TEST GUIDELINE — Endometrioma (Synthetic Fixture)",
  shortTitle: "TEST GUIDELINE",
  authors: "SonoGyn Editorial Board",
  organization: "SonoGyn Pro Test Lab",
  year: 2026,
  externalUrl: "https://example.invalid/sonogyn-test-guideline-endometrioma",
  sourceType: "guideline",
  language: "ru",
  reviewStatus: "published",
  version: "1.0.0-test",
  chapter: "Section 2",
  pageStart: 4,
  pageEnd: 5,
  verified: true,
};

export const ENDOMETRIOMA_DEMO_ARTICLE: CanonicalKnowledgeArticle = {
  id: "dddddddd-dddd-dddd-dddd-dddddddd0001",
  slug: "endometrioma-demo",
  title: "Эндометриоидная киста (demo)",
  specialty: "gynecology",
  topicType: "condition",
  summary:
    "Каноническая demo-статья: УЗ-признаки, дифференциальная диагностика и связь с O-RADS. Только синтетические данные.",
  version: "1.0.0-test",
  sections: [
    {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeee0001",
      sectionType: "definition",
      title: "Определение",
      content:
        "Эндометриоидная киста — кистозное образование яичника с содержимым в виде крови различной давности; на УЗИ часто «матовое стекло».",
      sortOrder: 0,
    },
    {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeee0002",
      sectionType: "ultrasound_findings",
      title: "УЗ-признаки",
      content:
        "Однокамерная киста, однородное содержимое низкой эхогенности; при допплере — периферическое кровоснабжение без внутри кистозного потока.",
      sortOrder: 1,
    },
    {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeee0003",
      sectionType: "differential",
      title: "Дифференциальная диагностика",
      content: "Геморрагическая киста, dermoid, параовариальная киста; при атипии — исключить злокачественность.",
      sortOrder: 2,
    },
    {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeee0004",
      sectionType: "classification",
      title: "Связанные классификации",
      content: "O-RADS US для описания и тактики; IOTA simple rules при необходимости.",
      sortOrder: 3,
    },
    {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeee0005",
      sectionType: "common_errors",
      title: "Типичные ошибки",
      content: "Путать с геморрагической кистой в острую фазу; переоценивать солидный компонент без реального узла.",
      sortOrder: 4,
    },
  ],
  sources: [TEST_GUIDELINE_SOURCE],
};
