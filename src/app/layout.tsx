import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider, themeInitScript } from "@/features/theme/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { ThemedToaster } from "@/components/ThemedToaster";

export const metadata: Metadata = {
  title: "ResumeCareer — Build, Optimize & Land Your Dream Job",
  description:
    "Build ATS-optimized resumes with AI. Analyze, tailor, and auto-update your resume from LinkedIn and GitHub. Get hired faster.",
  icons: {
    icon: [
      { url: "/images/logo.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "ResumeCareer",
    description:
      "Build ATS-optimized resumes with AI. Analyze, tailor, and auto-update your resume from LinkedIn and GitHub.",
    type: "website",
    siteName: "ResumeCareer",
    images: [{ url: "/images/logo.png" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-black selection:bg-accent-500/30 dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider>
          <Providers>
            <Navbar />
            <main>{children}</main>
            <CommandPalette />
            <ThemedToaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
