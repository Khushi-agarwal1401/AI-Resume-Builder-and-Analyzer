import type { ResumeData } from "@/types/resume";

/**
 * Renders user-created custom sections (K-04) in the fixed-layout templates.
 * Heading/container classes are injected per template so the block matches
 * each template's theme. Renders nothing when there are no non-empty
 * custom sections.
 */
export function CustomSectionBlock({
  resume,
  containerClassName = "mb-5",
  headingClassName = "text-sm font-bold uppercase border-b pb-1 mb-2",
}: {
  resume: ResumeData;
  containerClassName?: string;
  headingClassName?: string;
}) {
  const customSections = Object.entries(resume.customSections ?? {}).filter(([, cs]) => cs.items.length > 0);
  if (customSections.length === 0) return null;

  return (
    <>
      {customSections.map(([id, cs]) => (
        <div key={id} className={containerClassName}>
          <h2 className={headingClassName}>{cs.title || "Custom Section"}</h2>
          {cs.items.map((item) => (
            <div key={item.id} className="mb-2">
              {item.title && (
                <div className="flex justify-between">
                  <span className="font-semibold">{item.title}</span>
                  {item.date && <span className="text-gray-500 text-xs">{item.date}</span>}
                </div>
              )}
              {item.subtitle && <div className="text-gray-600 text-xs">{item.subtitle}</div>}
              {item.description && <p className="text-gray-700 text-xs mt-1">{item.description}</p>}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
