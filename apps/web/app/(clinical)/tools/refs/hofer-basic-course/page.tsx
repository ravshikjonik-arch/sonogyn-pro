import { HoferBasicCourseClient } from "@/components/education/HoferBasicCourseClient";
import {
  HOFER_COURSE_DISCLAIMER,
  HOFER_COURSE_META,
  HOFER_PROBE_GUIDES,
  HOFER_QUIZ,
  isModuleOutlineOnly,
  moduleTitleFromMarkdown,
} from "@repo/hofer-basic-course";
import { listModuleIds, readModuleMarkdown } from "@repo/hofer-basic-course/server";

type Props = {
  searchParams: Promise<{ tab?: string; module?: string }>;
};

export const metadata = {
  title: "Базовый курс УЗД · Хофер | SonoGyn Pro",
  description:
    "Обучение для начинающих: куда ставить датчик, техника сканирования, модули и тест по конспекту Хофера (2021).",
};

export default async function HoferBasicCoursePage({ searchParams }: Props) {
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

  const initialTab =
    tab === "program" || tab === "module" || tab === "quiz" || tab === "probe" ? tab : "probe";

  return (
    <HoferBasicCourseClient
      curriculum={HOFER_COURSE_META}
      quiz={HOFER_QUIZ}
      probeGuides={HOFER_PROBE_GUIDES}
      modules={modules}
      disclaimer={HOFER_COURSE_DISCLAIMER}
      initialTab={initialTab}
      initialModuleId={moduleParam}
    />
  );
}
