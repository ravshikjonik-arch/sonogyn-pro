"use client";

import { useCallback, useEffect, useState } from "react";

import { MYOMA_COURSE_ID } from "@repo/myoma-education";

const STORAGE_KEY = "sonogyn:myoma-education:progress";

export type MyomaProgress = {
  courseId: typeof MYOMA_COURSE_ID;
  completedModuleIds: string[];
  lastModuleId: string | null;
  quizBestScore: number | null;
  updatedAt: string;
};

const EMPTY: MyomaProgress = {
  courseId: MYOMA_COURSE_ID,
  completedModuleIds: [],
  lastModuleId: null,
  quizBestScore: null,
  updatedAt: "",
};

function readProgress(): MyomaProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<MyomaProgress>;
    if (parsed.courseId !== MYOMA_COURSE_ID) return EMPTY;
    return {
      courseId: MYOMA_COURSE_ID,
      completedModuleIds: Array.isArray(parsed.completedModuleIds)
        ? parsed.completedModuleIds.filter((id): id is string => typeof id === "string")
        : [],
      lastModuleId: typeof parsed.lastModuleId === "string" ? parsed.lastModuleId : null,
      quizBestScore: typeof parsed.quizBestScore === "number" && Number.isFinite(parsed.quizBestScore) ? parsed.quizBestScore : null,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return EMPTY;
  }
}

function writeProgress(progress: MyomaProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useMyomaProgress() {
  const [progress, setProgress] = useState<MyomaProgress>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(readProgress());
    setReady(true);
  }, []);

  const visitModule = useCallback((moduleId: string) => {
    setProgress((current) => {
      if (current.lastModuleId === moduleId) return current;
      const next: MyomaProgress = {
        ...current,
        lastModuleId: moduleId,
        updatedAt: new Date().toISOString(),
      };
      writeProgress(next);
      return next;
    });
  }, []);

  const markModule = useCallback((moduleId: string) => {
    setProgress((current) => {
      const next: MyomaProgress = {
        ...current,
        completedModuleIds: current.completedModuleIds.includes(moduleId)
          ? current.completedModuleIds
          : [...current.completedModuleIds, moduleId],
        lastModuleId: moduleId,
        updatedAt: new Date().toISOString(),
      };
      writeProgress(next);
      return next;
    });
  }, []);

  const recordQuiz = useCallback((scorePercent: number) => {
    setProgress((current) => {
      const best =
        current.quizBestScore == null ? scorePercent : Math.max(current.quizBestScore, scorePercent);
      const next: MyomaProgress = {
        ...current,
        quizBestScore: best,
        updatedAt: new Date().toISOString(),
      };
      writeProgress(next);
      return next;
    });
  }, []);

  return { progress, ready, visitModule, markModule, recordQuiz };
}
