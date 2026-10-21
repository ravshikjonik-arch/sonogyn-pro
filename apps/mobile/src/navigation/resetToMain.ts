import type { NavigationProp } from "@react-navigation/native";

import {
  hasAuthenticatedDoctor,
  isMobileRegistrationRequired,
  postOnboardingRoute,
} from "../lib/auth/mobileAuthGate";
import type { Session } from "@supabase/supabase-js";
import type { RootStackParamList } from "./paramLists";

export function resetAfterOnboarding(
  navigation: NavigationProp<RootStackParamList>,
  session: Session | null,
) {
  const route = postOnboardingRoute(session);
  navigation.reset({ index: 0, routes: [{ name: route }] });
}

export function resetAfterSuccessfulAuth(
  navigation: NavigationProp<RootStackParamList>,
  session: Session | null,
) {
  if (!hasAuthenticatedDoctor(session) && isMobileRegistrationRequired()) {
    navigation.reset({ index: 0, routes: [{ name: "SupabaseAuth" }] });
    return;
  }
  navigation.reset({ index: 0, routes: [{ name: "Main" }] });
}
