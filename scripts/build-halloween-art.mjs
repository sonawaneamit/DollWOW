import sharp from "sharp";

const base = "public/promo/halloween-2026/";
const portrait = `${base}concept-review/supplier-portrait-cutout.webp`;
for (const [plate, output, width, left, top] of [
  ["concept-review/campaign-plate-gpt25.webp", "offer-desktop-gpt25.webp", 800, 1210, 60],
  ["concept-review/campaign-mobile-plate-gpt25.webp", "offer-mobile-gpt25.webp", 560, 232, 692]
]) {
  const source = sharp(base + plate);
  const info = await source.metadata();
  const photo = await sharp(portrait).resize({ width }).toBuffer();
  const photoInfo = await sharp(photo).metadata();
  const clipped = await sharp(photo).extract({ left: 0, top: 0, width: Math.min(width, info.width - left), height: Math.min(photoInfo.height, info.height - top) }).toBuffer();
  await source.composite([{ input: clipped, left, top }]).webp({ quality: 90 }).toFile(base + output);
  console.log(output, info.width, info.height);
}
