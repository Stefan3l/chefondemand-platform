import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   allowedDevOrigins: ["192.168.68.103", "*.192.168.68.103"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/static/**",
      },
      {
        protocol: "http",
        hostname: "192.168.68.103",
        port: "4000",
        pathname: "/static/**",
      },
    ],
    // opțional în dev:
    // unoptimized: true,
  },
};

export default nextConfig;
