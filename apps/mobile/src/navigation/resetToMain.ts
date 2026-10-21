import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { hasAuthenticatedDoctor, postOnboardingRoute } from "../lib/auth/mobileAuthGate";
import type { Session } from "@supabase/supabase-js";
import type { RootStackParamList } from "./paramLists";

export function resetAfterOnboarding(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  session: Session | null,
) {
  const route = postOnboardingRoute(session);
  navigation.reset({ index: 0, routes: [{ name: route }] });
}

export function resetAfterSuccessfulAuth(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  session: Session | null,
) {
  if (!hasAuthenticatedDoctor(session)) {
    navigation.reset({ index: 0, routes: [{ name: "SupabaseAuth" }] });
    return;
  }
  navigation.reset({ index: 0, routes: [{ name: "Main" }] });
}
