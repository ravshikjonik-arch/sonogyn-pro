export type PlatformRepo = {
  slug: string;
  title: string;
  dir: string;
  readme: string;
  rawUrl: string;
  githubUrl: string;
  summary: string;
  kind: "catalog" | "model";
};

export const PLATFORM_REPOS: PlatformRepo[] = [
  {
    slug: "awesome",
    title: "Awesome",
    dir: "awesome",
    readme: "readme.md",
    rawUrl: "https://raw.githubusercontent.com/sindresorhus/awesome/main/readme.md",
    githubUrl: "https://github.com/sindresorhus/awesome",
    summary: "Каталог тематических списков. Поиск по тексту прямо в кабинете.",
    kind: "catalog",
  },
  {
    slug: "awesome-selfhosted",
    title: "Awesome Selfhosted",
    dir: "awesome-selfhosted",
    readme: "README.md",
    rawUrl: "https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md",
    githubUrl: "https://github.com/awesome-selfhosted/awesome-selfhosted",
    summary: "Каталог программ, которые можно поднять у себя. Поиск по тексту в кабинете.",
    kind: "catalog",
  },
  {
    slug: "ustri",
    title: "USTri",
    dir: "USTri",
    readme: "README.md",
    rawUrl: "https://raw.githubusercontent.com/MacDunno/USTri/master/README.md",
    githubUrl: "https://github.com/MacDunno/USTri",
    summary: "Исследовательский конвейер УЗИ. В кабинете открывается описание. Расчёт на GPU в этот экран не входит.",
    kind: "model",
  },
  {
    slug: "fetal-agents",
    title: "FetalAgents",
    dir: "FetalAgents",
    readme: "README.md",
    rawUrl: "https://raw.githubusercontent.com/hu2274898/FetalAgents/main/README.md",
    githubUrl: "https://github.com/hu2274898/FetalAgents",
    summary: "Мультиагентный разбор плодного УЗИ. В кабинете открывается описание и состав репозитория.",
    kind: "model",
  },
  {
    slug: "echo-alpha",
    title: "Echo-Alpha",
    dir: "Echo-Alpha",
    readme: "README.md",
    rawUrl: "https://raw.githubusercontent.com/MiliLab/Echo-Alpha/main/README.md",
    githubUrl: "https://github.com/MiliLab/Echo-Alpha",
    summary: "Описание агента интерпретации УЗИ. Это статья и схема, не калькулятор приёма.",
    kind: "model",
  },
  {
    slug: "medical-imaging-agent",
    title: "Medical Imaging Diagnosis Agent",
    dir: "Medical-Imaging-Diagnosis-Agent",
    readme: "README.md",
    rawUrl: "https://raw.githubusercontent.com/AzaRKazar/medical-imaging-diagnosis-agent/main/README.md",
    githubUrl: "https://github.com/AzaRKazar/medical-imaging-diagnosis-agent",
    summary: "Локальный агент на Streamlit и Ollama. В кабинете открывается инструкция, отдельный диагноз он здесь не ставит.",
    kind: "model",
  },
];

export function getPlatformRepo(slug: string): PlatformRepo | undefined {
  return PLATFORM_REPOS.find((repo) => repo.slug === slug);
}
