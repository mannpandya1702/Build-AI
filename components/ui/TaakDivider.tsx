/**
 * The taak — a pointed niche arch — used as a section divider.
 *
 * It is drawn in CSS, not an image, and it is a shape rather than a mark. Cap
 * its use at two per page; on the home page that is the service card crops and
 * this divider.
 */
export function TaakDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="relative h-16 bg-chandni md:h-24">
        {/* The niche is cut into the section below by overlaying a chandni
            arch on a pista-mist band. */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-pista-mist" />
        <div className="taak absolute bottom-0 left-1/2 h-full w-[68vw] max-w-[34rem] -translate-x-1/2 bg-chandni" />
      </div>
    </div>
  );
}
