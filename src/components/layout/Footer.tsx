import Link from "next/link";
import { FaTwitter, FaGithub, FaLinkedin } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          <div className="md:col-span-1">
            <Link href="/" className="text-h3 font-bold text-black tracking-tight mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-accent-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              AI Resume Builder
            </Link>
            <p className="text-small text-gray-500 max-w-[250px]">
              Build resumes recruiters actually want to read, optimized by AI to pass ATS filters.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-black mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/#features" className="text-small text-gray-500 hover:text-black transition-colors">Features</Link></li>
              <li><Link href="/templates" className="text-small text-gray-500 hover:text-black transition-colors">Templates</Link></li>
              <li><Link href="/pricing" className="text-small text-gray-500 hover:text-black transition-colors">Pricing</Link></li>
              <li><Link href="/#faq" className="text-small text-gray-500 hover:text-black transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-black mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="/blog" className="text-small text-gray-500 hover:text-black transition-colors">Blog</Link></li>
              <li><Link href="/guides" className="text-small text-gray-500 hover:text-black transition-colors">Resume Guides</Link></li>
              <li><Link href="/examples" className="text-small text-gray-500 hover:text-black transition-colors">Examples</Link></li>
              <li><Link href="/support" className="text-small text-gray-500 hover:text-black transition-colors">Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-black mb-4">Connect</h4>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-black transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-black transition-colors">
                <FaGithub size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-black transition-colors">
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-small text-gray-500">
          <p>© {new Date().getFullYear()} AI Resume Builder. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
