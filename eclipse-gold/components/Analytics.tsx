import Script from 'next/script'

/**
 * Lightweight analytics scaffold. The site owner only needs to set one env var
 * (no code change required):
 *   - NEXT_PUBLIC_GA_ID            -> loads Google Analytics 4 (gtag.js)
 *   - NEXT_PUBLIC_PLAUSIBLE_DOMAIN -> loads the privacy-friendly Plausible script
 * If neither is set, nothing is rendered.
 */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

  if (gaId) {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
        </Script>
      </>
    )
  }

  if (plausibleDomain) {
    return (
      <Script
        defer
        data-domain={plausibleDomain}
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
    )
  }

  return null
}
