import { FmfCalculatorsHubClient } from "@/components/education/FmfCalculatorsHubClient";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Калькуляторы FMF · оценка и менеджмент",
  description: "Калькуляторы FMF: dating CRL → срок (Robinson 1975), NT-референсы с центилями (Wright 2008), CPR по допплеру. По опубликованным формулам с атрибуцией.",
  path: "/tools/calc/fmf",
});

export default function FmfCalculatorsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--clinical-primary-deep)]">
          FMF · КАЛЬКУЛЯТОРЫ
        </p>
        <h1 className="mt-1 text-2xl font-black text-[var(--clinical-foreground)]">
          Калькуляторы FMF: оценка и менеджмент
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Реализация по опубликованным формулам с атрибуцией первоисточников — как в разделе Calculators Fetal Medicine Foundation.
        </p>
      </header>
      <FmfCalculatorsHubClient />
    </div>
  );
}
