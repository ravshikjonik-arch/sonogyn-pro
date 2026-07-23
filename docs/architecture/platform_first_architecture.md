# SonoGyn Pro — platform-first architecture

## Product frame

SonoGyn Pro is a clinical platform for obstetrician-gynecologists and ultrasound doctors.
It is not positioned as a calculator app. Calculators and classifications are working
tools that stay "always at hand" inside a broader professional environment.

Primary product promise:

1. Doctors chat: a WhatsApp/Telegram-like professional space for clinical discussion,
   ultrasound cases, images, videos, and peer learning.
2. AI doctor assistant: a cautious clinical assistant that helps the doctor navigate
   images, guidelines, orders, clinical recommendations, evidence, and platform tools.
3. Clinical assistants by domain: gynecology, obstetrics, and ultrasound must be
   separated so the doctor does not mix clinical tactics with measurement and
   classification tools.
4. Knowledge and education: offline-first clinical content, uploaded lessons, cases,
   references, and structured learning materials.
5. Working tools: O-RADS, BI-RADS, FMF/RU prenatal workflows, IOTA, FIGO, Doppler,
   fetometry, reports, and other point-of-care instruments.

The first release should feel like:

> Doctors chat + AI assistant, with clinical tools and evidence one tap away.

## Core UX principle

The platform is a clinical memory and navigation assistant for a doctor during a
real appointment. A doctor may forget a detail, a guideline, a measurement route,
or a recommended next step. SonoGyn Pro must reduce cognitive load, not add another
complex system to remember.

Product rule:

> The doctor should find the needed route in one or two taps.

This applies to:

- obstetric and gynecologic clinical help;
- ultrasound findings, measurements, classifications, and reports;
- orders, clinical recommendations, and international guidelines;
- evidence search and saved sources;
- education and reference materials.

Every screen should answer three questions quickly:

1. Where am I?
2. What can I do here?
3. What is the next safe clinical step?

Avoid:

- long menus with many similar items;
- exposing internal technical names;
- mixing nosology guidance with ultrasound measurement tools;
- making the doctor choose between many routes before the platform has helped
  narrow the scenario.

Preferred interaction model:

1. The doctor enters through Chat or AI Assistant.
2. AI or quick role buttons route to one of three assistants:
   - Помощник врача-гинеколога;
   - Помощник врача-акушера;
   - Помощник врача УЗИ.
3. The assistant shows a short route: what to check, what source supports it,
   and what tool or document to open next.

## Priority users

| User | Primary need | First-screen route |
| --- | --- | --- |
| Ultrasound doctor | Discuss case, upload image/video, get AI navigation, open O-RADS/BI-RADS/FMF/RU quickly | AI assistant -> Ultrasound Doctor Assistant |
| Gynecologist | Quickly orient in a gynecologic nosology, find recommendations, form next steps | AI assistant -> Gynecology Doctor Assistant |
| Obstetrician | Quickly orient in pregnancy-related nosologies, screening routes, and obstetric tactics | AI assistant -> Obstetrics Doctor Assistant |
| Young doctor/resident | Understand what to check, what is recommended, what is not recommended, and where the source is | AI assistant -> clinical navigator/education |
| Expert/mentor | Comment on cases, teach, publish structured materials | Chat/cases -> education |

## Navigation model

Main tabs:

1. Chat
2. AI Assistant
3. Clinical Tools
4. Knowledge
5. Profile/PRO

Chat remains the social core. AI Assistant is the clinical command center.
Clinical Tools should not dominate the product language, but must be fast to reach.

AI Assistant first screen:

- Search/ask field: "Что нужно найти на приёме?"
- Three primary cards:
  - Помощник врача-гинеколога;
  - Помощник врача-акушера;
  - Помощник врача УЗИ.
- Secondary quick actions:
  - Найти приказ / КР / гайдлайн;
  - Evidence / PubMed;
  - Открыть сохранённые источники;
  - Продолжить последний кейс.

The first AI Assistant screen must not be a long list of calculators. It should look
like a clinical router.

## Core modules

### 1. Doctors Chat

Required capabilities:

- channels: general, obstetrics, gynecology, ultrasound, breast, thyroid, oncology alert;
- case post type: image/video, age, clinical context, question, modality, tags;
- comments and expert replies;
- save case to education;
- ask AI about this case;
- privacy guard before uploading patient-identifiable media;
- role badges for verified doctors, moderators, experts.

### 2. AI Doctor Assistant

Assistant modes:

- Ask clinical question;
- Analyze uploaded ultrasound image or case context;
- Find guideline/order/recommendation;
- Search evidence;
- Route the doctor to the correct domain: Gynecology Doctor Assistant, Obstetrics
  Doctor Assistant, Ultrasound Doctor Assistant, Evidence, or Education;
- Open the correct ultrasound/clinical tool;
- Draft structured report text;
- Explain a route for a young doctor.

Safety boundaries:

- The assistant does not make an autonomous diagnosis.
- It should use language such as "check", "consider", "verify", "open tool", "source".
- Every clinical answer should show source type: local knowledge, guideline/order,
  PubMed/evidence, or tool output.
- Image analysis is assistive triage/navigation until validated on local datasets.

