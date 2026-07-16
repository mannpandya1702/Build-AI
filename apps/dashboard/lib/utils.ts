import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Standard shadcn-style class combiner: clsx for conditionals, tailwind-merge to dedupe conflicts.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** USD formatter for spend/budget figures. */
export function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}
