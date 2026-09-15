"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getReferatImagePath,
  ORADS_NOSOLOGY_ATLAS,
  type OradsNosologySubtype,
} from "@repo/orads-us";
import { formatOvaryDimensionsMm } from "@repo/medical-calculations";

import { OradsGridPickCard } from "@/components/calculators/orads/grids/OradsGridPickCard";
import { OradsSizeTripletInput } from "@/components/calculators/orads/OradsSizeTripletInput";
import { useOradsProForm } from "@/components/calculators/orads/useOradsProForm";
import { Button } from "@/components/ui/button";
import { isOradsFeatureResultReady } from "@/lib/orads-pro/feature-grid-ready";
import {
  ORADS_ZERO_OPTIONS,
  buildProtocolOneLiner,
  chapterToneClasses,
  type BloodFlow,
  type IotaColorScore,
  type UnilocularSubtype,
} from "@/lib/orads-pro";
import { cn } from "@/lib/utils/cn";

type Props = {
  initialSubtype?: UnilocularSubtype;
};

const CONTENT_SUBTYPES: OradsNosologySubtype[] = [
  "simple_cyst",
  "hemorrhagic",
  "endometrioma",
  "dermoid",
  "paraovarian",
  "hydrosalpinx",
];

const COLOR_OPTIONS: Array<{ id: IotaColorScore; flow: BloodFlow; label: string; hint: string }> = [
  { id: "1", flow: "none", label: "Нет сигнала", hint: "Color score 1" },
  { id: "2", flow: "minimal", label: "Минимальный", hint: "Color score 2" },
  { id: "3", flow: "moderate", label: "Умеренный", hint: "Color score 3" },
  { id: "4", flow: "marked", label: "Выраженный", hint: "Color score 4" },
];

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-black text-[var(--clinical-foreground)]">
        {n}. {title}
      </h3>
      {children}
    </section>
  );
}

