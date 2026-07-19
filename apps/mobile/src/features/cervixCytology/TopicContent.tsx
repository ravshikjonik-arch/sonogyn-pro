import {
  getCytologyAnatomyNodes,
  getCytologyBethesdaCategories,
  getCytologyClinicalAlgorithms,
  getCytologyCoTestingMatrix,
  getCytologyConventional,
  getCytologyHpvEducation,
  getCytologyHpvTesting,
  getCytologyLiquidCompare,
  getCytologyLectureSlides,
  getCytologySamplingErrors,
  getCytologySamplingProtocol,
  getCytologyTimeline,
  type CytologyTopicId,
} from "@repo/cervix-pathology-reference/cytology";
import { View } from "react-native";

import { DataTable } from "./components/DataTable";
import { BodyText, BulletList, KeyRow, SectionBlock } from "./components/SectionBlock";
import { BethesdaAiPanel } from "./panels/BethesdaAiPanel";
import { CasesPanel } from "./panels/CasesPanel";
import { QuizPanel } from "./panels/QuizPanel";
import { ScreeningPanel } from "./panels/ScreeningPanel";
import type { CervixTheme } from "./useCervixTheme";

type Props = {
  topic: CytologyTopicId;
  subFocus?: "thinprep" | "surepath";
  theme: CervixTheme;
};

export function TopicContent({ topic, subFocus, theme }: Props) {
  switch (topic) {
    case "screening":
      return <ScreeningPanel theme={theme} />;
    case "ai-assist":
      return <BethesdaAiPanel theme={theme} />;
    case "cases":
      return <CasesPanel theme={theme} />;
    case "quiz":
      return <QuizPanel theme={theme} />;
    case "anatomy":
      return <AnatomyTopic theme={theme} />;
    case "transformation-zone":
      return <TransformationTopic theme={theme} />;
    case "hpv":
      return <HpvTopic theme={theme} />;
    case "liquid-cytology":
      return <LiquidCytologyTopic theme={theme} subFocus={subFocus} />;
    case "conventional":
      return <ConventionalTopic theme={theme} />;
    case "sampling":
      return <SamplingTopic theme={theme} />;
    case "sampling-errors":
      return <SamplingErrorsTopic theme={theme} />;
    case "bethesda":
      return <BethesdaTopic theme={theme} />;
    case "hpv-testing":
      return <HpvTestingTopic theme={theme} />;
    case "co-testing":
      return <CoTestingTopic theme={theme} />;
    case "algorithms":
      return <AlgorithmsTopic theme={theme} />;
    case "lecture":
      return <LectureTopic theme={theme} />;
    default:
      return (
        <SectionBlock title="Раздел" theme={theme}>
          <BodyText theme={theme}>Раздел не найден.</BodyText>
        </SectionBlock>
      );
  }
}

function AnatomyTopic({ theme }: { theme: CervixTheme }) {
  const nodes = getCytologyAnatomyNodes();
  return (
    <View>
      {nodes.map((node) => (
        <SectionBlock key={node.id} title={node.label} theme={theme}>
          <BodyText theme={theme}>{node.description}</BodyText>
          <KeyRow theme={theme} label="Клиническое значение" value={node.clinicalSignificance} />
          <KeyRow theme={theme} label="Связь с CIN" value={node.cinLink} />
          <BodyText theme={theme}>{node.plainLanguage}</BodyText>
        </SectionBlock>
      ))}
    </View>
  );
}

function TransformationTopic({ theme }: { theme: CervixTheme }) {
  const timeline = getCytologyTimeline();
  return (
    <View>
      <SectionBlock title={timeline.title} theme={theme}>
        {timeline.steps.map((step, i) => (
          <View key={step.id} style={{ marginBottom: 10 }}>
            <BodyText theme={theme}>
              {i + 1}. {step.label}
            </BodyText>
            <BodyText theme={theme}>{step.description}</BodyText>
          </View>
        ))}
      </SectionBlock>
    </View>
  );
}

function HpvTopic({ theme }: { theme: CervixTheme }) {
  const data = getCytologyHpvEducation();
  return (
    <View>
      <SectionBlock title={data.title} theme={theme}>
        {data.sections.map((s) => (
          <View key={s.id} style={{ marginBottom: 10 }}>
            <BodyText theme={theme}>{s.title}</BodyText>
            <BodyText theme={theme}>{s.body}</BodyText>
          </View>
        ))}
        {data.stats.map((st) => (
          <KeyRow key={st.label} theme={theme} label={st.label} value={`${st.value} — ${st.note}`} />
        ))}
      </SectionBlock>
    </View>
  );
}

function LiquidCytologyTopic({
  theme,
  subFocus,
}: {
  theme: CervixTheme;
  subFocus?: "thinprep" | "surepath";
}) {
  const data = getCytologyLiquidCompare();
  const systems = subFocus ? data.systems.filter((s) => s.id === subFocus) : data.systems;

  return (
    <View>
      {!subFocus ? (
        <SectionBlock title="Жидкостная цитология" theme={theme}>
          <BulletList theme={theme} items={data.sharedBenefits} />
        </SectionBlock>
      ) : null}
      {systems.map((sys) => (
        <SectionBlock key={sys.id} title={sys.name} theme={theme}>
          <KeyRow theme={theme} label="Технология" value={sys.technology} />
          <KeyRow theme={theme} label="Объём виалы" value={`${sys.volumeMl} мл`} />
          <KeyRow theme={theme} label="Слой на стекле" value={String(sys.slidePreparationVolumeMl)} />
          <KeyRow theme={theme} label="Щётка" value={sys.brushHandling} />
          <KeyRow theme={theme} label="Клеточное окно" value={`${sys.cellWindowMm} мм`} />
          <KeyRow theme={theme} label="Мин. клеток" value={String(sys.adequacyMinCells)} />
          <BulletList theme={theme} items={sys.advantages} />
          <TextMuted theme={theme} items={sys.limitations} title="Ограничения" />
          <TextMuted theme={theme} items={sys.typicalErrors} title="Типичные ошибки" />
        </SectionBlock>
      ))}
    </View>
  );
}

