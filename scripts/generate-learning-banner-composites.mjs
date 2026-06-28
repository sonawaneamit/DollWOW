import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "images", "learn");
const WIDTH = 1536;
const HEIGHT = 1024;
const PHOTO_LEFT = 548;
const PHOTO_WIDTH = WIDTH - PHOTO_LEFT;

const banners = [
  {
    slug: "tpe-vs-silicone-sex-dolls",
    imageUrl: "https://www.rosemarydoll.com/wp-content/uploads/2020/05/163cm5ft4-H-cup-TPE-Sex-Doll-Addison-8-1.jpg",
    accent: "#d99d6b",
    rose: "#8e5046",
    motif: "swatches"
  },
  {
    slug: "sex-doll-cost",
    imageUrl: "https://www.rosemarydoll.com/wp-content/uploads/2022/09/153cm5ft-E-cup-Silicone-Head-Sex-Doll-–-Adele-12.jpg",
    accent: "#c98f5e",
    rose: "#74443c",
    motif: "cards"
  },
  {
    slug: "best-sex-dolls",
    imageUrl: "https://www.rosemarydoll.com/wp-content/uploads/2022/12/153cm5ft-F-cup-Silicone-Sex-Doll-–-Fenny-7.jpg",
    accent: "#dfb072",
    rose: "#7c3f35",
    motif: "rank"
  },
  {
    slug: "most-realistic-sex-dolls",
    imageUrl: "https://www.rosemarydoll.com/wp-content/uploads/2026/05/151cm4ft11-F-cup-Silicone-Sex-Doll-–-Evie-45.jpg",
    accent: "#d6a96f",
    rose: "#6f443f",
    motif: "inspection"
  },
  {
    slug: "mini-sex-dolls",
    imageUrl: "https://www.rosemarydoll.com/wp-content/uploads/2024/04/153cm5ft-F-cup-TPE-Sex-Doll-–-Avery.B-9.jpg",
    accent: "#c99572",
    rose: "#76514a",
    motif: "measure"
  },
  {
    slug: "male-sex-doll-buying-guide",
    imageUrl: "https://www.rosemarydoll.com/wp-content/uploads/2022/09/175cm5ft9-Male-Silicone-Head-Sex-Doll-–-Caesar-6.jpg",
    accent: "#bd8d67",
    rose: "#57413d",
    motif: "proportion"
  },
  {
    slug: "sex-doll-reviews",
    imageUrl: "https://www.rosemarydoll.com/wp-content/uploads/2020/05/163cm5ft4-H-cup-TPE-Sex-Doll-Addison-8-1.jpg",
    accent: "#d7a36e",
    rose: "#6f3d38",
    motif: "verify"
  },
  {
    slug: "ready-to-ship-vs-custom-sex-dolls",
    imageUrl: "https://www.rosemarydoll.com/wp-content/uploads/2022/09/153cm5ft-E-cup-Silicone-Head-Sex-Doll-–-Adele-12.jpg",
    accent: "#d4a064",
    rose: "#6c453c",
    motif: "split"
  },
  {
    slug: "discreet-sex-doll-shipping",
    imageUrl: "https://www.rosemarydoll.com/wp-content/uploads/2026/05/153cm5ft-F-cup-Silicone-Sex-Doll-–-Vivian-7.jpg",
    accent: "#c99666",
    rose: "#64413b",
    motif: "privacy"
  }
];

await fs.mkdir(OUT_DIR, { recursive: true });

for (const banner of banners) {
  const productLayer = await productPhotoLayer(banner.imageUrl);
  const background = await sharp(Buffer.from(backgroundSvg(banner)))
    .composite([
      {
        input: productLayer,
        left: PHOTO_LEFT,
        top: 0
      },
      {
        input: Buffer.from(foregroundSvg(banner)),
        left: 0,
        top: 0
      }
    ])
    .webp({ quality: 88 })
    .toBuffer();

  const outputPath = path.join(OUT_DIR, `${banner.slug}.webp`);
  await fs.writeFile(outputPath, background);
  console.log(`wrote ${path.relative(ROOT, outputPath)}`);
}

