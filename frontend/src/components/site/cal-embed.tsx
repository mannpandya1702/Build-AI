"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import { CAL_NAMESPACE } from "@/lib/site";

/**
 * Loads the Cal.com embed once and themes the popup to match the site (dark,
 * violet brand). Any element on the page carrying the `data-cal-*` attributes
 * (see `calAttrs` in lib/site) opens the booking modal on click — no per-button
 * wiring needed. Renders nothing.
 */
export function CalEmbedInit() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      cal("ui", {
        theme: "dark",
        hideEventTypeDetails: false,
        layout: "month_view",
        cssVarsPerTheme: {
          light: { "cal-brand": "#7b5cff" },
          dark: { "cal-brand": "#7b5cff" },
        },
      });
    })();
  }, []);

  return null;
}
