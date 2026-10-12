import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./cinema-theme.css";
import { CinemaThemeProvider } from "./cinema-theme";
import { SavedMoviesProvider } from "./saved-movies-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OneLine Cinema | Find your next film in one line",
  description: "Choose your next film with useful AI-assisted reviews based on real viewers' experiences. Share a spoiler-free insight and vote on what helps.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><CinemaThemeProvider><SavedMoviesProvider>{children}</SavedMoviesProvider></CinemaThemeProvider></body>
    </html>
  );
}
