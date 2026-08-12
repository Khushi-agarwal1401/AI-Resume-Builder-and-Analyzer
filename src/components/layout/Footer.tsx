import Link from "next/link";
import Image from "next/image";
import { Share2, Globe, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white text-gray-600 text-sm py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <Image src="/images/logo.png" alt="ResumeCareer logo" fill sizes="32px" className="object-contain" />
            </div>
            <h3 className="font-bold text-black text-lg">
              Resume<span className="text-blue-600">Career</span>
            </h3>
          </div>
          <p className="text-gray-500 text-xs">
            Build, analyze, and optimize your resume with advanced AI technology.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-black mb-4">Product</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/builder" className="hover:text-black transition-colors">Resume Builder</Link></li>
            <li><Link href="/analyzer" className="hover:text-black transition-colors">Resume Analyzer</Link></li>
            <li><Link href="/pricing" className="hover:text-black transition-colors">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-black mb-4">Resources</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/templates" className="hover:text-black transition-colors">Templates</Link></li>
            <li><Link href="/blog" className="hover:text-black transition-colors">Career Blog</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-black mb-4">Connect</h4>
          <div className="flex items-center gap-4">
            <Link href="https://twitter.com" className="text-gray-400 hover:text-black transition-colors">
              <Share2 size={20} />
            </Link>
            <Link href="https://github.com" className="text-gray-400 hover:text-black transition-colors">
              <Globe size={20} />
            </Link>
            <Link href="https://linkedin.com" className="text-gray-400 hover:text-black transition-colors">
              <ExternalLink size={20} />
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} ResumeCareer. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