async function productPhotoLayer(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Could not fetch ${imageUrl}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  return sharp(buffer)
    .resize({
      width: PHOTO_WIDTH,
      height: HEIGHT,
      fit: "cover",
      position: sharp.strategy.attention
    })
    .modulate({ saturation: 0.94, brightness: 0.94 })
    .png()
    .toBuffer();
}

function backgroundSvg({ accent, rose, motif }) {
  const decorative = motifSvg(motif, accent, rose);
  return `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#130706"/>
        <stop offset="0.54" stop-color="#2a1210"/>
        <stop offset="1" stop-color="#080504"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.18" cy="0.20" r="0.72">
        <stop offset="0" stop-color="${accent}" stop-opacity="0.42"/>
        <stop offset="0.48" stop-color="${rose}" stop-opacity="0.16"/>
        <stop offset="1" stop-color="#080504" stop-opacity="0"/>
      </radialGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="28" stdDeviation="34" flood-color="#000000" flood-opacity="0.42"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <rect x="52" y="92" width="430" height="816" rx="28" fill="#fff7ef" opacity="0.07" stroke="${accent}" stroke-opacity="0.18"/>
    <rect x="88" y="138" width="156" height="124" rx="18" fill="${rose}" opacity="0.38"/>
    <rect x="270" y="138" width="156" height="124" rx="18" fill="#fff7ef" opacity="0.12"/>
    <rect x="88" y="312" width="330" height="22" rx="11" fill="${accent}" opacity="0.38"/>
    <rect x="88" y="362" width="278" height="18" rx="9" fill="#fff7ef" opacity="0.2"/>
    <rect x="88" y="410" width="314" height="18" rx="9" fill="#fff7ef" opacity="0.14"/>
    <rect x="88" y="510" width="104" height="104" rx="18" fill="#fff7ef" opacity="0.14"/>
    <rect x="218" y="510" width="104" height="104" rx="18" fill="${accent}" opacity="0.25"/>
    <rect x="348" y="510" width="104" height="104" rx="18" fill="${rose}" opacity="0.3"/>
    <rect x="88" y="646" width="170" height="112" rx="18" fill="#fff7ef" opacity="0.08" stroke="${accent}" stroke-opacity="0.12"/>
    <rect x="286" y="646" width="166" height="112" rx="18" fill="#080504" opacity="0.18" stroke="${accent}" stroke-opacity="0.16"/>
    <path d="M92 794 C172 728 250 842 334 778 C396 730 436 750 480 804" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" opacity="0.36"/>
    <rect x="96" y="830" width="220" height="56" rx="18" fill="#080504" opacity="0.38" stroke="${accent}" stroke-opacity="0.22"/>
    ${decorative}
    <path d="M0 812 C224 724 340 854 570 790 C770 734 910 692 1150 748 C1310 788 1424 744 1536 692 L1536 1024 L0 1024 Z" fill="#f8efe7" opacity="0.055"/>
  </svg>`;
}

function foregroundSvg() {
  return `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="photoShade" x1="0" x2="1">
        <stop offset="0" stop-color="#080504" stop-opacity="0.78"/>
        <stop offset="0.18" stop-color="#080504" stop-opacity="0.32"/>
        <stop offset="0.74" stop-color="#080504" stop-opacity="0.04"/>
        <stop offset="1" stop-color="#080504" stop-opacity="0.56"/>
      </linearGradient>
      <linearGradient id="wholeShade" x1="0" x2="1">
        <stop offset="0" stop-color="#080504" stop-opacity="0.04"/>
        <stop offset="0.54" stop-color="#080504" stop-opacity="0.02"/>
        <stop offset="1" stop-color="#080504" stop-opacity="0.34"/>
      </linearGradient>
      <linearGradient id="bottomShade" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#080504" stop-opacity="0"/>
        <stop offset="1" stop-color="#080504" stop-opacity="0.66"/>
      </linearGradient>
    </defs>
    <rect x="${PHOTO_LEFT}" y="0" width="${PHOTO_WIDTH}" height="${HEIGHT}" fill="url(#photoShade)"/>
    <rect x="${PHOTO_LEFT}" y="760" width="${PHOTO_WIDTH}" height="264" fill="url(#bottomShade)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#wholeShade)"/>
  </svg>`;
}

