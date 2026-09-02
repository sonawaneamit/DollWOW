import archiveManifest from "@/app/factory-photos/archive-manifest.json";
import { getCustomerReviews } from "@/lib/reviews/reviews";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function categoryCaption(category: string) {
  if (category === "build") return "Completed build shown in an anonymized factory approval photo.";
  if (category === "face") return "Face and visible finish shown in an anonymized factory approval photo.";
  if (category === "release") return "Final visible release review shown in an anonymized factory approval photo.";
  return "Visible customization or finishing detail shown in an anonymized factory approval photo.";
}

export function GET() {
  const archiveImages = archiveManifest.entries.map((entry) => [
    "    <image:image>",
    `      <image:loc>${escapeXml(`${siteUrl}${entry.src}`)}</image:loc>`,
    "      <image:title>DollWOW Factory Approval Archive</image:title>",
    `      <image:caption>${escapeXml(categoryCaption(entry.category))}</image:caption>`,
    "    </image:image>"
  ].join("\n"));
  const reviewImages = getCustomerReviews().filter((review) => review.photo).map((review) => [
    "    <image:image>",
    `      <image:loc>${escapeXml(`${siteUrl}${review.photo}`)}</image:loc>`,
    `      <image:title>${escapeXml(`DollWOW customer photo — review by ${review.reviewerName}`)}</image:title>`,
    "      <image:caption>Watermarked customer photo supplied with a first-party DollWOW review.</image:caption>",
    "    </image:image>"
  ].join("\n"));

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    "  <url>",
    `    <loc>${escapeXml(`${siteUrl}/factory-photos`)}</loc>`,
    ...archiveImages,
    "  </url>",
    "  <url>",
    `    <loc>${escapeXml(`${siteUrl}/reviews`)}</loc>`,
    ...reviewImages,
    "  </url>",
    "</urlset>",
    ""
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
