import { catalogBrands, getCatalogBrand, isHiddenCatalogBrand, normalizeBrandText } from "@/lib/catalog/brands";

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
  confirmationSrc?: string;
  confirmationPreviewSrc?: string;
  confirmationDate?: string;
};

const allBrandAuthorizations: BrandAuthorization[] = [
  {
    id: "ido-dolls",
    brand: "IDO Dolls",
    brandValue: "ido",
    certificateIssuer: "AIDEROS ROBOT TECHNOLOGY CO., LTD",
    aliases: ["ido", "ido doll", "idodoll", "idodolls"],
    status: "certificate",
    certificateSrc: "/images/authorizations/ido-dolls-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/previews/ido-dolls-authorized.webp"
  },
  {
    id: "md-dolls",
    brand: "MD Doll",
    brandValue: "md",
    certificateIssuer: "MD DOLL",
    aliases: ["md", "md dolls", "mddoll", "mddolls"],
    status: "certificate",
    certificateSrc: "/images/authorizations/md-dolls-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/previews/md-dolls-authorized.webp"
  },
  {
    id: "top-fire-dolls",
    brand: "Top Fire Doll",
    brandValue: "top-fire",
    certificateIssuer: "Top Fire Doll",
    aliases: ["top fire", "top fire doll", "topfire", "topfiredoll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/top-fire-dolls-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/previews/top-fire-dolls-authorized.webp"
  },
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
    certificateIssuer: "HR Doll",
    aliases: ["herun", "herun doll", "herun dolls", "hr", "hr doll", "hr dolls"],
    status: "certificate",
    certificateSrc: "/images/authorizations/hr-doll-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/previews/hr-doll-authorized.webp"
  },
  {
    id: "climax-doll",
    brand: "Climax Doll",
    brandValue: "climax",
    certificateIssuer: "Zhongshan CLM Plastics Co., Ltd.",
    aliases: ["climax", "climax doll", "climax dolls", "clm", "clm doll"],
    status: "certificate",
    certificateSrc: "/images/authorizations/climax-doll-authorized.jpg",
    certificatePreviewSrc: "/images/authorizations/previews/climax-doll-authorized.webp"
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
  },
  {
    id: "funwest-dolls",
    brand: "FunWest Dolls",
    brandValue: "funwest",
    aliases: ["funwest", "funwest doll", "funwest dolls", "fun west"],
    certificateIssuer: "FunWest",
    status: "written-confirmation",
    confirmationSrc: "/images/authorizations/funwest-authorization-confirmation.jpg",
    confirmationPreviewSrc: "/images/authorizations/previews/funwest-authorization-confirmation.webp",
    confirmationDate: "16 Oct 2026"
  }
];
// Public list: unlaunched (hidden) catalog brands are excluded until launch.
export const brandAuthorizations: BrandAuthorization[] = allBrandAuthorizations.filter((entry) => !isHiddenCatalogBrand(entry.brandValue));


const brandsWithoutAuthorizationOnFile = new Set(["zelex", "lusandy"]);

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
