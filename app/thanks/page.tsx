import Script from "next/script";
import { ThanksContent } from "@/components/checkout/thanks-content";

/**
 * PIXEL INSTRUCTIONS (single-file setup for /thanks):
 *
 * 1) Facebook:
 *    - Put 1 or 2 IDs in FB_PIXEL_IDS.
 *    - Set FB_CONVERSION_EVENT (e.g. "Lead" or "Purchase").
 *
 * 2) TikTok:
 *    - Put ID in TIKTOK_PIXEL_ID.
 *    - Set TIKTOK_CONVERSION_EVENT (usually "CompletePayment").
 *
 * 3) Google Ads:
 *    - Put AW ID in GOOGLE_ADS_ID (example: "AW-123456789").
 *    - Put conversion label in GOOGLE_ADS_CONVERSION_LABEL.
 *
 * 4) Conversion payload:
 *    - This file reads total and quantity from query params/sessionStorage.
 *    - Edit conversion calls in thanks-conversion script if needed.
 */

const FB_PIXEL_IDS = ["623558594791639", ""] as const; // Example: ["623558594791639", "751631801271931"]
const FB_CONVERSION_EVENT = "Lead"; // Example: "Lead" | "Purchase"

const TIKTOK_PIXEL_ID = ""; // Example: "D3NPHL3C77U93U3T0I90"
const TIKTOK_CONVERSION_EVENT = "CompletePayment";

const GOOGLE_ADS_ID = ""; // Example: "AW-123456789"
const GOOGLE_ADS_CONVERSION_LABEL = ""; // Example: "AbCdEfGhIjKlMnOpQrSt"

const activeFbIds = FB_PIXEL_IDS.map((id) => id.trim()).filter(Boolean);
const hasTikTok = TIKTOK_PIXEL_ID.trim().length > 0;
const hasGoogleAds = GOOGLE_ADS_ID.trim().length > 0;
const hasGoogleConversion = hasGoogleAds && GOOGLE_ADS_CONVERSION_LABEL.trim().length > 0;

export default function ThanksPage() {
  return (
    <>
      {activeFbIds.length > 0 ? (
        <Script id="thanks-fb-base" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          ${activeFbIds.map((id) => `fbq('init', '${id}');`).join("\n")}
          fbq('track', 'PageView');`}
        </Script>
      ) : null}

      {hasTikTok ? (
        <Script id="thanks-tiktok-base" strategy="afterInteractive">
          {`!function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
            ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
            ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
            n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;
            e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
            ttq.load('${TIKTOK_PIXEL_ID}');
            ttq.page();
          }(window, document, 'ttq');`}
        </Script>
      ) : null}

      {hasGoogleAds ? (
        <>
          <Script
            id="thanks-google-ads-lib"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          />
          <Script id="thanks-google-ads-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = window.gtag || gtag;
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');`}
          </Script>
        </>
      ) : null}

      {(activeFbIds.length > 0 || hasTikTok || hasGoogleConversion) ? (
        <Script id="thanks-conversion-events" strategy="afterInteractive">
          {`(function () {
            if (window.__fmThanksConversionSent) return;
            window.__fmThanksConversionSent = true;

            var params = new URLSearchParams(window.location.search || "");
            var total = Number(params.get("total") || window.sessionStorage.getItem("fm_last_order_total") || 0);
            var quantity = Number(params.get("quantity") || window.sessionStorage.getItem("fm_last_order_qty") || 0);
            if (!Number.isFinite(total)) total = 0;
            if (!Number.isFinite(quantity)) quantity = 0;

            if (typeof window.fbq === "function") {
              window.fbq("track", "${FB_CONVERSION_EVENT}", { value: total, currency: "UAH" });
            }

            if (window.ttq && typeof window.ttq.track === "function") {
              window.ttq.track("${TIKTOK_CONVERSION_EVENT}", { value: total, currency: "UAH", quantity: quantity });
            }

            ${
              hasGoogleConversion
                ? `if (typeof window.gtag === "function") {
              window.gtag("event", "conversion", {
                send_to: "${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSION_LABEL}",
                value: total,
                currency: "UAH"
              });
            }`
                : ""
            }
          })();`}
        </Script>
      ) : null}

      {activeFbIds.map((id, index) => (
        <noscript key={`fb-noscript-${id}-${index}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      ))}

      <ThanksContent />
    </>
  );
}
