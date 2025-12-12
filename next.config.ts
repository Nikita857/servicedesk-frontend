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
    "http://localhost",
    "http://192.168.14.9:3000",
    "http://192.168.14.9",
    "192.168.14.9" //Для работы Hot module replpacement (HMR) by websocket connection. Крч чтобы страница сама не перезажгружалась
    ]
};

export default nextConfig;

