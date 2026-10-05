import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "./site-header";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Side of NYC | Campus captions",
  description:
    "Generate and rate AI captions about NYC food runs, dorm life, and weekend adventures.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader signedIn={!!user} />
        {children}
        <footer className="site-footer">
          <span className="font-semibold">SIDE OF NYC.</span>
          <span>Made for the moments between classes.</span>
          <span>Campus life. City energy.</span>
        </footer>
      </body>
    </html>
  );
}
