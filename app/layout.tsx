import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UniPlanner",
  description: "Smart Scheduler for University Students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Script 
          src="https://pl28511143.effectivegatecpm.com/ae/bb/42/aebb42672f361b1bbaace491b5e03bc3.js" 
          strategy="afterInteractive" 
        />
        </Providers>
      </body>
    </html>
  );
}