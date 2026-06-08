import type { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

export type AppGateValue = {
  consentOk: boolean;
  supabaseReady: boolean;
  supabaseSession: Session | null;
  refreshSupabaseSession: () => Promise<void>;
};

const defaultRefresh = async () => {};

export const AppGateContext = createContext<AppGateValue>({
  consentOk: false,
  supabaseReady: false,
  supabaseSession: null,
  refreshSupabaseSession: defaultRefresh,
});

export function useAppGate(): AppGateValue {
  return useContext(AppGateContext);
}
