import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com', // Google Auth Images
        },
        {
          protocol: 'https',
          hostname: 'avatars.githubusercontent.com', // GitHub Auth (if added later)
        },
      ],
    },
};

export default nextConfig;
