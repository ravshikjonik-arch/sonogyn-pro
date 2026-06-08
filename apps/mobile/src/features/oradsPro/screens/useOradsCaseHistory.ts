import { useCallback, useEffect, useState } from "react";
import { loadCaseHistory, type StoredCase } from "../storage/oradsStorage";

export function useOradsCaseHistory() {
  const [rows, setRows] = useState<StoredCase[]>([]);
  const reload = useCallback(async () => setRows(await loadCaseHistory()), []);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { rows, reload };
}
