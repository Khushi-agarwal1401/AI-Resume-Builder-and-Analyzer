import { Sparkles, FileText, TrendingUp, ShieldCheck } from "lucide-react";
import { Building2 } from "lucide-react";

export function AuthMarketingColumn() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-white">
      {/* Subtle dot pattern background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 to-transparent opacity-60 pointer-events-none dark:from-blue-500/20" />
      <div
        className="absolute top-10 right-10 w-64 h-64 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#4f46e5 1.5px, transparent 1.5px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Top Header Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center relative overflow-hidden shrink-0 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
          <div className="w-3.5 h-3.5 bg-white rounded-sm rotate-45" />
        </div>
        <span className="text-[18px] font-bold text-gray-900 tracking-tight">
          AI Resume Builder & Analyzer
        </span>
      </div>

      {/* Center Content */}
      <div className="relative z-10 max-w-[500px] my-auto">
        {/* AI Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-accent-600 text-[10px] font-bold tracking-widest uppercase mb-8">
          <Sparkles className="w-3 h-3" />
          AI Powered
        </div>

        <h1 className="text-[52px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
          Build Smarter.<br />
          Get Hired <span className="text-accent-600">Faster.</span>
        </h1>

        <p className="text-[18px] text-gray-600 mb-12 leading-relaxed max-w-[420px]">
          Create ATS-friendly resumes, get AI-powered feedback, and land your dream job.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <FileText strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[12px] font-bold text-gray-900 mb-1">AI Resume Builder</h3>
              <p className="text-[11px] text-gray-500 leading-tight">
                Smart & ATS-optimized resumes in minutes
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <TrendingUp strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[12px] font-bold text-gray-900 mb-1">Resume Analyzer</h3>
              <p className="text-[11px] text-gray-500 leading-tight">
                Detailed feedback to improve your chances
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500">
              <ShieldCheck strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[12px] font-bold text-gray-900 mb-1">ATS Check</h3>
              <p className="text-[11px] text-gray-500 leading-tight">
                Ensure your resume passes ATS scanners
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Logos */}
      <div className="relative z-10 mt-auto pt-8">
        <p className="text-[12px] text-gray-500 font-medium mb-4">
          Trusted by 50,000+ job seekers worldwide
        </p>
        <div className="flex items-center gap-6 text-gray-400">
          <div className="flex items-center gap-1.5 font-bold">
            <Building2 className="text-blue-500" size={20} /> Google
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <Building2 className="text-blue-400" size={20} /> Microsoft
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <Building2 className="text-orange-500" size={20} /> amazon
          </div>
          <div className="flex items-center gap-1.5 font-bold text-lg leading-none tracking-tighter">
            A Adobe
          </div>
          <div className="flex items-center gap-1.5 font-bold tracking-widest text-[13px]">
            TATA
          </div>
        </div>
      </div>
    </div>
  );
}
