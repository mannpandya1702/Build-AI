/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Workspace packages ship raw TS (exports "./src/index.ts") with ESM ".js" import specifiers, so
  // Next must transpile them AND resolve ".js" specifiers to their ".ts" source.
  transpilePackages: [
    "@autopilot/automation",
    "@autopilot/billing",
    "@autopilot/chat",
    "@autopilot/delivery",
    "@autopilot/voice",
  ],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};