function motifSvg(motif, accent, rose) {
  const commonStroke = `stroke="${accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"`;
  if (motif === "swatches") {
    return `
      <g filter="url(#softShadow)">
        <rect x="188" y="690" width="160" height="116" rx="18" fill="#17100e" stroke="${accent}" stroke-opacity="0.38"/>
        <rect x="382" y="654" width="160" height="116" rx="18" fill="${rose}" opacity="0.58" stroke="${accent}" stroke-opacity="0.32"/>
        <path d="M220 834 L514 798" ${commonStroke}/>
      </g>`;
  }
  if (motif === "cards") {
    return `
      <g filter="url(#softShadow)">
        <rect x="166" y="664" width="130" height="176" rx="16" fill="#f8efe7" opacity="0.16"/>
        <rect x="326" y="632" width="130" height="208" rx="16" fill="${accent}" opacity="0.25"/>
        <rect x="486" y="696" width="130" height="144" rx="16" fill="${rose}" opacity="0.42"/>
      </g>`;
  }
  if (motif === "rank") {
    return `
      <g filter="url(#softShadow)">
        <circle cx="220" cy="714" r="52" fill="${accent}" opacity="0.28"/>
        <circle cx="352" cy="714" r="52" fill="#f8efe7" opacity="0.14"/>
        <circle cx="484" cy="714" r="52" fill="${rose}" opacity="0.34"/>
        <path d="M184 820 H520" ${commonStroke}/>
      </g>`;
  }
  if (motif === "inspection") {
    return `
      <g filter="url(#softShadow)">
        <circle cx="286" cy="696" r="92" fill="none" stroke="${accent}" stroke-width="14" opacity="0.34"/>
        <path d="M350 760 L488 878" ${commonStroke}/>
        <rect x="450" y="628" width="110" height="110" rx="18" fill="#f8efe7" opacity="0.14"/>
      </g>`;
  }
  if (motif === "measure") {
    return `
      <g filter="url(#softShadow)">
        <rect x="166" y="710" width="420" height="52" rx="26" fill="${accent}" opacity="0.26"/>
        <path d="M208 710 V762 M272 710 V750 M336 710 V762 M400 710 V750 M464 710 V762 M528 710 V750" ${commonStroke}/>
        <rect x="222" y="608" width="170" height="72" rx="18" fill="#f8efe7" opacity="0.13"/>
      </g>`;
  }
  if (motif === "proportion") {
    return `
      <g filter="url(#softShadow)">
        <rect x="216" y="620" width="116" height="248" rx="58" fill="#f8efe7" opacity="0.12" stroke="${accent}" stroke-opacity="0.28"/>
        <path d="M170 660 H388 M190 750 H368 M214 842 H344" ${commonStroke}/>
        <rect x="430" y="682" width="118" height="132" rx="18" fill="${rose}" opacity="0.34"/>
      </g>`;
  }
  if (motif === "verify") {
    return `
      <g filter="url(#softShadow)">
        <rect x="170" y="626" width="376" height="214" rx="24" fill="#f8efe7" opacity="0.12"/>
        <path d="M228 732 L292 790 L430 660" ${commonStroke}/>
        <circle cx="498" cy="688" r="44" fill="${accent}" opacity="0.24"/>
      </g>`;
  }
  if (motif === "split") {
    return `
      <g filter="url(#softShadow)">
        <rect x="154" y="640" width="184" height="190" rx="22" fill="#f8efe7" opacity="0.13"/>
        <rect x="390" y="640" width="184" height="190" rx="22" fill="${rose}" opacity="0.32"/>
        <path d="M364 608 V862" ${commonStroke}/>
      </g>`;
  }
  return `
    <g filter="url(#softShadow)">
      <rect x="190" y="648" width="300" height="200" rx="24" fill="#f8efe7" opacity="0.13"/>
      <path d="M250 700 V650 C250 598 430 598 430 650 V700" ${commonStroke}/>
      <rect x="236" y="706" width="208" height="96" rx="18" fill="${accent}" opacity="0.2"/>
    </g>`;
}
