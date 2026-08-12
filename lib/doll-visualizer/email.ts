import "server-only";

import sharp from "sharp";
import { sendEmail } from "@/lib/email/sendEmail";

export async function sendVisualizerLookEmail(input: {
  to: string;
  productName: string;
  productUrl: string;
  sourceImageUrl: string;
  previewDataUrl: string;
  selections: Array<{ group: string; option: string }>;
}) {
  const optionText = input.selections.map((item) => `${item.group}: ${item.option}`).join(" · ");
  const disclaimer = "This is an approximate visual preview, not a photograph of the finished doll. Color, texture, styling, and option details can vary in production. DollWOW will confirm final selections before the order moves forward.";
  const sourceAttachment = await fetchAttachment(input.sourceImageUrl, "dollwow-original.webp");
  const previewAttachment = await dataUrlAttachment(input.previewDataUrl, "dollwow-visualizer-preview.webp");
  return sendEmail({
    to: input.to,
    bcc: input.to.toLowerCase() === "hello@dollwow.com" ? undefined : "hello@dollwow.com",
    replyTo: "hello@dollwow.com",
    subject: "Your Doll Visualizer™ preview is ready",
    text: `Your preview is ready.\n\nWe created a Doll Visualizer™ preview using the product photo and appearance choices you selected.\n\n${input.productName}\n${optionText}\n\nReturn to the doll: ${input.productUrl}\n\n${disclaimer}\n\nHave a question about an option? Reply to this email or ask the DollWOW team.`,
    html: `<div style="font-family:Arial,sans-serif;color:#291f1b;max-width:620px;margin:auto"><span style="display:none;max-height:0;overflow:hidden">See the doll with the appearance choices you selected.</span><p style="font-size:12px;letter-spacing:.12em;color:#b5471f">DOLL VISUALIZER™</p><h1 style="font-size:28px">Your preview is ready</h1><p>We created a Doll Visualizer™ preview using the product photo and appearance choices you selected. Compare the original and your preview below, then return to the doll when you are ready.</p><div style="display:flex;gap:12px;margin:20px 0"><div style="width:50%"><p style="font-size:11px;font-weight:700;letter-spacing:.08em">ORIGINAL</p><img src="cid:dollwow-original" alt="Original product photo" style="display:block;width:100%;height:auto;border-radius:12px"></div><div style="width:50%"><p style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#b5471f">YOUR PREVIEW</p><img src="cid:dollwow-preview" alt="Doll Visualizer preview" style="display:block;width:100%;height:auto;border-radius:12px"></div></div><p style="line-height:1.6"><strong>${escapeHtml(input.productName)}</strong><br>${escapeHtml(optionText)}</p><p><a href="${input.productUrl}" style="display:inline-block;padding:14px 20px;border-radius:12px;background:#b5471f;color:#fff;text-decoration:none;font-weight:700">Return to the doll</a></p><p style="font-size:12px;line-height:1.5;color:#6e615a">${disclaimer}</p><p style="font-size:12px;line-height:1.5;color:#6e615a">Your identity and account details are never displayed with a preview.</p><p>Have a question about an option? Reply to this email or ask the DollWOW team.</p></div>`,
    attachments: [
      ...(sourceAttachment ? [{ ...sourceAttachment, cid: "dollwow-original" }] : []),
      ...(previewAttachment ? [{ ...previewAttachment, cid: "dollwow-preview" }] : [])
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
    return optimizedEmailAttachment(Buffer.from(match[1], "base64"), filename);
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
