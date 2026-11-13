import { redirect } from "next/navigation";

import { LandingCareerPath } from "@/components/landing/LandingCareerPath";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingGuestAccess } from "@/components/landing/LandingGuestAccess";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingMarketingHero } from "@/components/landing/LandingMarketingHero";
import { LandingPopularCalculators } from "@/components/landing/LandingPopularCalculators";
import { LandingPricing } from "@/components/landing/LandingPricing";
import {
  canDevAutoLoginRedirect,
  getDevLoginConfig,
  isDevAutoLoginEnabled,
  isDevSkipAuthEnabled,
} from "@/lib/auth/dev-account";
import { loadCareerProgressForSession } from "@/lib/career/load-career-progress";
import { landingPageMetadata } from "@/lib/seo/landing-metadata";
import { resolvePublicSiteUrl } from "@/lib/seo/build-public-metadata";
import { createClient } from "@/utils/supabase/server";

export const metadata = landingPageMetadata;

const siteUrl = resolvePublicSiteUrl();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "SonoGyn Pro",
      url: siteUrl,
      email: "support@sonogyn-pro.ru",
      description:
        "Клиническая платформа поддержки решений для врачей УЗИ и акушерства-гинекологии.",
    },
    {
      "@type": "WebApplication",
      name: "SonoGyn Pro",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      url: siteUrl,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "RUB",
        description: "Открытый доступ к калькуляторам и справочникам для специалистов",
      },
      audience: {
        "@type": "Audience",
        audienceType: "Healthcare professionals",
      },
    },
  ],
};

/**
 * Публичный маркетинг на `/` (SEO). Dev-обходы — в кабинет.
 */
export default async function RootPage() {
  if (isDevSkipAuthEnabled()) {
    redirect("/app");
  }

  if (canDevAutoLoginRedirect()) {
    redirect("/api/auth/dev-login?next=/app");
  }

  if (isDevAutoLoginEnabled() && getDevLoginConfig() && !canDevAutoLoginRedirect()) {
    redirect("/login?dev_setup=service_role");
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthenticated = Boolean(session);
  const career = isAuthenticated ? await loadCareerProgressForSession() : null;

  return (
    <div
      data-marketing-shell="true"
      className="min-h-screen bg-[#05030a] text-slate-100"
      aria-label="Маркетинговая страница (фиксированная тёмная тема)"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingHeader isAuthenticated={isAuthenticated} variant="marketing" />
      <main id="main-content">
        <LandingMarketingHero isAuthenticated={isAuthenticated} />
        <div className="sonogyn-mesh-bg mx-auto max-w-6xl space-y-28 px-4 py-20 sm:py-24">
          <LandingCareerPath isAuthenticated={isAuthenticated} progress={career?.progress} />
          <LandingPopularCalculators />
          <LandingFeatures />
          <LandingHowItWorks />
          <LandingGuestAccess />
          <LandingPricing isAuthenticated={isAuthenticated} />
          <LandingFaq />
          <LandingFooter isAuthenticated={isAuthenticated} />
        </div>
      </main>
    </div>
  );
}
