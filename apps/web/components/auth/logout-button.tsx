"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSupabase } from "@/app/providers";

export function LogoutButton() {
  const router = useRouter();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      const { wipeWebClinicalLocalData } = await import("@/lib/security/wipe-clinical-local");
      wipeWebClinicalLocalData();
      await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" });
      await supabase.auth.signOut();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={onLogout}
      disabled={loading}
    >
      {loading ? "Выходим..." : "Выйти"}
    </button>
  );
}
