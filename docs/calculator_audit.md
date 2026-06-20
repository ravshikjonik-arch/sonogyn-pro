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

- **Срок беременности по менструации** — `/calculators/ob?tab=lmp` (ga-lmp)
- **Срок беременности по УЗИ** — `/calculators/ob?tab=us` (ga-us)
- **Срок беременности по овуляции/ЭКО** — `/calculators/ob?tab=ivf` (ga-ivf)
- **Срок беременности по шевелениям плода** — `/calculators/ob?tab=movement` (ga-movement)
- **Срок беременности по явке в женскую консультацию** — `/calculators/ob?tab=antenatal` (ga-antenatal)
- **Сроки декретного отпуска** — `/calculators/ob?tab=dekret` (maternity-leave)
- **Срок беременности по предполагаемой дате родов** — `/calculators/ob?tab=edd` (ga-edd)
- **Срок беременности по КТР (I триместр)** — `/calculators/ob?tab=crl` (ga-crl)
- **Срок беременности по фетометрии (II триместр)** — `/calculators/ob?tab=feto` (ga-feto)
- **Предполагаемая масса плода по антропометрии матери** — `/calculators/fetal-weight` (efw-maternal)
- **Метод Рудакова** — `/calculators/fetal-weight` (efw-rudakov)
- **Шкала Бишопа** — `/calculators/bishop` (bishop)
- **Вагинальные роды после кесарева сечения (до родов)** — `/calculators/vbac` (vbac-pre)
- **Вагинальные роды после кесарева сечения (в родах)** — `/calculators/vbac` (vbac-labor)
- **Риск рака молочной железы** — `/calculators/breast-risk` (breast-risk)
- **Риск рака шейки матки** — `/calculators/cervical-cancer-risk` (cervical-risk)
- **Наблюдение после кольпоскопии или лечения CIN** — `/calculators/cin-follow-up` (cin-follow-up)
- **Риск рака яичников** — `/calculators/ovarian-cancer-risk` (ovarian-risk)
- **Лекарства при беременности** — `/calculators/pregnancy-medications` (pregnancy-meds)

## 2. Реализовано частично

_Нет._

## 3. Отсутствует

_Нет._

## 4. Дубликаты

- **O-RADS Pro**: orads-guide, orads-wizard, orads
  - Три записи в CLINICAL_TOOLS с одним webHref /calculators/o-rads
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
- **LN-RADS (web registry)** — Есть в CALCULATORS registry, нет страницы /calculators/ln-rads
- **/calculators/[slug] generic form** — Используется для ln-rads/figo с полями; FIGO перенаправлен на /uterus-3d

## Дополнительные калькуляторы проекта (вне референса)

- **O-RADS Pro** (implemented) — `/calculators/o-rads`
- **BI-RADS US** (implemented) — `/calculators/bi-rads`
- **Кольпоскопия · Swede Score** (implemented) — `/calculators/colposcopy`
- **Длина шейки матки (CL)** (implemented) — `/calculators/cervical-length`
- **Эндометрий · ISUOG / КР РФ** (implemented) — `/calculators/endometrium`
- **POP-Q · русская версия** (implemented) — `/calculators/pop-q`
- **Эластография** (implemented) — `/calculators/elastography`
- **TI-RADS ЩЖ** (implemented) — `/calculators/ti-rads`
- **FMF · скрининг I–III триместра** (implemented) — `/assistant/fmf`
- **LN-RADS** (partial) — —
- **FIGO fibroid typing** (implemented) — `/uterus-3d`

---

_Информация для справки, не заменяет клиническое суждение._