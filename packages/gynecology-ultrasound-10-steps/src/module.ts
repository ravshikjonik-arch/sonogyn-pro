import raw from "./protocol-content.json";
import type { GynecologyUltrasound10Module } from "./types";

export const GYNECOLOGY_ULTRASOUND_10_STEPS_MODULE = raw as GynecologyUltrasound10Module;

export function getOrderedSteps(): GynecologyUltrasound10Module["steps"] {
  return [...GYNECOLOGY_ULTRASOUND_10_STEPS_MODULE.steps].sort((a, b) => a.order - b.order);
}

export function getStepById(stepId: string) {
  return GYNECOLOGY_ULTRASOUND_10_STEPS_MODULE.steps.find((s) => s.id === stepId);
}
