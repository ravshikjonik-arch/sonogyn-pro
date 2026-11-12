# Контракт калькулятора SonoGyn Clinical Engine

**Статус:** проект на утверждение. Типы ниже — спецификация, не код.
Расположение при реализации: общие примитивы — `packages/types/src/clinical-engine.ts` (Zod); схемы входа и адаптер — в пакете каждого движка, подпуть `./contract`.

## 1. Спецификация калькулятора (`CalculatorSpec`)

```ts
type CalculatorSpec = {
  algorithmId: string;              // "orads-us@2022", "iota-adnex@2014", "acr-tirads@2017"
  title: string;                    // своё название, без логотипов третьих лиц
  guideline: GuidelineRef;          // см. GUIDELINES_REGISTRY.md
  domain: "gynecology" | "obstetrics" | "breast" | "thyroid" | "other";
  resultKind: "category" | "score" | "probability" | "percentile" | "measurement" | "composite";
  blocks: QuestionBlock[];          // один логический блок на экран
};

type QuestionBlock = {
  id: string;
  title: string;
  showWhen?: Condition;             // условное появление (по предыдущим ответам)
  questions: Question[];
};

type Question = {
  field: string;                    // ключ входа движка
  label: string;
  hint?: string;
  kind: "choice" | "multi" | "number" | "boolean";
  options?: { value: string; label: string; illustration?: string }[];
  unit?: "mm" | "cm" | "ml" | "weeks" | "days" | "years" | "mmHg" | "%";
  range?: { min: number; max: number };
  allowNotAssessed: boolean;        // «не оценено»
  allowUncertain?: { resolveTo: string; rule: string }; // O-RADS GC8: «не уверен» → более рискованный вариант
  requiredWhen?: Condition;         // обязательность зависит от ветки
};
```

## 2. Вход (`ClinicalInput`)

Каждый признак — явное состояние, а не «undefined = нет»:

```ts
type FieldValue<T> =
  | { state: "value"; value: T; source: "physician" | "model_confirmed" | "imported" }
  | { state: "uncertain"; resolvedTo: T; rule: string }   // выбор более рискованного признака
  | { state: "not_assessed" }
  | { state: "not_applicable" };
// отсутствие ключа = not_provided
```

Правила: строгая схема (неизвестные поля — ошибка), единицы фиксированы спецификацией, конверсия единиц — только явная функцией адаптера, без «молчаливых» 0/false.

## 3. Результат (`ClinicalResult`)

```ts
type ClinicalResult = {
  algorithmId: string;
  algorithmVersion: string;
  status: "calculated" | "incomplete" | "invalid" | "not_applicable";
  primary?:                                   // отсутствует при status ≠ calculated
    | { kind: "category"; code: string; label: string; riskBand?: string }
    | { kind: "score"; value: number; max?: number }
    | { kind: "probability"; value: number; ci?: [number, number] }
    | { kind: "percentile"; value: number; zScore?: number; mom?: number }
    | { kind: "measurement"; value: number; unit: string };
  secondary?: Record<string, number | string>;
  interpretation?: string;
  recommendations?: { text: string; strength?: string; sourceRef?: string }[];
  explanation: { step: string; input?: string; outcome: string }[];  // объяснимость каждого шага
  missing?: { field: string; reason: string }[];       // при incomplete
  invalid?: { field: string; message: string }[];      // при invalid
  possibleOutcomes?: string[];                          // если движок может перечислить исходы
  limitations: string[];
  sources: GuidelineRef[];
  protocolText?: string;                                // готовый текст для протокола
  disclaimer: string;                                   // «справочно, не диагноз; решение — врач»
};
```

Инварианты:
1. `primary` есть **только** при `status = "calculated"`.
2. Одинаковый `ClinicalInput` → побайтно одинаковый `ClinicalResult` (кроме метаданных времени, которых в результате нет).
3. `explanation` строится движком; LLM его не генерирует.
4. Мультиочаговость (O-RADS GC3): `CompositeResult = { overall: ClinicalResult; lesions: ClinicalResult[]; rule: "highest" }`.

## 4. Совместимость с существующими контрактами

| Существующий контракт | Как отображается |
|---|---|
| `packages/types` `StructuredCalculatorBlockSchema` (протокол) | `algorithmId`, `algorithmVersion`, `category ← primary.label`, `immutable: true` |
| `medical-intelligence` `ClassificationSection` | `status calculated → computed`, `incomplete → not_computed + abstention` |
| AI-чат `ToolExecutionResult` | `status` (complete / provisional / incomplete) ↔ `calculated / incomplete`; `inputReview` ↔ `FieldValue.source` |
| `calculator_entries.payload` (БД) | сохраняется `ClinicalResult` целиком (jsonb), без ПДн |

Публичные формы существующих контрактов не меняются; адаптеры добавляются рядом.
