"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Caught error:", error.message, errorInfo.componentStack);
    }
    // Forward to optional callback (e.g. Sentry)
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default premium fallback UI
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center p-8 min-h-[200px] rounded-2xl bg-white/80 backdrop-blur-sm border border-red-200/60 shadow-lg",
            this.props.className
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center mb-4 ring-2 ring-red-200/50">
            <AlertTriangle size={28} className="text-red-600" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1.5 text-center">
            Something went wrong
          </h3>

          <p className="text-sm text-gray-500 text-center max-w-xs mb-5 leading-relaxed">
            This section encountered an unexpected error. It has been isolated to prevent disruption to the rest of the page.
          </p>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mb-5 w-full max-w-sm">
              <summary className="text-xs font-semibold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                Error details
              </summary>
              <pre className="mt-2 p-3 rounded-xl bg-gray-950 text-xs text-red-300 overflow-auto max-h-[120px] border border-gray-800">
                {this.state.error.message}
                {this.state.error.stack && (
                  <>
                    {"\n\n"}
                    {this.state.error.stack.split("\n").slice(1, 4).join("\n")}
                  </>
                )}
              </pre>
            </details>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-bold shadow-md shadow-accent-500/20 hover:shadow-lg hover:scale-105 active:scale-[0.95] transition-all duration-200"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 hover:scale-105 active:scale-[0.95] transition-all duration-200"
            >
              <Home size={14} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
