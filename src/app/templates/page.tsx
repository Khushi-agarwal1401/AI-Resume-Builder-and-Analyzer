import Link from "next/link";
import { Button } from "@/components/ui/Button";

const templates = [
  { id: "modern", name: "Modern", desc: "Clean and contemporary design" },
  { id: "ats-professional", name: "ATS Professional", desc: "Optimized for applicant tracking systems" },
  { id: "student", name: "Student", desc: "Perfect for students and interns" },
  { id: "minimal", name: "Minimal", desc: "Simple and elegant layout" },
];

export default function TemplatesPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-8 py-12">
      <h1 className="text-h1 text-black mb-2">Resume Templates</h1>
      <p className="text-body text-gray-500 mb-8">Choose a template to get started</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((t) => (
          <div key={t.id} className="bg-white border border-gray-300 rounded-sm p-5 hover:shadow-2 transition-all">
            <div className="h-48 bg-gray-100 rounded-sm mb-4 flex items-center justify-center text-gray-500 text-body">
              Preview
            </div>
            <h3 className="text-h3 text-black">{t.name}</h3>
            <p className="text-small text-gray-500 mt-1 mb-4">{t.desc}</p>
            <Link href={`/builder/new?template=${t.id}`}>
              <Button className="w-full" size="sm">Use Template</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
