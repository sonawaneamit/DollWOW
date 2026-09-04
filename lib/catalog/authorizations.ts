import { catalogBrands, getCatalogBrand, normalizeBrandText } from "@/lib/catalog/brands";

export type AuthorizationStatus = "certificate" | "written-confirmation" | "authorized";

export type BrandAuthorization = {
  id: string;
  brand: string;
  brandValue?: string;
  relatedBrandValues?: string[];
  relatedBrandNotes?: Record<string, string>;
  certificateIssuer?: string;
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
    certificatePreviewSrc: "/images/authorizations/previews/wm-dolls-authorized.webp"
  },
  {
    id: "tantaly",
    brand: "Tantaly",
    brandValue: "tantaly",
    aliases: ["tantaly doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/tantaly-authorization.pdf",
    certificatePreviewSrc: "/images/authorizations/previews/tantaly-authorization-preview.webp"
  },
  {
    id: "dolls-castle",
    brand: "Dolls Castle",
    brandValue: "dolls-castle",
    aliases: ["doll castle"],
    status: "certificate",
    certificateSrc: "/images/authorizations/dolls-castle-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/previews/dolls-castle-authorized.webp"
  },
  {
    id: "starpery",
    brand: "Starpery Dolls",
    brandValue: "starpery",
    aliases: ["starpery", "starpery doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/starpery-authorization.pdf",
    certificatePreviewSrc: "/images/authorizations/previews/starpery-authorization.jpg"
  },
  {
    id: "ai-tech",
    brand: "Ai-Tech",
    brandValue: "ai-tech",
    aliases: ["ai tech", "aitech", "ai tech doll", "ai tech dolls"],
    status: "certificate",
    certificateSrc: "/images/authorizations/ai-tech-authorization.png",
    certificatePreviewSrc: "/images/authorizations/previews/ai-tech-authorization.webp"
  },
  {
    id: "herun-doll",
    brand: "Herun Doll",
    brandValue: "hr",
    aliases: ["herun", "herun doll", "herun dolls", "hr", "hr doll", "hr dolls"],
    status: "written-confirmation"
  },
  {
    id: "rosretty",
    brand: "Rosretty Doll",
    brandValue: "rosretty",
    aliases: ["rosretty", "rosretty doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/rosretty-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/previews/rosretty-authorized.webp"
  },
  {
    id: "sy-doll",
    brand: "SY Doll",
    brandValue: "sy",
    relatedBrandValues: ["moonvale"],
    certificateIssuer: "SY Doll",
    aliases: ["sy doll", "sydoll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/sy-doll-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/previews/sy-doll-authorization.webp"
  },
  {
    id: "irontech",
    brand: "Irontech Dolls",
    brandValue: "irontech",
    relatedBrandValues: ["real-lady"],
    relatedBrandNotes: {
      "real-lady": "Real Lady is owned by Irontech Dolls, so the Irontech authorization certificate applies to this brand."
    },
    certificateIssuer: "Irontech Dolls",
    aliases: ["irontech", "irontech doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/irontech-authorization.jpeg",
    certificatePreviewSrc: "/images/authorizations/previews/irontech-authorization.webp"
  },
  {
    id: "il-doll",
    brand: "IL Doll",
    brandValue: "il-doll",
    aliases: ["il doll", "ildoll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/il-doll-authorization.pdf",
    certificatePreviewSrc: "/images/authorizations/previews/il-doll-authorization-preview.webp"
  },
  {
    id: "jarlie",
    brand: "Jarlie",
    brandValue: "jarliet",
    aliases: ["jarlie", "jarlie doll", "jarlie dolls", "jarliet", "jarliet doll", "jarliet dolls"],
    status: "certificate",
    certificateSrc: "/images/authorizations/jarlie-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/previews/jarlie-authorized.webp"
  },
  {
    id: "avant-doll",
    brand: "Avant Doll",
    brandValue: "avant",
    aliases: ["avant", "avant doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/avant-doll-authorized.jpeg",
    certificatePreviewSrc: "/images/authorizations/previews/avant-doll-authorized.webp"
  }
];

const brandsWithoutAuthorizationOnFile = new Set(["zelex", "climax", "fanreal"]);

export const liveAuthorizedBrands = catalogBrands.filter((brand) => !brandsWithoutAuthorizationOnFile.has(brand.value));

export function getBrandAuthorization(value: string | undefined | null) {
  const catalogBrand = getCatalogBrand(value);
  const normalized = normalizeBrandText(catalogBrand?.value ?? value);

  return (
    brandAuthorizations.find((authorization) => {
      if (authorization.brandValue && normalizeBrandText(authorization.brandValue) === normalized) return true;
      if (authorization.relatedBrandValues?.some((value) => normalizeBrandText(value) === normalized)) return true;
      return [authorization.brand, ...authorization.aliases].some((alias) => normalizeBrandText(alias) === normalized);
    }) ?? null
  );
}

export function isLiveAuthorizedBrand(value: string | undefined | null) {
  const brand = getCatalogBrand(value);
  return Boolean(brand && !brandsWithoutAuthorizationOnFile.has(brand.value));
}
