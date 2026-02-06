import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/images/:path*",
      },
    ];
  },
};

export default nextConfig;
