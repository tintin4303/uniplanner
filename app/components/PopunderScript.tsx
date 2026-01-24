'use client';

import { useEffect } from 'react';

export default function PopunderScript() {
    useEffect(() => {
        // 1. Check Frequency Cap
        const lastShown = localStorage.getItem('popunder_last_shown');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (lastShown && (now - parseInt(lastShown) < oneHour)) {
            const minutesLeft = Math.ceil((oneHour - (now - parseInt(lastShown))) / 60000);
            console.log(`AdMonetization: Cap ACTIVE. Ad suppressed. Next ad in ${minutesLeft} mins.`);
            return; // STOP HERE. Do not inject script.
        }

        // 2. Inject Script Manually (Bypassing Next.js <Script> to ensure no caching/prefetching issues)
        console.log("AdMonetization: Cap PASSED. Injecting Ad Script...");

        const script = document.createElement('script');
        script.src = 'https://pl28556211.effectivegatecpm.com/fc/25/24/fc25248fa2e42fdc7094eb2826b8d0ab.js';
        script.async = true;
        // script.id is not strictly needed for the ad to work, but helps us track it
        script.id = 'popunder-manual-injection';

        document.body.appendChild(script);

        // 3. Update Timestamp
        localStorage.setItem('popunder_last_shown', now.toString());

        // 4. Cleanup (Optional: remove script tag on unmount, but listeners persist)
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return null; // No UI needed
}
