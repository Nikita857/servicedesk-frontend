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
    "http://192.168.0.111:2007",
    "http://192.168.0.111",
    "http://192.168.0.13:3000",
    "http://192.168.0.13",
    "http://sd.bormash.ru:2007",
    "http://192.168.31.126:3000",
    "http://192.168.31.126",
    "192.168.0.13",
    "192.168.0.111", //Для работы Hot module replpacement (HMR) by websocket connection
  ],
};

export default nextConfig;
