import { catalogBrands, getCatalogBrand, normalizeBrandText } from "@/lib/catalog/brands";

export type AuthorizationStatus = "certificate" | "written-confirmation" | "authorized";

export type BrandAuthorization = {
  id: string;
  brand: string;
  brandValue?: string;
  aliases: string[];
  status: AuthorizationStatus;
  certificateSrc?: string;
  certificatePreviewSrc?: string;
};

export const brandAuthorizations: BrandAuthorization[] = [
  {
    id: "wm-dolls",
    brand: "WM Dolls",
    brandValue: "wm",
    aliases: ["wm", "wm doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/wm-dolls-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/wm-dolls-authorized.jpg"
  },
  {
    id: "tantaly",
    brand: "Tantaly",
    brandValue: "tantaly",
    aliases: ["tantaly doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/tantaly-authorization.pdf",
    certificatePreviewSrc: "/images/authorizations/tantaly-authorization-preview.png"
  },
  {
    id: "dolls-castle",
    brand: "Dolls Castle",
    brandValue: "dolls-castle",
    aliases: ["doll castle"],
    status: "certificate",
    certificateSrc: "/images/authorizations/dolls-castle-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/dolls-castle-authorized.jpg"
  },
  {
    id: "starpery",
    brand: "Starpery Dolls",
    brandValue: "starpery",
    aliases: ["starpery", "starpery doll"],
    status: "written-confirmation"
  },
  {
    id: "herun-doll",
    brand: "Herun Doll",
    aliases: ["herun", "herun doll"],
    status: "written-confirmation"
  },
  {
    id: "rosretty",
    brand: "Rosretty Doll",
    aliases: ["rosretty", "rosretty doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/rosretty-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/rosretty-authorized.jpg"
  },
  {
    id: "sy-doll",
    brand: "SY Doll",
    aliases: ["sy doll", "sydoll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/sy-doll-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/sy-doll-authorized.jpg"
  },
  {
    id: "il-doll",
    brand: "IL Doll",
    aliases: ["il doll", "ildoll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/il-doll-authorization.pdf",
    certificatePreviewSrc: "/images/authorizations/il-doll-authorization-preview.png"
  },
  {
    id: "jarlie",
    brand: "Jarlie",
    aliases: ["jarlie doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/jarlie-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/jarlie-authorized.jpg"
  },
  {
    id: "avant-doll",
    brand: "Avant Doll",
    aliases: ["avant", "avant doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/avant-doll-authorized.jpeg",
    certificatePreviewSrc: "/images/authorizations/avant-doll-authorized.jpeg"
  }
];

export const liveAuthorizedBrands = catalogBrands.filter((brand) => brand.value !== "zelex");

export function getBrandAuthorization(value: string | undefined | null) {
  const catalogBrand = getCatalogBrand(value);
  const normalized = normalizeBrandText(catalogBrand?.value ?? value);

  return (
    brandAuthorizations.find((authorization) => {
      if (authorization.brandValue && authorization.brandValue === normalized) return true;
      return [authorization.brand, ...authorization.aliases].some((alias) => normalizeBrandText(alias) === normalized);
    }) ?? null
  );
}

export function isLiveAuthorizedBrand(value: string | undefined | null) {
  const brand = getCatalogBrand(value);
  return Boolean(brand && brand.value !== "zelex");
}
