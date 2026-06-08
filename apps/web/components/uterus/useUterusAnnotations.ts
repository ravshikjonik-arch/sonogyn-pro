"use client";

import { useCallback, useMemo, useState } from "react";
import * as THREE from "three";

import {
  DEFAULT_MODEL_SCALE,
  enrichAnnotation,
  generateProtocolText,
  suggestFigoAlternatives,
  type PathologyAnnotation,
  type PathologyType,
  defaultPathologyAnnotation,
} from "@clinical/uterus";

export type UterusVisualizationState = {
  modelScale: number;
  annotations: PathologyAnnotation[];
  snapshotDataUrl?: string;
};

export function useUterusAnnotations(initial?: UterusVisualizationState) {
  const [modelScale, setModelScale] = useState(initial?.modelScale ?? DEFAULT_MODEL_SCALE);
  const [annotations, setAnnotations] = useState<PathologyAnnotation[]>(initial?.annotations ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | undefined>(initial?.snapshotDataUrl);
  const [placeMode, setPlaceMode] = useState<PathologyType>("myoma");

  const selected = useMemo(
    () => annotations.find((a) => a.id === selectedId) ?? null,
    [annotations, selectedId],
  );

  const selectedEnriched = useMemo(
    () => (selected ? enrichAnnotation(selected) : null),
    [selected],
  );

  const figoAlternatives = useMemo(() => {
    if (!selectedEnriched || selectedEnriched.type !== "myoma") return [];
    const figo = selectedEnriched.figoOverride ?? selectedEnriched.figoType ?? 4;
    return suggestFigoAlternatives(figo);
  }, [selectedEnriched]);

  const protocolText = useMemo(() => generateProtocolText(annotations), [annotations]);

  const addAt = useCallback(
    (
      local: THREE.Vector3,
      type: PathologyType = placeMode,
      patch?: Partial<PathologyAnnotation>,
    ) => {
      const a = defaultPathologyAnnotation(type, [local.x, local.y, local.z]);
      const enriched = enrichAnnotation({ ...a, ...patch });
      setAnnotations((prev) => [...prev, enriched]);
      setSelectedId(enriched.id);
      return enriched;
    },
    [placeMode],
  );

  const updateSelected = useCallback((patch: Partial<PathologyAnnotation>) => {
    if (!selectedId) return;
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id !== selectedId) return a;
        const merged = enrichAnnotation({ ...a, ...patch });
        return merged;
      }),
    );
  }, [selectedId]);

  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    setAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const commitPosition = useCallback((id: string, local: THREE.Vector3) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === id
          ? enrichAnnotation({ ...a, position: [local.x, local.y, local.z] })
          : a,
      ),
    );
  }, []);

  const exportState = useCallback(
    (): UterusVisualizationState => ({
      modelScale,
      annotations,
      snapshotDataUrl,
    }),
    [modelScale, annotations, snapshotDataUrl],
  );

  return {
    modelScale,
    setModelScale,
    annotations,
    setAnnotations,
    selectedId,
    setSelectedId,
    selected,
    selectedEnriched,
    figoAlternatives,
    protocolText,
    placeMode,
    setPlaceMode,
    snapshotDataUrl,
    setSnapshotDataUrl,
    addAt,
    updateSelected,
    removeSelected,
    commitPosition,
    exportState,
  };
}
