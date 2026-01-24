'use client';

import Script from 'next/script';

export default function PopunderScript() {
    return (
        <>
            {/* 
              =======================================================================
              POP-UNDER AD SCRIPT
              =======================================================================
              Paste your Adsterra/Monetag Popunder Script below.
              It usually looks like: <script type='text/javascript' ...></script>
              
              For Next.js, we use the <Script> component. 
              If your code provides a URL source, use: src="YOUR_URL"
              If it provides inline code, use dangerouslySetInnerHTML.
              =======================================================================
            */}

            {/* Example Placeholder - REPLACE THIS WITH YOUR ACTUAL SCRIPT */}
            {/* 
            <Script 
                id="popunder-script"
                strategy="afterInteractive"
                src="//pl12345678.example.com/xx/yy/zz/script.js" 
            /> 
            */}
            {/* <script src="https://pl28556211.effectivegatecpm.com/fc/25/24/fc25248fa2e42fdc7094eb2826b8d0ab.js"></script> */}

            <Script id="popunder-setup" strategy="afterInteractive" src='https://pl28556211.effectivegatecpm.com/fc/25/24/fc25248fa2e42fdc7094eb2826b8d0ab.js'></Script>
        </>
    );
}
