# Cervical Pathology Intelligence — Pseudocode

## Clinical Decision Engine

```
FUNCTION runCpiClinicalDecision(patient: CpiPatientInput) -> CpiDecisionResult:

  // ── Block 1: IFCPC Colposcopy ──
  grade1 = COUNT(ifcpc signs WHERE section = abnormal_grade1)
  grade2 = COUNT(ifcpc signs WHERE section = abnormal_grade2)
  invasion = ANY(ifcpc signs WHERE section = suspicious_invasion)
  colposcopyConclusion = FORMAT(TZ, SCJ, grade2, invasion, adequacy)

  // ── Block 2: HPV Risk Engine ──
  hpvBand = LOOKUP(hpv16, hpv18, hpv31/33/45/52/58, cytology)
  // e.g. LSIL + HPV(-) → low; LSIL + HPV16 → high

  // ── Block 3: Bethesda Cytology ──
  // merged into risk model + rules

  // ── Block 4: AIS / Glandular ──
  IF cytology IN (AGC, AIS) OR glandularSuspicion OR hpv18:
    glandularAlert = "ECC + excision pathway"

  // ── Block 5: TZ3 Expert ──
  IF tz3 OR scj_not_visible:
    IF hpv16 OR hsil OR asc_h:
      tz3Alert = "High risk missed CIN3+/AIS → ECC or diagnostic excision"

  // ── Block 6: AI Colposcopy (future) ──
  IF aiColposcopyEnabled:
    MERGE aiSuggestedSignIds INTO ifcpcFindingSignIds (optional)

  // ── Block 7: Quality Score ──
  qualityScore = SUM(photo_pre, photo_acetic, photo_schiller, tz_doc, adequacy, scj) // max 100

  // ── Block 8: Risk Calculator ──
  risk = calculateCinRisk(merged inputs)  // multinomial logit → CIN1…invasion

  ctx = { input, flags, risk, hpv, quality, alerts... }

  // ── JSON Rules Engine ──
  matchedRules = []
  FOR rule IN rules SORT BY priority DESC:
    IF evaluate(rule.when, ctx):
      matchedRules.APPEND(rule)

  actions = MERGE_DEDUPE(matchedRules.actions) ORDER BY clinical urgency

  explanation = {
    decisionTreePath: [block traces + matched rule ids],
    matchedRules: [{ id, title, explanation, sources }],
    sources: UNION(rule.sourceIds)
  }

  RETURN CpiDecisionResult(actions, risk, explanation, ...)
```

## Rule condition evaluation

```
FUNCTION evaluate(condition, ctx):
  IF condition.all:  RETURN ALL(evaluate(c, ctx) FOR c IN condition.all)
  IF condition.any:  RETURN ANY(evaluate(c, ctx) FOR c IN condition.any)
  actual = GET(ctx, condition.field)  // dot path e.g. risk.cin2plus
  SWITCH condition.op:
    eq / neq / gt / gte / lt / lte / in / includes
```

## Decision tree (simplified)

```
                    [Patient Input]
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    Invasion signs?    AIS/AGC?         TZ3+HSIL/HPV16?
         │                │                │
         ▼                ▼                ▼
  oncology + bx    ECC+conization    ECC+conization
         │                │                │
         └────────────────┼────────────────┘
                          ▼
                   HSIL / major IFCPC?
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
        targeted_biopsy          CIN2+ on bx?
              │                       │
              │                       ▼
              │                  LLETZ/conization
              ▼
    LSIL+HPV(-) / NILM → observation + HPV 12mo
```
