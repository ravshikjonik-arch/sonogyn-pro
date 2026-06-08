import { Asset } from "expo-asset";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { UTERUS_GLB_MODULE } from "./uterusGlbModule";

export function useNativeGlbAssetUri(): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" || UTERUS_GLB_MODULE == null) {
      setUri(null);
      return;
    }

    const asset = Asset.fromModule(UTERUS_GLB_MODULE);
    let cancelled = false;
    void asset.downloadAsync().then(() => {
      if (cancelled) return;
      setUri(asset.localUri ?? asset.uri ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return uri;
}
