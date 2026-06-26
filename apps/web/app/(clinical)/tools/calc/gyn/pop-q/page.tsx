import dynamic from "next/dynamic";

const PopQFlow = dynamic(
  () => import("@/components/calculators/popq/PopQFlow").then((m) => ({ default: m.PopQFlow })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-[var(--clinical-foreground-muted)]">
        Загрузка POP-Q…
      </div>
    ),
  },
);

export const metadata = {
  title: "POP-Q · стадирование пролапса · SonoGyn",
  description:
    "Калькулятор POP-Q: макет точек, расчёт стадии, протокол для врача, лист для пациентки, экспорт PDF, Word, печать и отправка на почту.",
};

export default function PopQPage() {
  return <PopQFlow />;
}
