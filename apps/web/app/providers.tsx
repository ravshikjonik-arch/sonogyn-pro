"use client";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchAuthSession } from "@/lib/auth/client-auth-api";
import { createClient } from "@/utils/supabase/client";

const SupabaseContext = createContext<SupabaseClient | null>(null);

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /** False until first session resolve (use for global splash). */
  ready: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapServerUser(raw: Record<string, unknown> | null): User | null {
  if (!raw?.id || typeof raw.id !== "string") return null;
  return raw as unknown as User;
}

function SupabaseEnvMissing() {
  return (
    <div className="min-h-screen bg-slate-100 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-300 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-bold text-slate-950">Не подключён Supabase в браузере</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          Переменные <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> и{" "}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> не попали в клиентский
          бандл (пустые, неверный URL или файл не там, где ждёт Next.js).
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            Файл должен быть <strong className="font-semibold">apps/web/.env.local</strong> (не только в корне
            монорепы).
          </li>
          <li>
            Без кавычек вокруг значений. После правки — <strong className="font-semibold">полный перезапуск</strong>{" "}
            <code className="rounded bg-slate-100 px-1">pnpm dev</code>.
          </li>
          <li>
            Ключ: JWT <code className="rounded bg-slate-100 px-1">eyJ…</code> (anon) или publishable из Dashboard →
            Settings → API.
          </li>
        </ul>
      </div>
    </div>
  );
}

function AuthStateInner({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const { user: serverUser } = await fetchAuthSession();
    const mapped = mapServerUser(serverUser);
    setUser(mapped);

    if (mapped) {
      const { data } = await supabase.auth.getSession();
      if (data.session) return;
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { user: serverUser } = await fetchAuthSession();
      if (!mounted) return;
      setUser(mapServerUser(serverUser));
      setReady(true);
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setUser(next?.user ?? null);
      setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const session = useMemo<Session | null>(() => {
    if (!user) return null;
    return { user } as Session;
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      ready,
      refresh,
    }),
    [session, user, ready, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  if (!supabase) {
    return <SupabaseEnvMissing />;
  }

  return (
    <SupabaseContext.Provider value={supabase}>
      <AuthStateInner>{children}</AuthStateInner>
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const supabase = useContext(SupabaseContext);

  if (!supabase) {
    throw new Error("useSupabase must be used within SessionProvider");
  }

  return supabase;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within SessionProvider");
  }
  return ctx;
}
