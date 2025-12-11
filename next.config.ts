import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.14.9:3000",
    "http://192.168.14.9",
    "https://subpermanent-phebe-attently.ngrok-free.dev",
    ]
};

export default nextConfig;

