import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["znctryuazsewacjrdabk.supabase.co"],
  },
  productionBrowserSourceMaps: false,
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
