import { useCallback } from "react";

export function useOrganInteraction(onSelect?: (id: string) => void) {
  const handleSelect = useCallback(
    (id: string) => {
      onSelect?.(id);
    },
    [onSelect],
  );
  return { handleSelect };
}
