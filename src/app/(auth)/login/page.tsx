import { LoginForm } from "@/features/auth/components/LoginForm";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <h1 className="text-h1 text-black">Welcome back</h1>
          <p className="text-body text-gray-500 mt-2">Sign in to your account</p>
        </div>
        <div className="bg-white border border-gray-300 rounded-sm p-8 space-y-6">
          <OAuthButtons />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-small">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>
          <LoginForm />
        </div>
        <p className="text-center text-small text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="text-accent-500 hover:text-accent-600 font-medium">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
