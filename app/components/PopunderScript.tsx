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
            console.log("AdMonetization: Frequency cap passed. Rendering popunder.");
            setShouldRender(true);
            localStorage.setItem('popunder_last_shown', now.toString());
        } else {
            const minutesLeft = Math.ceil((oneHour - (now - parseInt(lastShown))) / 60000);
            console.log(`AdMonetization: Frequency cap active. Popunder suppressed. Next ad available in ${minutesLeft} mins.`);
        }
    }, []);

    // Cleanup: Remove script from DOM on unmount to prevent SPA leaks (though global listeners may persist)
    useEffect(() => {
        if (!shouldRender) return;
        return () => {
            const scriptTag = document.getElementById('popunder-setup');
            if (scriptTag) {
                console.log("AdMonetization: Cleaning up popunder script tag.");
                scriptTag.remove();
            }
        };
    }, [shouldRender]);

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
