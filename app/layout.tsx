import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";

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
    default: "CourseCraft | Smart AI Schedule Generator",
    template: "%s | CourseCraft"
  },
  description: "The ultimate university class scheduler. Craft your perfect semester in seconds using AI.",
  keywords: ["CourseCraft", "university scheduler", "class planner", "schedule generator", "AI scheduler", "college timetable"],
  authors: [{ name: "CourseCraft Team" }],
  creator: "CourseCraft",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png", // Assuming icon.png is good for apple-touch-icon for now
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://coursecraft-planner.vercel.app",
    title: "CourseCraft | Smart AI Schedule Generator",
    description: "Points-aware scheduling for students. Craft your perfect semester.",
    siteName: "CourseCraft",
    images: [
      {
        url: "/icon.png", // Fallback to icon for now
        width: 512,
        height: 512,
        alt: "CourseCraft Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "CourseCraft | Smart AI Schedule Generator",
    description: "Generate conflict-free university schedules in seconds.",
    images: ["/icon.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CourseCraft",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "CourseCraft",
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
        </Providers>
      </body>
    </html>
  );
}