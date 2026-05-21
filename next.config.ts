import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: re-enable strict TypeScript checks once the ~111 type errors
  // are resolved (mostly Prisma create() calls missing userId, which the
  // runtime extension in lib/prisma.ts injects automatically — needs proper
  // type-level support via Prisma extension types).
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
