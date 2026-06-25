type Suggestion = { label: string; href: string };

/** Подсказки ссылок на модули — не заменяют текст ответа AI */
export function suggestModuleLinks(prompt: string): Suggestion[] {
  if (/o-?rads|орадс|яичник/i.test(prompt)) {
    return [
      { label: "Калькулятор O-RADS", href: "/calculators/o-rads" },
      { label: "Макет яичника", href: "/ovary-atlas" },
    ];
  }
  if (/bi-?rads|молочн|мж/i.test(prompt)) {
    return [{ label: "Калькулятор BI-RADS", href: "/calculators/bi-rads" }];
  }
  if (/ti-?rads|щитовид/i.test(prompt)) {
    return [{ label: "Калькулятор TI-RADS", href: "/calculators/ti-rads" }];
  }
  if (/fmf|скрининг|беремен/i.test(prompt)) {
    return [{ label: "FMF ассистент", href: "/assistant/fmf" }];
  }
  if (/adenomyosis|аденомиоз|musa/i.test(prompt)) {
    return [{ label: "MUSA аденомиоз", href: "/musa/adenomyosis" }];
  }
  if (/заключ|отч[её]t|workspace/i.test(prompt)) {
    return [{ label: "AI-рабочая зона", href: "/workspace" }];
  }
  return [
    { label: "Калькуляторы", href: "/calculators" },
    { label: "Помощник врача", href: "/assistant" },
  ];
}
