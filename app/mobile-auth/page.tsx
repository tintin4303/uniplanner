"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function MobileAuth() {
  const { data: session, status } = useSession();
  const [expoUrl, setExpoUrl] = useState("");

  useEffect(() => {
    // 1. AUTO-LOGIN GOOGLE
    if (status === "unauthenticated") {
      signIn("google");
    }

    // 2. PREPARE REDIRECT LINK
    if (status === "authenticated" && session) {
      const userData = encodeURIComponent(JSON.stringify({
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
        tokens: (session.user as any).tokens || 0
      }));

      // ⚠️ REPLACE THIS IP WITH THE ONE FROM YOUR TERMINAL ⚠️
      // Example: exp://192.168.1.45:8081/--/auth?user=...
      const YOUR_EXPO_IP = "192.168.1.105:8081"; // <--- UPDATE THIS!
      
      const fullUrl = `exp://${YOUR_EXPO_IP}/--/auth?user=${userData}`;
      setExpoUrl(fullUrl);

      // Attempt Auto-Redirect after 1 second
      const timer = setTimeout(() => {
          window.location.href = fullUrl;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, session]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-2">UniPlanner Bridge</h1>
        
        {status === "loading" && <p className="text-slate-400">Verifying...</p>}
        
        {status === "unauthenticated" && (
           <p>Redirecting to Google...</p>
        )}

        {status === "authenticated" && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
                <p className="font-bold text-lg text-green-400">Login Successful!</p>
                <p className="text-slate-400 text-sm mt-2">Opening App...</p>
            </div>
            
            {/* MANUAL BUTTON - CLICK THIS IF STUCK */}
            <a 
                href={expoUrl}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors"
            >
              Open Mobile App
            </a>
            
            <p className="text-xs text-slate-500">
              Stuck? Click the button above manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}