import { createClient } from "@/utils/supabase/server";

import { LandingCareerPath } from "@/components/landing/LandingCareerPath";
import { loadCareerProgressForSession } from "@/lib/career/load-career-progress";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingGuestAccess } from "@/components/landing/LandingGuestAccess";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingPricing } from "@/components/landing/LandingPricing";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthenticated = Boolean(session);
  const career = isAuthenticated ? await loadCareerProgressForSession() : null;

  return (
    <div className="sonogyn-mesh-bg min-h-screen text-[var(--clinical-foreground)]">
      <LandingHeader isAuthenticated={isAuthenticated} />
      <LandingHero isAuthenticated={isAuthenticated} />
      <main className="mx-auto max-w-6xl space-y-28 px-4 py-20 sm:py-24">
        <LandingCareerPath isAuthenticated={isAuthenticated} progress={career?.progress} />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingGuestAccess />
        <LandingPricing isAuthenticated={isAuthenticated} />
        <LandingFaq />
        <LandingFooter isAuthenticated={isAuthenticated} />
      </main>
    </div>
  );
}
