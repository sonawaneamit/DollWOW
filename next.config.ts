import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/dollvue/:path+",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: "/shop/lighter",
        destination: "/shop/lightweight-sex-dolls",
        permanent: true
      },
      {
        source: "/shop/in-stock-sex-dolls",
        destination: "/shop/ready-to-ship",
        permanent: true
      },
      {
        source: "/shop/fast-shipping-sex-dolls",
        destination: "/shop/ready-to-ship",
        permanent: true
      },
      {
        source: "/learn/sex-doll-storage-1",
        destination: "/learn/sex-doll-storage",
        permanent: true
      },
      {
        source: "/learn/most-realistic-sex-dolls-1",
        destination: "/learn/most-realistic-sex-dolls",
        permanent: true
      },
      {
        source: "/learn/most-realistic-sex-dolls-5",
        destination: "/learn/most-realistic-sex-dolls",
        permanent: true
      },
      {
        source: "/learn/best-sex-doll-stores-1",
        destination: "/learn/best-sex-doll-stores",
        permanent: true
      },
      {
        source: "/shipping-5",
        destination: "/shipping",
        permanent: true
      },
      {
        source: "/shop/realistic-sex-dolls-3",
        destination: "/shop/realistic-sex-dolls",
        permanent: true
      },
      {
        source: "/editorial-policy",
        destination: "/why-dollwow",
        permanent: true
      },
      {
        source: "/products/starpery-honey-148cm-j-cup-silicone-companion-doll-17p4h",
        destination: "/products/starpery-honey-148cm-j-cup-silicone-head-companion-doll-1dptr",
        permanent: true
      },
      {
        source: "/products/starpery-aurora-160cm-k-cup-silicone-companion-doll-1jkt2",
        destination: "/products/starpery-aurora-160cm-k-cup-silicone-companion-doll-879qv",
        permanent: true
      },
      {
        source: "/products/sedoll-cecilia-lynd-161cm-f-cup-tpe-companion-doll-i9zoa",
        destination: "/products/sedoll-cecilia-lynd-161cm-f-cup-tpe-companion-doll-1e7ds",
        permanent: true
      },
      {
        source: "/products/sedoll-carry-150cm-g-cup-tpe-companion-doll-4lkf4",
        destination: "/products/sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
        permanent: true
      },
      {
        source: "/products/starpery-freya-165cm-g-cup-silicone-companion-doll-j6lra",
        destination: "/products/starpery-freya-165cm-g-cup-silicone-head-companion-doll-46ftg",
        permanent: true
      },
      {
        source: "/products/irontech-doll-163cm-e-cup-silicone-companion-doll-1tl7n",
        destination: "/products/irontech-penny-164cm-f-cup-silicone-head-companion-doll-1ttey",
        permanent: true
      }
    ];
  },
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
      { protocol: "https", hostname: "www.rosemarydoll.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;