### 3. Gynecology Doctor Assistant

The document formerly referred to as "помощник от петра" should be productized as:

**Помощник врача-гинеколога**

Target structure for ingestion:

- nosology name;
- ICD-10 code;
- scenario/symptoms;
- examinations;
- recommended actions;
- not recommended actions;
- medication/treatment blocks;
- ultrasound findings;
- source/citation;
- source date/version;
- validation status.

The raw document must not be shown as one long text. It should become a searchable
clinical navigator with short cards and expandable evidence/source sections.

### 4. Obstetrics Doctor Assistant

The same imported source contains an obstetric nosology layer. It should not be
merged into ultrasound calculators or FMF/RU measurement workflows.

Product name:

**Помощник врача-акушера**

Target scope:

- pregnancy-related ICD-10/nosology entries;
- complaints and clinical situations in pregnancy;
- examinations and consultations;
- recommended and not recommended actions;
- orders, clinical recommendations, and source links;
- risk/tactics prompts;
- when to open ultrasound workflows such as fetometry, Doppler, cervical length,
  screening, or FMF/RU.

The obstetrics assistant answers clinical "what should I do / what should I check"
questions. It can send the doctor to ultrasound tools, but it should not become the
place where measurements and formulas live.

### 5. Ultrasound Doctor Assistant

Product name:

**Помощник врача УЗИ**

This is a separate domain from obstetric/gynecologic nosologies.

Product role:

- ultrasound case navigation;
- image/case context analysis;
- measurements, classifications, and structured reporting;
- "always at hand" tools for the ultrasound room.

Scope:

- O-RADS/IOTA for adnexa;
- BI-RADS for breast ultrasound;
- TI-RADS and LN-RADS where relevant;
- FIGO/MUSA/uterus mapping;
- FMF/RU prenatal ultrasound workflow;
- fetometry, Doppler, cervical length, placenta, amniotic fluid;
- report text and audit trail.

UX rule:

The user should see ultrasound tools as a separate "УЗИ" route, not as part of
gynecology or obstetric nosology cards. Clinical assistants may recommend opening a
tool; they should not hide the distinction.

### 6. Evidence Core

Evidence providers:

- PubMed via official NCBI E-utilities;
- Europe PMC / OpenAlex / Crossref / Semantic Scholar for metadata and discovery;
- Cochrane Library as links/search workflow unless API/licensing is confirmed;
- Google Scholar as external search link only, not scraping.

Evidence answer format:

1. Short practical answer.
2. Level of evidence / source type.
3. Key articles or reviews.
4. Clinical caution.
5. Link to save/bookmark.

### 7. FMF/RU Prenatal Core

Product positioning:

- not "copy FMF";
- Russian clinical prenatal ultrasound and screening workflow inside the ultrasound
  tools domain;
- source-based tables, local validation, audit trail, and clear versioning.

Required surfaces:

- first trimester workflow;
- fetometry and Doppler;
- source/version passport;
- report text;
- audit log of inputs and outputs.

## First release scope

P0 should include:

1. Chat with case posts and media.
2. AI Assistant text mode.
3. Gynecology Doctor Assistant as structured searchable knowledge.
4. Obstetrics Doctor Assistant as structured searchable knowledge.
5. Ultrasound Doctor Assistant route: O-RADS, BI-RADS, FMF/RU, IOTA/FIGO,
   fetometry/Doppler.
6. Evidence search MVP: PubMed + internal knowledge + bookmarks.

Defer:

- autonomous ultrasound image diagnosis;
- live online school/webinars;
- broad marketplace/B2B clinic admin;
- complex social ranking/gamification.

## Architecture rules

- Chat, AI, Gynecology Doctor Assistant, Obstetrics Doctor Assistant, Ultrasound
  Doctor Assistant, Knowledge, Evidence, and Education are separate domains.
- AI must call domain services; UI must not hard-code clinical logic.
- Every clinical module needs source/version metadata.
- Patient-identifiable data must pass privacy checks before upload.
- Offline education materials are preferred for the first release.
- Keep legacy calculator routes for compatibility, but change product language to
  "tools", "clinical workflows", or "working instruments".

## Cursor task prompt

Use this prompt if delegating UI work to Cursor:

```text
Refactor SonoGyn Pro product language and navigation from "calculator app" to
"doctors chat + AI assistant clinical platform". Preserve existing routes and
calculator modules, but make Chat and AI Assistant the primary product surfaces.

Tasks:
1. Mobile: keep Chat as first tab, make AI Assistant second, rename Tools copy so
   calculators are described as clinical tools always at hand.
2. Web landing: replace calculator-first messaging with doctors chat, AI assistant,
   Gynecology Doctor Assistant, Obstetrics Doctor Assistant, Ultrasound Doctor
   Assistant, and Evidence Hub.
3. Add "Помощник врача-гинеколога", "Помощник врача-акушера", and
   "Помощник врача УЗИ" as the three assistant domain names. Keep ultrasound
   calculations and classifications inside the Ultrasound Doctor Assistant domain.
4. Do not remove existing tools or routes.
5. Keep medical disclaimers: assistive CDS, not autonomous diagnosis.
```
