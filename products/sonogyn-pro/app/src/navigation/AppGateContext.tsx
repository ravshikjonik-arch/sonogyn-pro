import { createContext, useContext } from "react";

export type AppGateValue = {
  consentOk: boolean;
};

export const AppGateContext = createContext<AppGateValue>({ consentOk: false });

export function useAppGate(): AppGateValue {
  return useContext(AppGateContext);
}
