import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./cinema-theme.css";
import { CinemaThemeProvider } from "./cinema-theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OneLine Cinema | Your thoughts, one unforgettable line",
  description: "Turn your own movie thoughts into short AI-assisted one-line reviews, then vote for the best.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><CinemaThemeProvider>{children}</CinemaThemeProvider></body>
    </html>
  );
}
