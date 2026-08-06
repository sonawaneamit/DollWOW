import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd()
  },
  images: {
    // Catalog media is sourced from supplier-authorized Shopify files. Loading it
    // directly keeps a failed optimization request from hiding product galleries.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.myshopify.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "img.staticdj.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;
