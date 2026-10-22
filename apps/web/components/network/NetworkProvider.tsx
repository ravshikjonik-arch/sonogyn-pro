"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

type NetworkContextValue = {
  isOnline: boolean;
  wasOffline: boolean;
};

const NetworkContext = createContext<NetworkContextValue>({
  isOnline: true,
  wasOffline: false,
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const status = useOnlineStatus();
  return <NetworkContext.Provider value={status}>{children}</NetworkContext.Provider>;
}

export function useNetworkStatus(): NetworkContextValue {
  return useContext(NetworkContext);
}
