// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
};

export default nextConfig;