export function OradsFeatureGrid({ initialSubtype }: Props) {
  const f = useOradsProForm();
  const [oradsZero, setOradsZero] = useState<(typeof ORADS_ZERO_OPTIONS)[number]["id"] | null>(null);

  useEffect(() => {
    if (!initialSubtype) return;
    f.setMenopause("pre");
    f.setLesionKind("nonphysiological");
    f.setStructure("unilocular");
    f.setUnilocularSubtype(initialSubtype);
    f.setSolidComponent(false);
    f.setLocalization(initialSubtype === "hydrosalpinx" || initialSubtype === "paraovarian" ? "extraovarian" : "ovarian");
    // Только стартовое предзаполнение из сетки категорий.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount seed
  }, [initialSubtype]);

  const ready = isOradsFeatureResultReady({
    menopause: f.menopause,
    lesionKind: f.lesionKind,
    physType: f.physType,
    structure: f.structure,
    unilocularSubtype: f.unilocularSubtype,
    septaThickness: f.septaThickness,
    solidComponent: f.solidComponent,
    solidType: f.solidType,
  });

  const zeroMeta = ORADS_ZERO_OPTIONS.find((item) => item.id === oradsZero);
  const sizeSummary = useMemo(() => {
    return formatOvaryDimensionsMm(f.input.lengthMm, f.input.widthMm, f.input.heightMm);
  }, [f.input.lengthMm, f.input.widthMm, f.input.heightMm]);

  const resultTone =
    f.result.category === 1
      ? "sky"
      : f.result.category === 2
        ? "emerald"
        : f.result.category === 3
          ? "amber"
          : f.result.category === 4
            ? "orange"
            : "red";

  function pickContent(subtype: UnilocularSubtype) {
    setOradsZero(null);
    f.setLesionKind("nonphysiological");
    f.setStructure("unilocular");
    f.setUnilocularSubtype(subtype);
    f.setSolidComponent(false);
    f.setLocalization(subtype === "hydrosalpinx" || subtype === "paraovarian" ? "extraovarian" : "ovarian");
  }

  const contentEntries = ORADS_NOSOLOGY_ATLAS.filter((entry) => CONTENT_SUBTYPES.includes(entry.subtype));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-4 pb-28 lg:px-10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-[var(--clinical-foreground)]">Сетка по признакам</h2>
          <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
            Одно образование. Отмечайте то, что видите: тип, содержимое, стенка, размер.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setOradsZero(null);
            f.reset();
          }}
        >
          Сброс
        </Button>
      </div>

      <Section n={0} title="Оценка возможна?">
        <div className="grid gap-3 sm:grid-cols-2">
          <OradsGridPickCard
            title="Да — считать O-RADS 1–5"
            hint="Образование видно, ЦДК доступно"
            selected={oradsZero === null}
            onClick={() => setOradsZero(null)}
          />
          {ORADS_ZERO_OPTIONS.map((item) => (
            <OradsGridPickCard
              key={item.id}
              title={item.label}
              hint={item.detail}
              selected={oradsZero === item.id}
              onClick={() => setOradsZero(item.id)}
            />
          ))}
        </div>
      </Section>

      {oradsZero && zeroMeta ? (
        <div className={cn("rounded-2xl border-2 p-4", chapterToneClasses("slate"))}>
          <p className="text-2xl font-black">O-RADS 0</p>
          <p className="mt-1 text-sm">{zeroMeta.recommendation}</p>
        </div>
      ) : (
        <>
          <Section n={1} title="Пациентка">
            <div className="grid gap-3 sm:grid-cols-2">
              <OradsGridPickCard
                title="Пременопауза"
                hint="Включая перименопаузу, если есть циклы"
                selected={f.menopause === "pre"}
                onClick={() => f.setMenopause("pre")}
              />
              <OradsGridPickCard
                title="Постменопауза"
                hint="Аменорея ≥1 года; при сомнении и ≥50 лет — как постменопауза"
                selected={f.menopause === "post"}
                onClick={() => {
                  f.setMenopause("post");
                  f.setCycleDay("");
                }}
              />
            </div>
          </Section>

          <Section n={2} title="Какое образование">
            <div className="grid gap-3 sm:grid-cols-2">
              <OradsGridPickCard
                title="Норма / нет образования"
                hint="O-RADS 1"
                imageSrc={getReferatImagePath("atlas/physiologic")}
                selected={f.lesionKind === "normal_ovary"}
                onClick={() => {
                  f.setLesionKind("normal_ovary");
                  f.setNormalOvaryPattern("typical");
                  f.setStructure(undefined);
                  f.setUnilocularSubtype(undefined);
                }}
              />
              <OradsGridPickCard
                title="Физиологическое"
                hint="Фолликул или жёлтое тело"
                imageSrc={getReferatImagePath("atlas/physiologic")}
                selected={f.lesionKind === "physiological"}
                onClick={() => {
                  f.setLesionKind("physiological");
                  f.setStructure(undefined);
                }}
              />
              <OradsGridPickCard
                title="Кистозное / солидное"
                hint="Считать как образование придатков"
                imageSrc={getReferatImagePath("atlas/simple_cyst")}
                selected={f.lesionKind === "nonphysiological"}
                onClick={() => f.setLesionKind("nonphysiological")}
              />
            </div>
            {f.lesionKind === "physiological" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <OradsGridPickCard
                  title="Фолликул"
                  selected={f.physType === "follicle"}
                  onClick={() => f.setPhysType("follicle")}
                />
                <OradsGridPickCard
                  title="Жёлтое тело"
                  selected={f.physType === "corpus_luteum"}
                  onClick={() => f.setPhysType("corpus_luteum")}
                />
              </div>
            ) : null}
          </Section>

          {f.lesionKind === "nonphysiological" ? (
            <>
              <Section n={3} title="Содержимое — сравните с монитором">
                <div className="grid gap-3 sm:grid-cols-2">
                  {contentEntries.map((entry) => (
                    <OradsGridPickCard
                      key={entry.id}
                      title={entry.titleRu}
                      hint={entry.oradsHint}
                      imageSrc={entry.realExampleImage ?? entry.imageSrc}
                      imageAlt={entry.imageAlt}
                      selected={f.unilocularSubtype === entry.subtype}
                      onClick={() => pickContent(entry.subtype as UnilocularSubtype)}
                    />
                  ))}
                  <OradsGridPickCard
                    title="Многокамерное"
                    hint="Перегородки во 2-й плоскости"
                    imageSrc={getReferatImagePath("atlas/irregular_wall")}
                    selected={f.structure === "multilocular"}
                    onClick={() => {
                      f.setStructure("multilocular");
                      f.setUnilocularSubtype(undefined);
                      f.setLocalization("ovarian");
                    }}
                  />
                  <OradsGridPickCard
                    title="Солидное ≥80%"
                    hint="Преобладает ткань"
                    imageSrc={getReferatImagePath("atlas/solid_dominant")}
                    selected={f.structure === "solid"}
                    onClick={() => {
                      f.setStructure("solid");
                      f.setUnilocularSubtype(undefined);
                      f.setSolidComponent(true);
                      f.setLocalization("ovarian");
                    }}
                  />
                </div>
              </Section>

              <Section n={4} title="Пристеночные компоненты">
                <div className="grid gap-3 sm:grid-cols-2">
                  <OradsGridPickCard
                    title="Гладкая стенка, без солидного"
                    hint="Нет папилляр ≥3 мм"
                    selected={f.solidComponent === false}
                    onClick={() => {
                      f.setSolidComponent(false);
                      f.setSolidType(undefined);
                      f.setPapillaryProjectionCount("0");
                    }}
                  />
                  <OradsGridPickCard
                    title="Папилляры 1–3"
                    hint="Вырост ≥3 мм"
                    imageSrc={getReferatImagePath("atlas/papillary_4plus")}
                    selected={f.solidComponent === true && f.papillaryProjectionCount !== "4plus"}
                    onClick={() => {
                      f.setSolidComponent(true);
                      f.setSolidType("papillary");
                      f.setPapillaryProjectionCount("1");
                    }}
                  />
                  <OradsGridPickCard
                    title="Папилляры ≥4"
                    hint="O-RADS 5 при типичном паттерне"
                    imageSrc={getReferatImagePath("atlas/papillary_4plus")}
                    selected={f.papillaryProjectionCount === "4plus"}
                    onClick={() => {
                      f.setSolidComponent(true);
                      f.setSolidType("papillary");
                      f.setPapillaryProjectionCount("4plus");
                    }}
                  />
                  <OradsGridPickCard
                    title="Неровная стенка / контур"
                    hint="Irregular"
                    imageSrc={getReferatImagePath("atlas/irregular_wall")}
                    selected={f.solidType === "irregular"}
                    onClick={() => {
                      f.setSolidComponent(true);
                      f.setSolidType("irregular");
                    }}
                  />
                </div>
                {f.structure === "multilocular" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OradsGridPickCard
                      title="Тонкие перегородки <3 мм"
                      selected={f.septaThickness === "thin"}
                      onClick={() => f.setSeptaThickness("thin")}
                    />
                    <OradsGridPickCard
                      title="Толстые перегородки ≥3 мм"
                      selected={f.septaThickness === "thick"}
                      onClick={() => f.setSeptaThickness("thick")}
                    />
                  </div>
                ) : null}
              </Section>
            </>
          ) : null}

          <Section n={5} title="Размеры, мм">
            <OradsSizeTripletInput
              lengthMm={f.lengthMm}
              widthMm={f.widthMm}
              heightMm={f.heightMm}
              onLengthChange={f.setLengthMm}
              onWidthChange={f.setWidthMm}
              onHeightChange={f.setHeightMm}
              menopause={f.menopause}
              hint={
                f.lesionKind === "physiological"
                  ? "Для O-RADS 1 физиологическое обычно ≤30 мм."
                  : "Наибольший диаметр идёт в категорию."
              }
            />
          </Section>

          {f.lesionKind === "nonphysiological" ? (
            <Section n={6} title="ЦДК">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {COLOR_OPTIONS.map((option) => (
                  <OradsGridPickCard
                    key={option.id}
                    title={option.label}
                    hint={option.hint}
                    selected={f.iotaColorScore === option.id || f.bloodFlow === option.flow}
                    onClick={() => {
                      f.setIotaColorScore(option.id);
                      f.setBloodFlow(option.flow);
                    }}
                  />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <OradsGridPickCard
                  title="Асцита нет"
                  selected={!f.ascites}
                  onClick={() => f.setAscites(false)}
                />
                <OradsGridPickCard
                  title="Асцит есть"
                  hint="Может повысить категорию"
                  imageSrc="/clinical/orads-nosology/free-fluid-pelvis.jpg"
                  selected={f.ascites}
                  onClick={() => f.setAscites(true)}
                />
              </div>
            </Section>
          ) : null}

          {ready ? (
            <div className={cn("rounded-2xl border-2 p-4", chapterToneClasses(resultTone))}>
              <p className="text-xs font-bold uppercase tracking-wide">Итог калькулятора</p>
              <p className="mt-1 text-3xl font-black">O-RADS {f.result.category}</p>
              <p className="mt-1 text-sm font-semibold">{f.result.riskText}</p>
              <p className="mt-2 text-sm">{f.result.recommendation}</p>
              <p className="mt-2 text-xs">{f.result.rationale}</p>
              {sizeSummary ? <p className="mt-2 text-xs">Размер: {sizeSummary}</p> : null}
              <p className="mt-3 text-sm font-medium">{buildProtocolOneLiner(f.result)}</p>
              <p className="mt-3 text-xs text-[var(--clinical-foreground-muted)]">
                Не является диагнозом. Интерпретация — лечащий специалист.
              </p>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--clinical-border)] px-3 py-3 text-sm text-[var(--clinical-foreground-muted)]">
              Категория появится, когда отметите менопаузу, тип образования и содержимое / стенку.
            </p>
          )}
        </>
      )}
    </div>
  );
}
