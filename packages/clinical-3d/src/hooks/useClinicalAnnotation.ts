import { useCallback, useState } from "react";

import type { OrganAnnotation } from "../types";

export function useClinicalAnnotation<T extends OrganAnnotation>(initial: T[] = []) {
  const [annotations, setAnnotations] = useState<T[]>(initial);

  const add = useCallback((item: T) => {
    setAnnotations((prev) => [...prev, item]);
  }, []);

  const remove = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { annotations, add, remove, setAnnotations };
}
