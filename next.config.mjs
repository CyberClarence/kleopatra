/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is what the Electron shell bundles and runs locally.
  ...(process.env.BUILD_STANDALONE ? { output: "standalone" } : {}),
  // PostHog reverse proxy — first-party ingestion through kleopatra.app so
  // analytics survives ad-blockers and all data stays in the EU (RGPD).
  async rewrites() {
    return [
      {
        source: "/posthog-gpdr/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/posthog-gpdr/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // PostHog's API paths use trailing slashes; don't let Next 308-redirect them.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
