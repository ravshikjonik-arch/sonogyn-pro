"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

import { readGaMeasurementId, readYandexMetrikaId } from "@/lib/analytics/config";
import {
  ANALYTICS_CONSENT_EVENT,
  hasAnalyticsConsentGranted,
  readAnalyticsConsent,
} from "@/lib/privacy/analytics-consent";

/**
 * YM + GA4 только после согласия. Без ID в env — ничего не рендерим.
 * До согласия сетевых запросов к mc.yandex / googletagmanager нет.
 */
export function AnalyticsScripts() {
  const [allowed, setAllowed] = useState(false);
  const ymId = readYandexMetrikaId();
  const gaId = readGaMeasurementId();

  useEffect(() => {
    function sync() {
      setAllowed(hasAnalyticsConsentGranted());
    }
    sync();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
  }, []);

  if (!allowed || readAnalyticsConsent() !== "granted") return null;
  if (!ymId && !gaId) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="sonogyn-ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', { anonymize_ip: true });
          `}</Script>
        </>
      ) : null}
      {ymId ? (
        <Script id="sonogyn-ym" strategy="afterInteractive">{`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
          ym(${ymId}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:false });
        `}</Script>
      ) : null}
    </>
  );
}
