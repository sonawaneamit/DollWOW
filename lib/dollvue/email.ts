import "server-only";

import sharp from "sharp";
import { sendEmail } from "@/lib/email/sendEmail";

export async function sendDollVueLookEmail(input: {
  to: string;
  productName: string;
  productUrl: string;
  sourceImageUrl: string;
  previewDataUrl: string;
  selections: Array<{ group: string; option: string }>;
  /** Opt-in for reviewed non-explicit exports; the existing generation route stays unchanged. */
  downloadablePreview?: boolean;
}) {
  const optionText = input.selections.map((item) => `${item.group}: ${item.option}`).join(" · ");
  const disclaimer = "This is an approximate visual preview, not a photograph of the finished doll. Color, texture, styling, and option details can vary in production. DollWOW will confirm final selections before the order moves forward.";
  const sourceAttachment = await fetchAttachment(input.sourceImageUrl, "dollwow-original.webp");
  const previewAttachment = await dataUrlAttachment(input.previewDataUrl, "dollwow-dollvue-preview.webp");
  const imageColumn = (label: string, available: boolean, cid: string, alt: string) => `<td width="50%" valign="top" style="padding:6px"><p style="font-size:12px;font-weight:700">${label}</p>${available
    ? `<img src="cid:${cid}" alt="${alt}" style="display:block;width:100%;height:auto">`
    : `<p>Image unavailable. <a href="${escapeHtml(input.productUrl)}">View the doll</a>.</p>`}</td>`;
  return sendEmail({
    to: input.to,
    bcc: input.to.toLowerCase() === "hello@dollwow.com" ? undefined : "hello@dollwow.com",
    replyTo: "hello@dollwow.com",
    subject: "Your DollVue™ preview is ready",
    text: `Your preview is ready.\n\nCreated with DollVue. Powered by DollWOW.\n\nWe created a DollVue™ preview using the product photo and appearance choices you selected.\n\n${input.productName}\n${optionText}\n\n${input.downloadablePreview ? 'Your branded preview is also included as a downloadable attachment.\n\n' : ''}Return to the doll: ${input.productUrl}\n\n${disclaimer}\n\nHave a question about an option? Reply to this email or ask the DollWOW team.`,
    html: `<div style="font-family:Arial,sans-serif;color:#291f1b;max-width:620px;margin:auto">
      <p style="font-size:12px;color:#b5471f">DOLLVUE · Powered by DollWOW.com</p>
      <h1 style="font-size:28px">Your preview is ready</h1>
      <p>We created a DollVue preview using the product photo and appearance choices you selected.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${imageColumn('ORIGINAL', Boolean(sourceAttachment), 'dollwow-original', 'Original product photo')}${imageColumn('YOUR PREVIEW', Boolean(previewAttachment), 'dollwow-preview', 'DollVue preview')}</tr></table>
      <p style="line-height:1.6"><strong>${escapeHtml(input.productName)}</strong><br>${escapeHtml(optionText)}</p>
      ${input.downloadablePreview ? '<p>Your branded preview is also included as a downloadable attachment.</p>' : ''}
      <p><a href="${escapeHtml(input.productUrl)}" style="display:inline-block;padding:14px 20px;border-radius:8px;background:#b5471f;color:#fff;text-decoration:none;font-weight:700">Return to the doll</a></p>
      <p style="font-size:12px;line-height:1.5;color:#6e615a">${disclaimer}</p>
      <p style="font-size:12px;line-height:1.5;color:#6e615a">Your identity and account details are never displayed with a preview.</p>
      <p>Have a question about an option? Reply to this email or ask the DollWOW team.</p>
    </div>`,
    attachments: [
      ...(sourceAttachment ? [{ ...sourceAttachment, cid: "dollwow-original" }] : []),
      ...(previewAttachment ? [{ ...previewAttachment, cid: "dollwow-preview" }] : []),
      ...(input.downloadablePreview && previewAttachment ? [{...previewAttachment,filename:'dollwow-dollvue-branded-preview.webp'}] : [])
    ]
  });
}

async function fetchAttachment(url: string, filename: string) {
  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;
    return optimizedEmailAttachment(Buffer.from(await response.arrayBuffer()), filename);
  } catch {
    return null;
  }
}

async function dataUrlAttachment(dataUrl: string, filename: string) {
  const match = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!match) return null;
  try {
    const bytes = Buffer.from(match[1], "base64");
    const metadata = await sharp(bytes, { limitInputPixels: 25_000_000 }).metadata();
    // Branded previews are already optimized. Keep identical bytes so another
    // resize/re-encode cannot blur the QR or remove the export attribution.
    if (metadata.format === 'webp' && (metadata.width ?? 0) <= 1600 && (metadata.height ?? 0) <= 2800) {
      return { filename, content: bytes.toString('base64'), contentType: 'image/webp' };
    }
    return optimizedEmailAttachment(bytes, filename);
  } catch {
    return null;
  }
}

async function optimizedEmailAttachment(bytes: Buffer, filename: string) {
  const content = await sharp(bytes, { failOn: "none" })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, effort: 4 })
    .toBuffer();
  return { filename, content: content.toString("base64"), contentType: "image/webp" };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]!));
}
