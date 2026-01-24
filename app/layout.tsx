import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "UniPlanner | Smart Schedule Generator",
    template: "%s | UniPlanner"
  },
  description: "The ultimate university class scheduler. Generate your perfect semester in seconds.",
  keywords: ["UniPlanner", "university scheduler", "class planner", "schedule generator", "AI scheduler", "college timetable", "assumption university", "abac", "university", "au spark"],
  authors: [{ name: "UniPlanner Team" }],
  creator: "UniPlanner",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://uniplanner-eta.vercel.app",
    title: "UniPlanner | Smart Schedule Generator",
    description: "Points-aware scheduling for students. Generate your perfect semester.",
    siteName: "UniPlanner",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "UniPlanner Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "UniPlanner | Smart Schedule Generator",
    description: "Generate conflict-free university schedules in seconds.",
    images: ["/icon.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UniPlanner",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "UniPlanner",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Smart AI scheduler for university students. Generate perfect class schedules instantly."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          {children}
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}