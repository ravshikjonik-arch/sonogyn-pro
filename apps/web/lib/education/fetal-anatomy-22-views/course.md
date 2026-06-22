# 22 Ultrasound Views for Detection of 65 Fetal Anomalies

> Источник: Е.С. Емельяненко · Общероссийская школа-интенсив «УЗИ — каждому акушеру-гинекологу!»  
> SonoGyn-Pro · `/library/fetal-anatomy-22-views` · ISUOG Basic Training · лекция 8

---

## Section 1 · Introduction

### Зачем систематический протокол

- **65 ВПР** требуют фиксированного порядка срезов — один пропуск = missed diagnosis.
- **II триместр (18–22 нед)** — оптимальное окно для biometry, сердца, мозга, конечностей, лица.
- **Audit-ready** документирование: каждый срез привязан к списку исключаемых аномалий.

### Screening vs diagnostic

| | Screening | Diagnostic |
|---|-----------|------------|
| Цель | Исключить major anomalies в стандартном наборе | Уточнить находку |
| Объём | 22 среза + 2 обзора | Expert echo, MRI, genetics |
| Исход | «Визуализировано / не визуализировано» | Диagnosis + тактика |

### Типичные ловушки

1. Остановка на **4CV** без LVOT / RVOT / 3VT  
2. **Пустой bladder** → ложное «нет пузыря» / SUA  
3. Пропуск **overview-2** (движение 2)  
4. **Oblique brain** → ложная ventriculomegaly  
5. Один срез почек вместо **13a + 13b**

---

## Section 2 · 22 Standard Views

См. `views.ts` и UI модуля. Алгоритм прохода — `algorithms.ts`.

---

## Anomaly Database · Assessment · Atlas

- 65 ВПР · 15 cases · 20 MCQ · 48 atlas SVG  
- JSON export: `buildFetalAnatomyKnowledgeJson()` in `module-manifest.ts`
