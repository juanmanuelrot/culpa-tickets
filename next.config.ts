import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Cloudflare cachea la página del evento e ignora Vary: con esto Next solo
    // sirve un payload RSC en una URL con su ?_rsc= correcto, y nadie puede
    // dejar uno cacheado en la URL del HTML.
    validateRSCRequestHeaders: true,
  },
};

export default nextConfig;
