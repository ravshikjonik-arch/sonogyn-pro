import { FmfScreening11Client } from "@/components/education/FmfScreening11Client";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "FMF · Скрининг 11–13 недель",
  description: "Техника измерения NT, допплер-маркеры (DV, трикуспидид, носовая кость, ЧСС), пороги эскалации и учебный калькулятор риска по принципу FMF «априорный риск × LR». Атрибуция: Fetal Medicine Foundation.",
  path: "/tools/refs/fmf-11-13",
});

export default function Fmf11To13Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--clinical-primary-deep)]">
          Учебный раздел · FMF · Скрининг 11–13 недель
        </p>
        <h1 className="mt-1 text-2xl font-black text-[var(--clinical-foreground)]">
          Скрининг 11–13 недель: от NT до cfDNA
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Техника измерений, допплер-маркеры, пороги эскалации и учебный расчёт риска —
          с прозрачной логикой «априорный риск × коэффициенты правдоподобия».
        </p>
      </header>
      <FmfScreening11Client />
    </div>
  );
}
