import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <Card className="w-full max-w-md p-6 text-center">
        <Compass className="mx-auto mb-3 h-7 w-7 text-faint" />
        <h1 className="font-display text-lg font-semibold text-ink">Page not found</h1>
        <p className="mt-1 text-sm text-muted">That page doesn't exist.</p>
        <div className="mt-4 flex justify-center">
          <Button variant="primary" asChild>
            <Link href="/shortlist">Go to Shortlist</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
