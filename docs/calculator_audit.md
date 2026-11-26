# Аудит калькуляторов · SonoGyn vs OblCalc

> Сгенерировано: 2026-06-20T18:43:06.501Z

## Сводка

| Метрика | Значение |
|---------|----------|
| Референсный список | 19 |
| Полностью реализовано | 19 |
| Частично | 0 |
| Отсутствует | 0 |
| Покрытие (strict) | 100% |
| Покрытие (с partial ×0.5) | 100% |

## 1. Уже реализовано

- **Срок беременности по менструации** — `/tools/calc/ob?tab=lmp` (ga-lmp)
- **Срок беременности по УЗИ** — `/tools/calc/ob?tab=us` (ga-us)
- **Срок беременности по овуляции/ЭКО** — `/tools/calc/ob?tab=ivf` (ga-ivf)
- **Срок беременности по шевелениям плода** — `/tools/calc/ob?tab=movement` (ga-movement)
- **Срок беременности по явке в женскую консультацию** — `/tools/calc/ob?tab=antenatal` (ga-antenatal)
- **Сроки декретного отпуска** — `/tools/calc/ob?tab=dekret` (maternity-leave)
- **Срок беременности по предполагаемой дате родов** — `/tools/calc/ob?tab=edd` (ga-edd)
- **Срок беременности по КТР (I триместр)** — `/tools/calc/ob?tab=crl` (ga-crl)
- **Срок беременности по СВД (I триместр)** — `/tools/calc/ob?tab=msd` (ga-msd)
- **Срок беременности по фетометрии (II триместр)** — `/tools/calc/ob?tab=feto` (ga-feto)
- **Предполагаемая масса плода по антропометрии матери** — `/tools/calc/ob/fetal-weight` (efw-maternal)
- **Метод Рудакова** — `/tools/calc/ob/fetal-weight` (efw-rudakov)
- **Шкала Бишопа** — `/tools/calc/ob/bishop` (bishop)
- **Вагинальные роды после кесарева сечения (до родов)** — `/tools/calc/ob/vbac` (vbac-pre)
- **Вагинальные роды после кесарева сечения (в родах)** — `/tools/calc/ob/vbac` (vbac-labor)
- **Риск рака молочной железы** — `/tools/calc/gyn/breast-risk` (breast-risk)
- **Риск рака шейки матки** — `/tools/calc/gyn/cervical-cancer-risk` (cervical-risk)
- **Наблюдение после кольпоскопии или лечения CIN** — `/tools/calc/gyn/cin-follow-up` (cin-follow-up)
- **Риск рака яичников** — `/tools/calc/gyn/ovarian-cancer-risk` (ovarian-risk)
- **Лекарства при беременности** — `/tools/pharmacy` (pregnancy-meds)

## 2. Реализовано частично

_Нет._

## 3. Отсутствует

_Нет._

## 4. Дубликаты

- **O-RADS US**: orads-guide, orads-wizard, orads
  - Три записи в CLINICAL_TOOLS с одним webHref /tools/calc/rads/o-rads
- **Срок по фетометрии / УЗИ (mobile)**: ga-feto, ga-us
  - ga-feto и ga-ivf в catalog.ts используют mobileAction ga_us
- **Расчёт срока беременности**: pregnancyCalc.ts (mobile), @repo/medical-calculations
  - Дублирование логики: mobile/gynecology/pregnancyCalc vs medical-calculations/pregnancyDating
- **Кольпоскопия / CIN follow-up**: colposcopy, cin-follow-up
  - cin-follow-up частично перекрывается Swede Score colposcopy
- **O-RADS / риск рака яичников**: o-rads, ovarian-risk
  - ovarian-risk ссылается на O-RADS — разные задачи, но один маршрут

## 5. Неиспользуемые калькуляторы / экраны

- **apps/mobile/src/screens/CalculatorsScreen.tsx** — Экран не подключён к навигации; используется GynHub + ToolsScreen
- **LN-RADS (web registry)** — Есть в CALCULATORS registry, нет страницы /tools/calc/rads/ln-rads
- **/calculators/[slug] generic form** — Используется для ln-rads/figo с полями; FIGO перенаправлен на /uterus-3d

## Дополнительные калькуляторы проекта (вне референса)

- **O-RADS US** (implemented) — `/tools/calc/rads/o-rads`
- **BI-RADS US** (implemented) — `/tools/calc/rads/bi-rads`
- **Кольпоскопия · Swede Score** (implemented) — `/tools/calc/gyn/colposcopy`
- **Длина шейки матки (CL)** (implemented) — `/tools/calc/ob/cervical-length`
- **Эндометрий · ISUOG / КР РФ** (implemented) — `/tools/calc/gyn/endometrium`
- **POP-Q · русская версия** (implemented) — `/tools/calc/gyn/pop-q`
- **Эластография** (implemented) — `/tools/calc/gyn/elastography`
- **TI-RADS ЩЖ** (implemented) — `/tools/calc/rads/ti-rads`
- **FMF · скрининг I–III триместра** (implemented) — `/assistant/fmf`
- **LN-RADS** (partial) — —
- **FIGO fibroid typing** (implemented) — `/uterus-3d`

---

_Информация для справки, не заменяет клиническое суждение._