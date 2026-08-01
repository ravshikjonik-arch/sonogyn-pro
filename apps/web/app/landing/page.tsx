import { createClient } from "@/utils/supabase/server";

import { LandingCareerPath } from "@/components/landing/LandingCareerPath";
import { loadCareerProgressForSession } from "@/lib/career/load-career-progress";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingGuestAccess } from "@/components/landing/LandingGuestAccess";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingMarketingHero } from "@/components/landing/LandingMarketingHero";
import { LandingPricing } from "@/components/landing/LandingPricing";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthenticated = Boolean(session);
  const career = isAuthenticated ? await loadCareerProgressForSession() : null;

  return (
    <div className="min-h-screen bg-[#05030a] text-[var(--clinical-foreground)]">
      <LandingHeader isAuthenticated={isAuthenticated} variant="marketing" />
      <LandingMarketingHero isAuthenticated={isAuthenticated} />
      <main className="sonogyn-mesh-bg mx-auto max-w-6xl space-y-28 px-4 py-20 sm:py-24">
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
