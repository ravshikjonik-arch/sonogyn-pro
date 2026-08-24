import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AchievementsDashboard } from "@/components/achievements/AchievementsDashboard";
import { isFullOpenAccessEnabled } from "@/lib/auth/dev-account";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Звёзды и награды · SonoGyn Pro",
  description: "Бейджи, XP и уровни за обучение O-RADS, IOTA, FMF и другие модули",
};

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isFullOpenAccessEnabled()) {
    redirect("/login?redirectedFrom=/achievements");
  }

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <AchievementsDashboard />
      </div>
    </div>
  );
}
