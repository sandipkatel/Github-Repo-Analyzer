import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reviso - GitHub Commit Analyzer",
  description: "Verify if your commit messages match actual file changes. Analyze GitHub commits with AI-powered insights to ensure commit quality and code review accuracy.",
  keywords: ["github", "commit analyzer", "code review", "git", "version control", "commit history"],
  authors: [{ name: "Yurisha Bajracharya" }],
  openGraph: {
    title: "Reviso - GitHub Commit Analyzer",
    description: "Analyze GitHub commits and verify commit messages match file changes",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}