export type PlatformRepo = {
  slug: string;
  title: string;
  dir: string;
  readme: string;
  rawUrl: string;
  githubUrl: string;
  summary: string;
  kind: "catalog" | "model";
  /** Показывать врачу в кабинете. Каталоги Awesome — только для R&D, не для приёма. */
  clinicalVisible: boolean;
};

/**
 * Чужие OSS-репозитории, когда-то клонированные для исследования AI/УЗИ.
 * В кабинете это справочные карточки (не код продукта и не калькуляторы).
 */
export const PLATFORM_REPOS: PlatformRepo[] = [
  {
    slug: "ustri",
    title: "USTri",
    dir: "USTri",
    readme: "README.md",
    rawUrl: "https://raw.githubusercontent.com/MacDunno/USTri/master/README.md",
    githubUrl: "https://github.com/MacDunno/USTri",
    summary:
      "Исследовательский конвейер классификации УЗИ (GPU). В SonoGyn — только описание; расчёт на приёме идёт через наши калькуляторы и AI-зону.",
    kind: "model",
    clinicalVisible: true,
  },
  {
    slug: "fetal-agents",
    title: "FetalAgents",
    dir: "FetalAgents",
    readme: "README.md",
    rawUrl: "https://raw.githubusercontent.com/hu2274898/FetalAgents/main/README.md",
    githubUrl: "https://github.com/hu2274898/FetalAgents",
    summary:
      "Мультиагентный разбор плодного УЗИ (исследование). Не заменяет фетометрию и КР в кабинете.",
    kind: "model",
    clinicalVisible: true,
  },
  {
    slug: "echo-alpha",
    title: "Echo-Alpha",
    dir: "Echo-Alpha",
    readme: "README.md",
    rawUrl: "https://raw.githubusercontent.com/MiliLab/Echo-Alpha/main/README.md",
    githubUrl: "https://github.com/MiliLab/Echo-Alpha",
    summary: "Статья и схема агента интерпретации УЗИ. Не калькулятор и не CDSS приёма.",
    kind: "model",
    clinicalVisible: true,
  },
  {
    slug: "medical-imaging-agent",
    title: "Medical Imaging Diagnosis Agent",
    dir: "Medical-Imaging-Diagnosis-Agent",
    readme: "README.md",
    rawUrl: "https://raw.githubusercontent.com/AzaRKazar/medical-imaging-diagnosis-agent/main/README.md",
    githubUrl: "https://github.com/AzaRKazar/medical-imaging-diagnosis-agent",
    summary: "Демо Streamlit + Ollama. В кабинете — инструкция с GitHub, без постановки диагноза.",
    kind: "model",
    clinicalVisible: true,
  },
  {
    slug: "awesome",
    title: "Awesome",
    dir: "awesome",
    readme: "readme.md",
    rawUrl: "https://raw.githubusercontent.com/sindresorhus/awesome/main/readme.md",
    githubUrl: "https://github.com/sindresorhus/awesome",
    summary: "Общий IT-каталог списков (не медицина). Скрыт из меню врача — оставлен для R&D.",
    kind: "catalog",
    clinicalVisible: false,
  },
  {
    slug: "awesome-selfhosted",
    title: "Awesome Selfhosted",
    dir: "awesome-selfhosted",
    readme: "README.md",
    rawUrl: "https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md",
    githubUrl: "https://github.com/awesome-selfhosted/awesome-selfhosted",
    summary: "Каталог self-hosted софта (не клиника). Скрыт из меню врача.",
    kind: "catalog",
    clinicalVisible: false,
  },
];

export function getClinicalPlatformRepos(): PlatformRepo[] {
  return PLATFORM_REPOS.filter((repo) => repo.clinicalVisible);
}

export function getPlatformRepo(slug: string): PlatformRepo | undefined {
  return PLATFORM_REPOS.find((repo) => repo.slug === slug);
}
