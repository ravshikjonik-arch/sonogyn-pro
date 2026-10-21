import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect } from "react";

import {
  hasAuthenticatedDoctor,
  isMobileRegistrationRequired,
} from "../lib/auth/mobileAuthGate";
import { useAppGate } from "./AppGateContext";
import type { RootStackParamList } from "./paramLists";
import MainTabs from "./MainTabs";

/**
 * На iOS/Android с EXPO_PUBLIC_MOBILE_REQUIRE_REGISTRATION=true
 * не пускаем в кабинет без Supabase-сессии.
 */
export default function MainTabsWithAuthGate() {
  const { supabaseSession, supabaseReady } = useAppGate();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!supabaseReady) return;
    if (!isMobileRegistrationRequired()) return;
    if (hasAuthenticatedDoctor(supabaseSession)) return;
    navigation.reset({ index: 0, routes: [{ name: "SupabaseAuth" }] });
  }, [navigation, supabaseReady, supabaseSession]);

  if (isMobileRegistrationRequired() && supabaseReady && !hasAuthenticatedDoctor(supabaseSession)) {
    return null;
  }

  return <MainTabs />;
}
