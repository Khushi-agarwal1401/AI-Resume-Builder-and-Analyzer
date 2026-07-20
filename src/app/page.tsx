import Link from "next/link";
import { Button } from "@/components/ui/Button";

const features = [
  {
    title: "AI-Powered Writing",
    desc: "Smart bullet-point rewriting, action-verb suggestions, and keyword optimization tailored to your experience level.",
  },
  {
    title: "ATS Compatibility",
    desc: "Estimated compatibility score with actionable suggestions to get past automated screening systems.",
  },
  {
    title: "GitHub Integration",
    desc: "Import your repositories and contributions directly into your resume with one click.",
  },
  {
    title: "Professional Templates",
    desc: "ATS-friendly templates designed for students, freshers, and experienced professionals.",
  },
  {
    title: "Job Description Matching",
    desc: "Paste a job description and instantly see which keywords and skills your resume is missing.",
  },
  {
    title: "Application Tracking",
    desc: "Track jobs, interviews, and offers alongside your resume workflow.",
  },
];

const templates = [
  { name: "Modern", desc: "Clean two-column layout with a refined color accent" },
  { name: "ATS Professional", desc: "Single-column, parse-optimized for maximum ATS compatibility" },
  { name: "Minimal", desc: "Typography-focused design with generous whitespace" },
  { name: "Student", desc: "Project and education-first layout for early-career candidates" },
];

const testimonials = [
  {
    quote: "The AI suggestions saved me hours of rewriting. I got interviews at two companies within a week of updating my resume.",
    author: "Rohit M.",
    role: "Software Engineer, 3 YOE",
  },
  {
    quote: "The ATS score helped me understand why I wasn't getting callbacks. After fixing the gaps, my interview rate doubled.",
    author: "Priya K.",
    role: "Product Manager, 5 YOE",
  },
  {
    quote: "Being able to import my GitHub projects directly was a game-changer. My resume finally showed what I could actually build.",
    author: "Arjun S.",
    role: "CS Graduate, 2025",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-[1280px] mx-auto px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-[720px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent-50 text-accent-900 text-small font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-accent-500" />
              AI-Powered Resume Builder
            </div>
            <h1 className="text-display text-black tracking-tight leading-[1.1]">
              Resumes That{" "}
              <span className="text-accent-500">Get Results</span>
            </h1>
            <p className="mt-6 text-body-lg text-gray-500 max-w-[540px] mx-auto leading-relaxed">
              Build ATS-optimized resumes with AI assistance, import your GitHub projects,
              and track your job applications — all in one place.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link href="/sign-up">
                <Button size="lg">Create Your Resume</Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="secondary" size="lg">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Import from GitHub
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="ghost" size="lg">View Templates</Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-h2 text-black">Everything you need to land your next role</h2>
            <p className="text-body text-gray-500 mt-3 max-w-[540px] mx-auto">
              Six integrated tools working together — not six tabs you&apos;ll never open.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-300 rounded-sm p-6 hover:shadow-2 hover:-translate-y-0.5 transition-all duration-200"
              >
                <h3 className="text-h3 text-black mb-2">{f.title}</h3>
                <p className="text-body text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-t border-gray-300">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-h2 text-black">Templates built for real hiring systems</h2>
            <p className="text-body text-gray-500 mt-3 max-w-[540px] mx-auto">
              Every template passes basic ATS parsing checks — no columns, no tables, no hidden formatting.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((t) => (
              <div
                key={t.name}
                className="bg-gray-50 border border-gray-300 rounded-sm p-5 hover:shadow-2 transition-all duration-200 group"
              >
                <div className="aspect-[4/3] bg-white border border-gray-300 rounded-sm mb-4 flex items-center justify-center">
                  <span className="text-gray-300 text-small">{t.name}</span>
                </div>
                <h3 className="text-h3 text-black">{t.name}</h3>
                <p className="text-small text-gray-500 mt-1 mb-4">{t.desc}</p>
                <Link href={`/builder/new?template=${t.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Button size="sm" variant="secondary" className="w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Use This Template
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/templates">
              <Button variant="ghost">View All Templates →</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-t border-gray-300">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-h2 text-black">What our users say</h2>
            <p className="text-body text-gray-500 mt-3">Real results from real job seekers.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.author} className="bg-white border border-gray-300 rounded-sm p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-body text-gray-700 mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="border-t border-gray-300 pt-3">
                  <p className="text-small font-medium text-black">{t.author}</p>
                  <p className="text-micro text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-t border-gray-300">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-h2 text-black">Simple, transparent pricing</h2>
            <p className="text-body text-gray-500 mt-3">Start free, upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-[640px] mx-auto">
            <div className="border border-gray-300 rounded-sm p-8 bg-white">
              <h3 className="text-h3 text-black mb-2">Free</h3>
              <p className="text-display text-black mb-1">$0</p>
              <p className="text-small text-gray-500 mb-6">Forever free, no credit card</p>
              <ul className="space-y-3 mb-8">
                {["1 resume", "Basic ATS compatibility score", "AI content suggestions", "PDF export"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-small text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-accent-50 flex items-center justify-center text-accent-500 text-micro">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up">
                <Button className="w-full">Get Started Free</Button>
              </Link>
            </div>
            <div className="border-2 border-accent-500 rounded-sm p-8 bg-white relative">
              <div className="absolute -top-3 left-6 bg-accent-500 text-white text-micro font-medium px-3 py-0.5 rounded-full">
                Popular
              </div>
              <h3 className="text-h3 text-black mb-2">Pro</h3>
              <p className="text-display text-black mb-1">Coming Soon</p>
              <p className="text-small text-gray-500 mb-6">For active job seekers</p>
              <ul className="space-y-3 mb-8">
                {["Unlimited resumes", "Full ATS optimization", "GitHub sync", "Company-specific variants", "Job tracking"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-small text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-accent-50 flex items-center justify-center text-accent-500 text-micro">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="secondary" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-black border-t border-gray-300">
        <div className="max-w-[1280px] mx-auto px-8 text-center">
          <h2 className="text-h2 text-white mb-4">Ready to build a resume that works?</h2>
          <p className="text-body-lg text-gray-500 mb-8 max-w-[480px] mx-auto">
            Join thousands of job seekers creating ATS-optimized resumes in minutes.
          </p>
          <Link href="/sign-up">
            <Button size="lg" variant="accent">Create Your Resume Free</Button>
          </Link>
        </div>
      </section>

      <footer className="bg-black border-t border-gray-900 py-12">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Link href="/templates" className="text-small text-gray-500 hover:text-gray-300 transition-colors">
                Templates
              </Link>
              <Link href="/login" className="text-small text-gray-500 hover:text-gray-300 transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="text-small text-gray-500 hover:text-gray-300 transition-colors">
                Sign Up
              </Link>
            </div>
            <p className="text-micro text-gray-500">
              &copy; {new Date().getFullYear()} AI Resume Builder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
