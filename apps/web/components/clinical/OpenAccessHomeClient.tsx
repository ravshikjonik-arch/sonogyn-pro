"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/app/providers";
import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";
import {
  AUTHENTICATED_HOME_PATH,
  isOpenAccessDemoUser,
} from "@/lib/nav/post-auth-landing";

const CommandCenter = dynamic(
  () => import("@/components/spatial/CommandCenter").then((mod) => mod.CommandCenter),
  { ssr: false, loading: () => <CabinetBootScreen /> },
);

export function OpenAccessHomeClient() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stayOnOpenHome = searchParams.get("open") === "1";

  useEffect(() => {
    if (!ready || !user || stayOnOpenHome || isOpenAccessDemoUser(user)) return;
    router.replace(AUTHENTICATED_HOME_PATH);
  }, [ready, user, stayOnOpenHome, router]);

  if (!ready) {
    return <CabinetBootScreen />;
  }

  if (user && !stayOnOpenHome && !isOpenAccessDemoUser(user)) {
    return <CabinetBootScreen />;
  }

  return <CommandCenter />;
}
