"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/layout/Footer";
import { BentoCard } from "@/components/ui/BentoCard";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { 
  CheckCircle2, 
  Wand2, 
  Star,
  ArrowRight,
  Briefcase,
  Layout,
  LayoutTemplate
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { useRef } from "react";

// Hero Interactive Mockup Component
function HeroMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center perspective-1000 z-10">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY }}
        className="relative w-full max-w-[400px] h-[500px] bg-white backdrop-blur-xl rounded-2xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 transform-style-3d cursor-crosshair"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-2xl pointer-events-none" />
        
        {/* Fake Resume Content */}
        <div className="bg-white rounded-xl h-full p-6 shadow-inner relative overflow-hidden flex flex-col gap-4">
          <div className="w-1/2 h-6 bg-gray-200 rounded" />
          <div className="w-1/3 h-3 bg-gray-100 rounded" />
          <div className="w-full h-px bg-gray-100 my-2" />
          <div className="w-1/4 h-4 bg-gray-200 rounded" />
          <div className="w-full h-2 bg-gray-100 rounded" />
          <div className="w-full h-2 bg-gray-100 rounded" />
          <div className="w-5/6 h-2 bg-gray-100 rounded" />
          <div className="w-1/4 h-4 bg-gray-200 rounded mt-4" />
          <div className="w-full h-2 bg-gray-100 rounded" />
          <div className="w-full h-2 bg-gray-100 rounded" />
          <div className="w-4/5 h-2 bg-gray-100 rounded" />
        </div>

        {/* Floating Badges */}
        <motion.div 
          style={{ translateZ: 50 }}
          className="absolute -top-6 -right-8 bg-white/80 backdrop-blur-md border border-border px-4 py-2 rounded-full shadow-xl flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
          <span className="text-small font-medium text-black">ATS 96%</span>
        </motion.div>

        <motion.div 
          style={{ translateZ: 80 }}
          className="absolute top-1/4 -left-12 bg-white/80 backdrop-blur-md border border-border p-3 rounded-2xl shadow-xl flex items-center gap-3"
        >
          <div className="bg-accent-500/20 p-2 rounded-lg text-accent-500">
            <Wand2 size={16} />
          </div>
          <div>
            <p className="text-small font-medium text-black">AI Improved</p>
            <p className="text-micro text-gray-500">Keywords +24</p>
          </div>
        </motion.div>

        <motion.div 
          style={{ translateZ: 60 }}
          className="absolute bottom-1/4 -right-10 bg-white/80 backdrop-blur-md border border-border px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2"
        >
          <FaGithub size={16} className="text-black" />
          <span className="text-small font-medium text-black">GitHub Imported</span>
        </motion.div>

        <motion.div 
          style={{ translateZ: 40 }}
          className="absolute -bottom-6 left-12 bg-accent-500 text-black px-4 py-2 rounded-full shadow-xl font-medium text-small flex items-center gap-2"
        >
          <CheckCircle2 size={14} />
          Interview Ready
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 50]);

  return (
    <div className="bg-background min-h-screen text-black overflow-hidden selection:bg-accent-500/30">
      {/* Global Noise Texture overlay */}
      <div className="fixed inset-0 z-[9999] pointer-events-none bg-noise opacity-50 mix-blend-overlay" />

      {/* 1. Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 min-h-screen flex items-center">
        {/* Ambient Blue Glow */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-black opacity-20 pointer-events-none mask-image-b" />
        
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
          <motion.div 
            style={{ opacity: heroOpacity, y: heroY }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border text-gray-600 text-small font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-accent-500" />
              Trusted by 20,000+ professionals
            </div>
            
            <h1 className="text-display tracking-tight mb-6 font-bold leading-tight">
              Build resumes<br className="hidden lg:block"/> that recruiters<br className="hidden lg:block"/> actually read.
            </h1>
            
            <p className="text-body-lg text-gray-500 mb-10 leading-relaxed max-w-xl">
              Create ATS-optimized resumes with AI assistance, import your GitHub projects instantly, and track your job applications in one unified dark-mode workspace.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/sign-up">
                <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-lg h-14 px-8 text-body font-medium shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  Create Resume
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-lg h-14 px-8 text-body font-medium border border-border hover:bg-white flex items-center justify-center gap-2">
                  <FaGithub size={18} />
                  Import GitHub
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 text-small text-gray-500">
              <div className="flex items-center gap-1 text-black font-medium">
                <div className="flex text-accent-500">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-accent-500" />)}
                </div>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <span className="font-medium text-black">ATS 96% Success Rate</span>
            </div>
          </motion.div>

          <HeroMockup />
        </div>
      </section>

      {/* 2. Bento Grid Features */}
      <section id="features" className="py-32 relative">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 right-1/4 w-[800px] h-[800px] bg-white rounded-full blur-[150px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.97, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-[1280px] mx-auto px-6 md:px-12 relative z-10"
        >
          <div className="mb-20 text-center max-w-2xl mx-auto">
            <h2 className="text-h2 font-bold mb-4">Everything you need to stand out.</h2>
            <p className="text-body-lg text-gray-500">Stop fighting with margins and formatting. Focus on your career story.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-6 auto-rows-[250px]">
            
            {/* AI Assistant - Large (col 1-2, row 1-2) */}
            <BentoCard className="md:col-span-2 md:row-span-2">
              <div className="h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-accent-500/20 text-accent-500 flex items-center justify-center mb-6">
                    <Wand2 size={24} />
                  </div>
                  <h3 className="text-h3 font-semibold mb-2">AI-Powered Writing</h3>
                  <p className="text-gray-500 max-w-md">Our advanced AI doesn&apos;t just check grammar. It suggests high-impact bullet points and quantifiable metrics.</p>
                </div>
                
                <div className="mt-8 bg-gray-50 border border-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="text-gray-500 line-through text-small">&quot;Made the website load faster&quot;</div>
                  <div className="text-black border-l-2 border-accent-500 pl-3 text-small">&quot;Reduced core application load time by 45% utilizing Redis caching and code splitting.&quot;</div>
                </div>
              </div>
            </BentoCard>

            {/* ATS Score - Small (col 3, row 1) */}
            <BentoCard>
              <div className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center mb-4">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="text-h4 font-semibold mb-2">ATS Score</h3>
                <p className="text-gray-500 text-small">Instantly check your resume against strict Applicant Tracking Systems.</p>
              </div>
            </BentoCard>

            {/* Job Tracker - Small (col 3, row 2) */}
            <BentoCard>
              <div className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center mb-4">
                  <Briefcase size={20} />
                </div>
                <h3 className="text-h4 font-semibold mb-2">Job Tracker</h3>
                <p className="text-gray-500 text-small">Manage your applications and interview stages in a Kanban board.</p>
              </div>
            </BentoCard>

            {/* GitHub - Small (col 1, row 3) */}
            <BentoCard>
              <div className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center mb-4">
                  <FaGithub size={20} />
                </div>
                <h3 className="text-h4 font-semibold mb-2">GitHub Sync</h3>
                <p className="text-gray-500 text-small">Import top repos automatically.</p>
              </div>
            </BentoCard>

            {/* Resume - Small (col 2, row 3) */}
            <BentoCard>
              <div className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center mb-4">
                  <Layout size={20} />
                </div>
                <h3 className="text-h4 font-semibold mb-2">Clean Layouts</h3>
                <p className="text-gray-500 text-small">Pixel-perfect PDF exports.</p>
              </div>
            </BentoCard>

            {/* Templates - Large (col 3, row 3) */}
            <BentoCard className="md:col-span-1 md:row-span-1">
              <div className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center mb-4">
                  <LayoutTemplate size={20} />
                </div>
                <h3 className="text-h4 font-semibold mb-2">Premium Templates</h3>
                <p className="text-gray-500 text-small">Professionally designed to convert.</p>
              </div>
            </BentoCard>

          </div>
        </motion.div>
      </section>

      {/* 3. Resume Templates */}
      <section className="py-32 relative border-t border-border">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.97, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-[1280px] mx-auto px-6 md:px-12 relative z-10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-h2 font-bold mb-4">Professional Templates.</h2>
              <p className="text-body-lg text-gray-500 max-w-xl">Clean, modern layouts engineered specifically to pass Applicant Tracking Systems.</p>
            </div>
            <Link href="/templates">
              <Button variant="ghost" className="text-black border border-border hover:bg-white">View All Templates <ArrowRight size={16} className="ml-2" /></Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Modern Minimal', image: '/template_minimal.png' },
              { name: 'ATS Professional', image: '/template_ats.png' },
              { name: 'Creative Tech', image: '/template_creative.png' }
            ].map((t) => (
              <div key={t.name} className="group relative">
                <div className="aspect-[1/1.4] bg-white rounded-2xl border border-border mb-6 overflow-hidden relative shadow-sm group-hover:border-white/30 transition-all duration-300">
                  <Image src={t.image} alt={t.name} fill className="object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <Button variant="accent" className="shadow-[0_0_20px_rgba(99,102,241,0.5)] translate-y-4 group-hover:translate-y-0 transition-transform">Use Template</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-body font-semibold text-black">{t.name}</h4>
                  <div className="flex items-center gap-1 text-micro font-medium text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={12} /> ATS Safe
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 4. Pricing */}
      <section className="py-32 relative border-t border-border" id="pricing">
        {/* Ambient Gray Glow */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.97, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-[1280px] mx-auto px-6 md:px-12 relative z-10"
        >
          <div className="text-center mb-20">
            <h2 className="text-h2 font-bold mb-4">Simple, transparent pricing.</h2>
            <p className="text-body-lg text-gray-500">Start for free, upgrade when you need superpowers.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <BentoCard className="flex flex-col p-10">
              <h3 className="text-h2 font-semibold mb-2">Free</h3>
              <p className="text-gray-500 text-body mb-6">Perfect for building your first resume.</p>
              <div className="mb-8">
                <span className="text-display font-bold">$0</span>
                <span className="text-gray-500 font-medium">/forever</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {['1 Resume limit', 'Basic ATS scoring', '3 standard templates', 'PDF Export'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-body font-medium text-gray-600">
                    <CheckCircle2 size={18} className="text-black" /> {feature}
                  </li>
                ))}
              </ul>
              <Button variant="ghost" className="w-full h-12 border border-border hover:bg-white">Get Started Free</Button>
            </BentoCard>

            {/* Pro */}
            <BentoCard className="flex flex-col p-10 border-accent-500/30 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-500 to-accent-500" />
              <div className="absolute top-8 right-8 bg-accent-500/10 text-accent-500 text-micro font-semibold px-3 py-1 rounded-full border border-accent-500/20">
                Popular
              </div>
              <h3 className="text-h2 font-semibold mb-2">Pro</h3>
              <p className="text-gray-500 text-body mb-6">For serious job seekers.</p>
              <div className="mb-8">
                <span className="text-display font-bold">$12</span>
                <span className="text-gray-500 font-medium">/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {['Unlimited resumes', 'Full AI writing assistant', 'Premium ATS optimization', 'GitHub 1-click sync', 'Cover letter generation'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-body font-medium text-gray-600">
                    <CheckCircle2 size={18} className="text-accent-500" /> {feature}
                  </li>
                ))}
              </ul>
              <Button variant="accent" className="w-full h-12 shadow-[0_0_20px_rgba(99,102,241,0.2)]">Upgrade to Pro</Button>
            </BentoCard>
          </div>
        </motion.div>
      </section>

      {/* 5. Final CTA */}
      <section className="py-32 relative overflow-hidden border-t border-border">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-500/10 blur-[150px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.97, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-[1280px] mx-auto px-6 md:px-12 text-center relative z-10"
        >
          <h2 className="text-display font-bold text-black mb-6">Ready to upgrade your career?</h2>
          <p className="text-body-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            Stop sending resumes into the void. Build an ATS-friendly, AI-optimized resume in minutes and start landing interviews.
          </p>
          <Link href="/sign-up">
            <Button variant="accent" size="lg" className="h-14 px-10 text-body-lg font-medium shadow-[0_0_40px_rgba(99,102,241,0.3)]">
              Start Building Now
            </Button>
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
