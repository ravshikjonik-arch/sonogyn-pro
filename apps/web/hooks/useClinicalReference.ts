"use client";

import { useCallback, useMemo } from "react";

import {
  getClinicalReference,
  getFieldHelp,
  getTopic,
  getTopicsBySection,
  searchReference,
  type ClinicalTopic,
  type ReferenceSearchHit,
} from "@/lib/reference/referenceService";

export function useClinicalReference() {
  const index = useMemo(() => getClinicalReference(), []);
  const sections = useMemo(() => getTopicsBySection(index), [index]);

  const search = useCallback((query: string) => searchReference(index, query), [index]);

  const topic = useCallback((id: string) => getTopic(index, id), [index]);

  const fieldHelp = useCallback((fieldName: string) => getFieldHelp(fieldName), []);

  return { index, sections, search, topic, fieldHelp };
}

export type { ClinicalTopic, ReferenceSearchHit } from "@repo/clinical-reference";
