"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MobileAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("google"); // Auto-trigger Google Login
    }

    if (status === "authenticated" && session) {
      // ⚠️ REDIRECT BACK TO APP
      // We pass the user data as a JSON string in the URL
      const userData = encodeURIComponent(JSON.stringify({
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
        tokens: (session.user as any).tokens || 0
      }));

      // If testing in Expo Go, use exp://. If built app, use uniplanner://
      // For now, we will assume you are developing:
      window.location.href = `exp://192.168.1.139:8081/--/auth?user=${userData}`;
      // ⚠️ CHANGE THE IP ABOVE to your computer's local IP (see your Expo terminal)
    }
  }, [status, session]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connecting to UniPlanner...</h1>
        {status === "loading" && <p>Verifying Credentials...</p>}
        {status === "unauthenticated" && <button onClick={() => signIn('google')} className="bg-blue-600 px-6 py-2 rounded-full font-bold">Click to Login</button>}
      </div>
    </div>
  );
}