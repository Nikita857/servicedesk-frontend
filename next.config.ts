import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
    "http://sd.bormash.ru:2007",
    "https://sd.bormash.ru:2007",
    "192.168.0.111", //Для работы Hot module replpacement (HMR) by websocket connection
  ],
};

export default nextConfig;
