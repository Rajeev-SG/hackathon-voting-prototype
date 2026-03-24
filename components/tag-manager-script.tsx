import Script from "next/script";

type TagManagerScriptProps = {
  gtmId: string;
  scriptOrigin: string;
};

function normalizeScriptOrigin(scriptOrigin: string) {
  return scriptOrigin.endsWith("/") ? scriptOrigin.slice(0, -1) : scriptOrigin;
}

export function TagManagerScript({ gtmId, scriptOrigin }: TagManagerScriptProps) {
  const normalizedOrigin = normalizeScriptOrigin(scriptOrigin);
  const noscriptUrl = `${normalizedOrigin}/ns.html?id=${gtmId}`;

  return (
    <>
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i,u){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),
              dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src=u + '/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer',${JSON.stringify(gtmId)},${JSON.stringify(normalizedOrigin)});
        `}
      </Script>
      <noscript>
        <iframe
          src={noscriptUrl}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
