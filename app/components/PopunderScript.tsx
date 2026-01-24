'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function PopunderScript() {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Frequency Cap Logic: 1 Hour (3600000 ms)
        const lastShown = localStorage.getItem('popunder_last_shown');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (!lastShown || (now - parseInt(lastShown) > oneHour)) {
            setShouldRender(true);
            localStorage.setItem('popunder_last_shown', now.toString());
            console.log("AdMonetization: Frequency cap passed. Rendering popunder.");
        } else {
            console.log("AdMonetization: Frequency cap active. Popunder suppressed.");
        }
    }, []);

    if (!shouldRender) return null;

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

            <Script
                id="popunder-setup"
                strategy="afterInteractive"
                src='https://pl28556211.effectivegatecpm.com/fc/25/24/fc25248fa2e42fdc7094eb2826b8d0ab.js'
            />
        </>
    );
}
