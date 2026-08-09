import type { Metadata } from "next";

import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="flex min-h-[70svh] items-center bg-chandni pb-section pt-40">
      <div className="shell flex flex-col items-start gap-8">
        <Wordmark size="sm" tone="accent" />
        <h1 className="max-w-3xl font-display text-display-lg font-light text-ink">
          That page is not here.
        </h1>
        <p className="max-w-measure font-sans text-body-lg text-stone-deep">
          It may have moved. Start again from the beginning, or message us and we
          will send you the right link.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/" size="lg">
            Back to the start
          </Button>
          <WhatsAppCTA variant="inline" />
        </div>
      </div>
    </section>
  );
}
