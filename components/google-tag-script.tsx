import Script from "next/script";

type GoogleTagScriptProps = {
  measurementId: string;
  serverContainerUrl: string;
  linkerDomains: string[];
};

export function GoogleTagScript({
  measurementId,
  serverContainerUrl,
  linkerDomains
}: GoogleTagScriptProps) {
  return (
    <>
      <Script
        id="google-tag-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};
          window.gtag('js', new Date());
          window.gtag('config', '${measurementId}', {
            send_page_view: false,
            cookie_domain: 'auto',
            allow_google_signals: false,
            linker: { domains: ${JSON.stringify(linkerDomains)} },
            server_container_url: '${serverContainerUrl}'
          });
        `}
      </Script>
    </>
  );
}
