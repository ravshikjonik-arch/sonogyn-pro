import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import type { UserProfile } from "../features/case/types";
import { ensureAnonymousAuth } from "../services/firebase/authService";
import { requireFirestore } from "../services/firebase/firebase";
import { getOrCreateUserProfile, starsByLevel } from "../services/firebase/gamificationService";

export function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = () => {};
    let active = true;

    async function start() {
      try {
        setLoading(true);
        const authUser = await ensureAnonymousAuth();
        const profile = await getOrCreateUserProfile(authUser.uid);
        if (!active) return;
        setUser(profile);
        const fs = requireFirestore();
        stop = onSnapshot(doc(fs, "users", authUser.uid), (snap) => {
          if (!active || !snap.exists()) return;
          const data = snap.data() as UserProfile;
          setUser({
            id: authUser.uid,
            points: data.points ?? 0,
            level: data.level ?? 1,
            name: data.name ?? profile.name,
          });
          setLoading(false);
        });
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Не удалось загрузить профиль");
        setLoading(false);
      }
    }

    void start();
    return () => {
      active = false;
      stop();
    };
  }, []);

  return useMemo(
    () => ({
      user,
      loading,
      error,
      stars: starsByLevel(user?.level ?? 1),
    }),
    [user, loading, error]
  );
}
