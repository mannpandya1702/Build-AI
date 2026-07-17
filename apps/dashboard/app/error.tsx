"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

// App-wide error boundary (MASTER_SPEC §12; closes the audit's "silent failures / infinite
// skeletons" finding). Any render/data error surfaces here with a retry instead of a blank spinner.
export default function ErrorBoundary({
  error,
  reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Sentry captures this in production once wired (NEEDS_FROM_OPERATOR.md).
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <Card className="w-full max-w-md p-6 text-center">
        <TriangleAlert className="mx-auto mb-3 h-7 w-7 text-danger" />
        <h1 className="font-display text-lg font-semibold text-ink">Something went wrong</h1>
        <p className="mt-1 text-sm text-muted">
          This view hit an error. It was logged. You can retry or head back to the Shortlist.
        </p>
        {error.digest && <p className="mt-2 font-display text-[11px] text-faint">ref {error.digest}</p>}
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/shortlist">Go to Shortlist</a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