function TextMuted({ theme, items, title }: { theme: CervixTheme; items: string[]; title: string }) {
  return (
    <View style={{ marginTop: 8 }}>
      <BodyText theme={theme}>{title}</BodyText>
      <BulletList theme={theme} items={items} />
    </View>
  );
}

function ConventionalTopic({ theme }: { theme: CervixTheme }) {
  const data = getCytologyConventional();
  return (
    <SectionBlock title="Традиционная цитология" theme={theme}>
      <BodyText theme={theme}>Мазок на стекло — техника и ограничения.</BodyText>
      <BodyText theme={theme}>Преимущества</BodyText>
      <BulletList theme={theme} items={data.advantages} />
      <BodyText theme={theme}>Недостатки</BodyText>
      <BulletList theme={theme} items={data.disadvantages} />
      <BodyText theme={theme}>Чеклист техники</BodyText>
      <BulletList theme={theme} items={data.techniqueChecklist} />
    </SectionBlock>
  );
}

function SamplingTopic({ theme }: { theme: CervixTheme }) {
  const data = getCytologySamplingProtocol();
  return (
    <SectionBlock title="Забор материала" theme={theme}>
      {data.steps.map((step) => (
        <View key={step.order} style={{ marginBottom: 8 }}>
          <BodyText theme={theme}>
            {step.order}. {step.title}
          </BodyText>
          <BodyText theme={theme}>{step.body}</BodyText>
        </View>
      ))}
      <BodyText theme={theme}>Запрещено / частые ошибки</BodyText>
      <BulletList theme={theme} items={data.forbidden} />
    </SectionBlock>
  );
}

function SamplingErrorsTopic({ theme }: { theme: CervixTheme }) {
  const errors = getCytologySamplingErrors();
  return (
    <View>
      {errors.map((err) => (
        <SectionBlock key={err.id} title={err.title} theme={theme}>
          <KeyRow theme={theme} label="Почему плохо" value={err.whyBad} />
          <KeyRow theme={theme} label="Видит цитолог" value={err.cytologistSees} />
          <KeyRow theme={theme} label="Риск" value={err.patientRisk} />
          <KeyRow theme={theme} label="Исправление" value={err.fix} />
          <KeyRow theme={theme} label="Профилактика" value={err.prevent} />
        </SectionBlock>
      ))}
    </View>
  );
}

function BethesdaTopic({ theme }: { theme: CervixTheme }) {
  const categories = getCytologyBethesdaCategories();
  return (
    <View>
      {categories.map((cat) => (
        <SectionBlock key={cat.id} title={`${cat.code} — ${cat.title}`} theme={theme}>
          <KeyRow theme={theme} label="Определение" value={cat.title} />
          <KeyRow theme={theme} label="Простое объяснение" value={cat.plain} />
          <KeyRow theme={theme} label="CIN / гистология" value={cat.histology} />
          <KeyRow theme={theme} label="Связь с HPV" value={cat.hpvLink} />
          <KeyRow theme={theme} label="Следующий шаг" value={cat.doctorAction} />
          <KeyRow theme={theme} label="Кольпоскопия" value={cat.colposcopy} />
          <KeyRow theme={theme} label="Биопсия" value={cat.biopsy} />
          <KeyRow theme={theme} label="Онкогинеколог" value={cat.referral} />
        </SectionBlock>
      ))}
    </View>
  );
}

function HpvTestingTopic({ theme }: { theme: CervixTheme }) {
  const data = getCytologyHpvTesting();
  return (
    <View>
      <SectionBlock title="ВПЧ-тестирование · ПЦР / Digene" theme={theme}>
        <BodyText theme={theme}>Screening/triage по HR-HPV; не заменяет гистологию.</BodyText>
      </SectionBlock>
      {data.sections.map((s) => (
        <SectionBlock key={s.id} title={s.title} theme={theme}>
          <BodyText theme={theme}>{s.body}</BodyText>
        </SectionBlock>
      ))}
    </View>
  );
}

function CoTestingTopic({ theme }: { theme: CervixTheme }) {
  const matrix = getCytologyCoTestingMatrix();
  return (
    <SectionBlock title={matrix.title} theme={theme}>
      <DataTable
        theme={theme}
        columns={[
          { key: "cytology", label: "Цитология", width: 120 },
          { key: "hpv", label: "HPV", width: 100 },
          { key: "action", label: "Тактика", width: 260 },
        ]}
        rows={matrix.rows}
      />
    </SectionBlock>
  );
}

function AlgorithmsTopic({ theme }: { theme: CervixTheme }) {
  const alg = getCytologyClinicalAlgorithms();
  return (
    <SectionBlock title="Клинические алгоритмы" theme={theme}>
      {alg.chain.map((step, i) => (
        <View key={step.step} style={{ marginBottom: 8 }}>
          <BodyText theme={theme}>
            {i + 1}. {step.label}
          </BodyText>
          <BodyText theme={theme}>{step.description}</BodyText>
        </View>
      ))}
    </SectionBlock>
  );
}

function LectureTopic({ theme }: { theme: CervixTheme }) {
  const data = getCytologyLectureSlides();
  return (
    <View>
      {data.lectures.map((lecture) => (
        <SectionBlock key={lecture.id} title={lecture.title} theme={theme}>
          <BulletList theme={theme} items={lecture.slides} />
        </SectionBlock>
      ))}
    </View>
  );
}
