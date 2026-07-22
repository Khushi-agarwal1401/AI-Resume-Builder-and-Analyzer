import Link from "next/link";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { Sparkles, FileText, TrendingUp, ShieldCheck } from "lucide-react";
import { FaGoogle, FaMicrosoft, FaAmazon } from "react-icons/fa";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex bg-[#f8f9fc]">
      
      {/* LEFT COLUMN - Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-white">
        
        {/* Subtle dot pattern background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 to-transparent opacity-60 pointer-events-none" />
        <div className="absolute top-10 right-10 w-64 h-64 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center relative overflow-hidden shrink-0 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
            <div className="w-3.5 h-3.5 bg-white rounded-sm rotate-45" />
          </div>
          <span className="text-[18px] font-bold text-gray-900 tracking-tight">AI Resume Builder & Analyzer</span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-[500px] my-auto">
          {/* AI Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-accent-600 text-[10px] font-bold tracking-widest uppercase mb-8">
            <Sparkles className="w-3 h-3" />
            AI Powered
          </div>

          <h1 className="text-[52px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Build Smarter.<br/>
            Get Hired <span className="text-accent-600">Faster.</span>
          </h1>

          <p className="text-[18px] text-gray-600 mb-12 leading-relaxed max-w-[420px]">
            Create ATS-friendly resumes, get AI-powered feedback, and land your dream job.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <FileText strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-gray-900 mb-1">AI Resume Builder</h3>
                <p className="text-[11px] text-gray-500 leading-tight">Smart & ATS-optimized resumes in minutes</p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                <TrendingUp strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-gray-900 mb-1">Resume Analyzer</h3>
                <p className="text-[11px] text-gray-500 leading-tight">Detailed feedback to improve your chances</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500">
                <ShieldCheck strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-gray-900 mb-1">ATS Check</h3>
                <p className="text-[11px] text-gray-500 leading-tight">Ensure your resume passes ATS scanners</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Logos */}
        <div className="relative z-10 mt-auto pt-8">
          <p className="text-[12px] text-gray-500 font-medium mb-4">Trusted by 50,000+ job seekers worldwide</p>
          <div className="flex items-center gap-6 text-gray-400">
             <div className="flex items-center gap-1.5 font-bold"><FaGoogle size={18}/> Google</div>
             <div className="flex items-center gap-1.5 font-bold"><FaMicrosoft size={18}/> Microsoft</div>
             <div className="flex items-center gap-1.5 font-bold"><FaAmazon size={18}/> amazon</div>
             <div className="flex items-center gap-1.5 font-bold text-lg leading-none tracking-tighter">A Adobe</div>
             <div className="flex items-center gap-1.5 font-bold tracking-widest text-[13px]">TATA</div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative p-6">
        
        {/* Top Right "Already have an account?" Link */}
        <div className="absolute top-8 right-8 z-10 flex items-center gap-2 text-[14px]">
          <span className="text-gray-500">Already have an account?</span>
          <Link href="/login" className="text-accent-600 font-medium hover:text-accent-700 hover:underline">
            Sign in
          </Link>
        </div>

        {/* Sign Up Card */}
        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 sm:p-10 z-10">
          <div className="text-center mb-8">
            <h2 className="text-[28px] font-bold text-gray-900 mb-2 tracking-tight">Create your account</h2>
            <p className="text-[14px] text-gray-500">Start building your AI-powered resume</p>
          </div>

          <OAuthButtons />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-400 text-[12px]">or</span>
            </div>
          </div>

          <SignUpForm />
        </div>
        
      </div>
      
    </div>
  );
}
