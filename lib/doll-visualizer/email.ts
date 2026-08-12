import "server-only";

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
  const disclaimer = "AI-generated preview for illustration only. Colors, shades, textures, and small details may vary, and AI can occasionally misinterpret a feature. The finished doll follows your confirmed factory options—not this image.";
  const match = input.previewDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  const sourceAttachment = await fetchAttachment(input.sourceImageUrl, "dollwow-reference-photo.jpg");
  return sendEmail({
    to: input.to,
    bcc: "hello@dollwow.com",
    replyTo: "hello@dollwow.com",
    subject: `Your Doll Visualizer™ look for ${input.productName}`,
    text: `Your Doll Visualizer™ look is ready.\n\n${optionText}\n\nContinue customizing: ${input.productUrl}\n\n${disclaimer}`,
    html: `<div style="font-family:Arial,sans-serif;color:#291f1b;max-width:620px;margin:auto"><p style="font-size:12px;letter-spacing:.12em;color:#b5471f">DOLL VISUALIZER™</p><h1 style="font-size:28px">Your look is ready</h1><p>Your original reference and generated preview are attached for an easy before-and-after comparison.</p><p style="line-height:1.6"><strong>${escapeHtml(input.productName)}</strong><br>${escapeHtml(optionText)}</p><p><a href="${input.productUrl}" style="display:inline-block;padding:14px 20px;border-radius:12px;background:#b5471f;color:#fff;text-decoration:none;font-weight:700">Continue customizing</a></p><p style="font-size:12px;line-height:1.5;color:#6e615a">${disclaimer}</p></div>`,
    attachments: [
      ...(sourceAttachment ? [sourceAttachment] : []),
      ...(match ? [{ filename: "dollwow-visualizer-preview.webp", content: match[2], contentType: match[1] }] : [])
    ]
  });
}

async function fetchAttachment(url: string, filename: string) {
  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return { filename, content: Buffer.from(await response.arrayBuffer()).toString("base64"), contentType };
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]!));
}
