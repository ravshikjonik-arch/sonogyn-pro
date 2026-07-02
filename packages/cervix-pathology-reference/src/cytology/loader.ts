import anatomyNodes from "../../chapters/08-cytology-screening/data/anatomy-nodes.json";
import bethesdaCategories from "../../chapters/08-cytology-screening/data/bethesda-categories.json";
import clinicalAlgorithms from "../../chapters/08-cytology-screening/data/clinical-algorithms.json";
import clinicalCases from "../../chapters/08-cytology-screening/data/clinical-cases.json";
import coTestingMatrix from "../../chapters/08-cytology-screening/data/co-testing-matrix.json";
import conventionalCytology from "../../chapters/08-cytology-screening/data/conventional-cytology.json";
import dashboardTopics from "../../chapters/08-cytology-screening/data/dashboard-topics.json";
import hpvEducation from "../../chapters/08-cytology-screening/data/hpv-education.json";
import hpvTesting from "../../chapters/08-cytology-screening/data/hpv-testing.json";
import lectureSlides from "../../chapters/08-cytology-screening/data/lecture-slides.json";
import liquidCytology from "../../chapters/08-cytology-screening/data/liquid-cytology.json";
import moduleMeta from "../../chapters/08-cytology-screening/data/module-meta.json";
import samplingErrors from "../../chapters/08-cytology-screening/data/sampling-errors.json";
import samplingProtocol from "../../chapters/08-cytology-screening/data/sampling-protocol.json";
import timeline from "../../chapters/08-cytology-screening/data/timeline.json";

import type { CytologyClinicalCase, CytologyTopicId } from "./types";

export function getCytologyModuleMeta() {
  return moduleMeta;
}

export function getCytologyDashboardTopics() {
  return dashboardTopics.topics as Array<{
    id: CytologyTopicId;
    title: string;
    icon: string;
    summary: string;
  }>;
}

export function getCytologyAnatomyNodes() {
  return anatomyNodes.nodes;
}

export function getCytologyTimeline() {
  return timeline;
}

export function getCytologyHpvEducation() {
  return hpvEducation;
}

export function getCytologyLiquidCompare() {
  return liquidCytology;
}

export function getCytologyConventional() {
  return conventionalCytology;
}

export function getCytologySamplingProtocol() {
  return samplingProtocol;
}

export function getCytologySamplingErrors() {
  return samplingErrors.errors;
}

export function getCytologyBethesdaCategories() {
  return bethesdaCategories.categories;
}

export function getCytologyCoTestingMatrix() {
  return coTestingMatrix;
}

export function getCytologyHpvTesting() {
  return hpvTesting;
}

export function getCytologyClinicalAlgorithms() {
  return clinicalAlgorithms;
}

export function getCytologyClinicalCases(): CytologyClinicalCase[] {
  return clinicalCases.cases as CytologyClinicalCase[];
}

export function getCytologyLectureSlides() {
  return lectureSlides;
}
