import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The Open Graph image routes read TTF fonts off disk at render time.
   * Vercel's bundler only traces imports, not fs.readFile paths, so without
   * this the fonts exist locally, the build passes, and the live image route
   * throws ENOENT — a failure only visible in production.
   */
  outputFileTracingIncludes: {
    "/**": ["./assets/fonts/**"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The browser must not second-guess declared content types.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Full URL to own pages, origin only to everyone else.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing on this site frames itself, so nobody else gets to either
          // — the classic clickjacking guard, and it covers /admin.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // The site asks for none of these; saying so explicitly means a
          // compromised third-party script cannot ask either.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
