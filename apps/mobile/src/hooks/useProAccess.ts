import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppStack";
import { isProUser } from "../services/purchaseService";
import { getTrialStatus } from "../services/trialAccess";

export function useProAccess(navigation?: NavigationProp<RootStackParamList>) {
  const [isPro, setIsPro] = useState(false);
  const [source, setSource] = useState<"none" | "subscription" | "trial">("none");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      let pro = false;
      try {
        pro = await isProUser();
      } catch {
        pro = false;
      }
      if (pro) {
        setIsPro(true);
        setSource("subscription");
        return true;
      }
      const trial = await getTrialStatus();
      const allowed = trial.active;
      setIsPro(allowed);
      setSource(allowed ? "trial" : "none");
      return allowed;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requirePro = useCallback(
    async (onPro: () => void) => {
      try {
        const pro = await refresh();
        if (pro) {
          onPro();
          return;
        }
        navigation?.navigate("Paywall");
      } catch {
        Alert.alert("Проверка доступа", "Не удалось проверить статус подписки.");
      }
    },
    [navigation, refresh]
  );

  return useMemo(
    () => ({
      isPro,
      source,
      loading,
      refresh,
      requirePro,
    }),
    [isPro, source, loading, refresh, requirePro]
  );
}
