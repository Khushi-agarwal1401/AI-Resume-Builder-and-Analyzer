import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ResumeData } from "@/types/resume";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderResumeToHtml(resume: ResumeData): string {
  const bodyHtml = renderToStaticMarkup(<TemplateRenderer resume={resume} />);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(resume.title || "Resume")} - ${escapeHtml(resume.personalInfo?.fullName || "User")}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-black antialiased">
  ${bodyHtml}
</body>
</html>`;
}
