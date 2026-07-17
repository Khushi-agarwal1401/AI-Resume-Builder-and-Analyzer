import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Resume Builder & Analyzer",
  description: "Build, analyze, and optimize your resume with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
