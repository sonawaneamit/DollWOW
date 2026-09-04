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
        source: "/learn/sex-doll-body-heating",
        destination: "/learn/body-heating-sex-doll-guide",
        permanent: true
      },
      {
        source: "/products/null",
        destination: "/shop/sex-dolls",
        permanent: false
      },
      {
        source: "/dollvue/null",
        destination: "/dollvue",
        permanent: false
      },
      {
        source: "/shop/null",
        destination: "/shop/sex-dolls",
        permanent: false
      },
      {
        source: "/products/irontech-fenny",
        destination: "/products/irontech-fenny-162cm-g-cup-hybrid-companion-doll-1if4v",
        permanent: true
      },
      {
        source: "/learn/zelex-dolls-buying-guide",
        destination: "/brands/zelex",
        permanent: false
      },
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
      { protocol: "https", hostname: "www.fanreal.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;
