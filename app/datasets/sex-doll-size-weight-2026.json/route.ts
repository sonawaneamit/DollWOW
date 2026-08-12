import { NextResponse } from "next/server";
import sizeWeightIndexData from "@/content/learn/sex-doll-size-weight-index.json";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

export const revalidate = 3600;

export function GET() {
  return NextResponse.json({
    name: "DollWow Sex Doll Size and Weight Index 2026",
    description: "A dated aggregate analysis of current full-size DollWow catalog listings with usable height, listed weight, and price data.",
    canonicalGuide: `${siteUrl}/learn/sex-doll-size-weight-guide`,
    license: "https://creativecommons.org/licenses/by/4.0/",
    attribution: "DollWow Sex Doll Size and Weight Index 2026, reviewed August 12, 2026",
    useNotes: [
      "Cite the canonical guide when publishing figures from this dataset.",
      "These aggregates describe the reviewed DollWow catalog and are not a universal market average.",
      "Product data, prices, materials, and availability can change after the review date."
    ],
    ...sizeWeightIndexData
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
