import anatomyCriteria from "../../chapters/01-anatomy/data/criteria.json";
import anatomyDoctor from "../../chapters/01-anatomy/doctor-quickref.md";
import anatomyStudent from "../../chapters/01-anatomy/student-guide.md";
import diagnosticsCriteria from "../../chapters/02-diagnostics/data/criteria.json";
import diagnosticsDoctor from "../../chapters/02-diagnostics/doctor-quickref.md";
import diagnosticsStudent from "../../chapters/02-diagnostics/student-guide.md";
import benignCriteria from "../../chapters/03-benign-conditions/data/criteria.json";
import benignDoctor from "../../chapters/03-benign-conditions/doctor-quickref.md";
import benignStudent from "../../chapters/03-benign-conditions/student-guide.md";
import treatmentCriteria from "../../chapters/04-treatment-methods/data/criteria.json";
import treatmentDoctor from "../../chapters/04-treatment-methods/doctor-quickref.md";
import treatmentStudent from "../../chapters/04-treatment-methods/student-guide.md";
import specialCriteria from "../../chapters/05-special-populations/data/criteria.json";
import specialDoctor from "../../chapters/05-special-populations/doctor-quickref.md";
import specialStudent from "../../chapters/05-special-populations/student-guide.md";
import precancerousCriteria from "../../chapters/06-precancerous/data/criteria.json";
import precancerousDoctor from "../../chapters/06-precancerous/doctor-quickref.md";
import precancerousStudent from "../../chapters/06-precancerous/student-guide.md";
import cancerCriteria from "../../chapters/07-cervical-cancer/data/criteria.json";
import cancerDoctor from "../../chapters/07-cervical-cancer/doctor-quickref.md";
import cancerStudent from "../../chapters/07-cervical-cancer/student-guide.md";

import { CERVIX_CHAPTER_CATALOG } from "./catalog";
import type { CervixChapterContent, CervixChapterId } from "./types";

const CONTENT: Record<CervixChapterId, Pick<CervixChapterContent, "studentGuide" | "doctorQuickref" | "criteria">> = {
  "01-anatomy": {
    studentGuide: anatomyStudent,
    doctorQuickref: anatomyDoctor,
    criteria: anatomyCriteria as Record<string, unknown>,
  },
  "02-diagnostics": {
    studentGuide: diagnosticsStudent,
    doctorQuickref: diagnosticsDoctor,
    criteria: diagnosticsCriteria as Record<string, unknown>,
  },
  "03-benign-conditions": {
    studentGuide: benignStudent,
    doctorQuickref: benignDoctor,
    criteria: benignCriteria as Record<string, unknown>,
  },
  "04-treatment-methods": {
    studentGuide: treatmentStudent,
    doctorQuickref: treatmentDoctor,
    criteria: treatmentCriteria as Record<string, unknown>,
  },
  "05-special-populations": {
    studentGuide: specialStudent,
    doctorQuickref: specialDoctor,
    criteria: specialCriteria as Record<string, unknown>,
  },
  "06-precancerous": {
    studentGuide: precancerousStudent,
    doctorQuickref: precancerousDoctor,
    criteria: precancerousCriteria as Record<string, unknown>,
  },
  "07-cervical-cancer": {
    studentGuide: cancerStudent,
    doctorQuickref: cancerDoctor,
    criteria: cancerCriteria as Record<string, unknown>,
  },
};

const chapters: CervixChapterContent[] = CERVIX_CHAPTER_CATALOG.map((meta) => ({
  ...meta,
  ...CONTENT[meta.id],
}));

export function getCervixChapters(): CervixChapterContent[] {
  return chapters;
}

export function getCervixChapter(id: CervixChapterId): CervixChapterContent | undefined {
  return chapters.find((c) => c.id === id);
}

export function getDefaultCervixChapterId(): CervixChapterId {
  return "01-anatomy";
}
