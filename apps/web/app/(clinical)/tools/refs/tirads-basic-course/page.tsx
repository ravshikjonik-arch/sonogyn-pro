import { HoferBasicCourseClient } from "@/components/education/HoferBasicCourseClient";
import { resolveCourseModuleId } from "@/lib/education/resolve-course-module";
import {
  TIRADS_COURSE_DISCLAIMER,
  TIRADS_COURSE_META,
  TIRADS_QUIZ,
  isModuleOutlineOnly,
  moduleTitleFromMarkdown,
} from "@repo/tirads-basic-course";
import { listModuleIds, readModuleMarkdown } from "@repo/tirads-basic-course/server";

type Props = {
  searchParams: Promise<{ tab?: string; module?: string }>;
};

export const metadata = {
  title: "Курс TI-RADS · узлы ЩЖ | SonoGyn Pro",
  description:
    "Мультипараметрическая оценка узлов щитовидной железы: терминология B-режима, ЦДК, эластография, TI-RADS (конспект СТРОМ 2023).",
};

export default async function TiradsBasicCoursePage({ searchParams }: Props) {
  const { tab, module: moduleParam } = await searchParams;
  const ids = listModuleIds();
  const modules = ids
    .map((id) => {
      const markdown = readModuleMarkdown(id);
      if (!markdown) return null;
      return {
        id,
        title: moduleTitleFromMarkdown(markdown),
        markdown,
        outlineOnly: isModuleOutlineOnly(markdown),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m != null);

  const programBlocks = TIRADS_COURSE_META.sections.map((section) => ({
    id: section.id,
    title: section.title,
    book_pages: section.book_pages,
    modules: section.modules,
    status: section.status,
  }));

  const initialTab =
    tab === "program" || tab === "module" || tab === "quiz" ? tab : "program";

  const initialModuleId = moduleParam
    ? resolveCourseModuleId(modules, moduleParam)
    : modules.find((m) => !m.outlineOnly)?.id;

  return (
    <HoferBasicCourseClient
      courseBasePath="/tools/refs/tirads-basic-course"
      progressStorageKey="sonogyn:tirads-course:modules"
      headerKicker="Обучение · щитовидная железа · TI-RADS"
      meta={TIRADS_COURSE_META.meta}
      programBlocks={programBlocks}
      quiz={TIRADS_QUIZ}
      modules={modules}
      disclaimer={TIRADS_COURSE_DISCLAIMER}
      initialTab={initialTab}
      initialModuleId={initialModuleId}
      headerActions={[{ label: "Калькулятор TI-RADS", href: "/tools/calc/rads/ti-rads" }]}
    />
  );
}
