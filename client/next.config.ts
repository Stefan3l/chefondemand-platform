import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/static/**",
      },
    ],
    // Dacă vrei să dezactivezi optimizările în dev (opțional):
    // unoptimized: true,
  },
};

export default nextConfig;
