"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
          <h1 className="text-h1 text-black mb-4">Something went wrong</h1>
          <p className="text-body text-gray-500 mb-6 max-w-md text-center">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="h-10 px-5 rounded-sm bg-black text-white font-semibold text-body hover:bg-gray-900 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
