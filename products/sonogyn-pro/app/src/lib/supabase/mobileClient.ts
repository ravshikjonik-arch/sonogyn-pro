import { createClient } from "@supabase/supabase-js";

import { secureAuthStorage } from "../security/secureAuthStorage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Expo-safe Supabase client: PKCE session in SecureStore (native) / AsyncStorage (web).
 */
export const supabaseMobile =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: secureAuthStorage,
          storageKey: "sonogyn-supabase-auth",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: "pkce",
        },
      })
    : null;
