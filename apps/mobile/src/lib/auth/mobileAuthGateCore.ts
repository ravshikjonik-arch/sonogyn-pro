import type { Session } from "@supabase/supabase-js";

import type { RootStackParamList } from "../../navigation/paramLists";

export function hasAuthenticatedDoctor(session: Session | null | undefined): boolean {
  if (!session?.user?.id) return false;
  if (session.user.is_anonymous) return false;
  return true;
}

export function postOnboardingRouteCore(
  session: Session | null,
  registrationRequired: boolean,
): keyof RootStackParamList {
  if (registrationRequired && !hasAuthenticatedDoctor(session)) {
    return "SupabaseAuth";
  }
  return "Main";
}
