import { env } from "@/lib/utils/env";
import { formatMoney } from "@/lib/utils/currency";
import type { ComparisonRequest } from "@/types/comparison";
import { sendEmail } from "./sendEmail";

type SupportLeadAlert = {
  id?: string | null;
  sourceFlow: string;
  name?: string;
  email: string;
  question: string;
};

export async function sendSupportLeadAdminAlert(lead: SupportLeadAlert) {
  try {
    const appUrl = (env.ADMIN_APP_URL || env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
    const recipient = env.ADMIN_ALERT_EMAIL || "hello@dollwow.com";
    const isBrandLead = lead.sourceFlow === "brand-partnership" || lead.sourceFlow === "supplier";
    const subject = isBrandLead
      ? `New DollWow brand partnership message${lead.name ? ` from ${lead.name}` : ""}`
      : `New DollWow support request${lead.name ? ` from ${lead.name}` : ""}`;
    const sourceLabel = isBrandLead ? "Brand partnership" : lead.sourceFlow;
    const adminRow = isBrandLead ? `<p><strong>Website:</strong> <a href="${appUrl}">${escapeHtml(appUrl)}</a></p>` : "";
    const html = `
      <h2>${isBrandLead ? "New DollWow brand partnership message" : "New DollWow support request"}</h2>
      <p><strong>Source:</strong> ${escapeHtml(sourceLabel)}</p>
      <p><strong>Name:</strong> ${escapeHtml(lead.name || "Not provided")}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(lead.question).replaceAll("\n", "<br />")}</p>
      ${adminRow}
    `;
    const text = [
      isBrandLead ? "New DollWow brand partnership message" : "New DollWow support request",
      `Source: ${sourceLabel}`,
      `Name: ${lead.name || "Not provided"}`,
      `Email: ${lead.email}`,
      "",
      lead.question,
      ...(isBrandLead ? ["", `Website: ${appUrl}`] : [])
    ].join("\n");

    return await sendEmail({ to: recipient, replyTo: lead.email, subject, html, text });
  } catch (error) {
    console.error("Support lead admin alert failed", error);
    return { delivered: false, provider: "none" as const };
  }
}

export async function sendPriceMatchAdminAlert(request: ComparisonRequest) {
  try {
    const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const appUrl = (env.ADMIN_APP_URL || env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
    const reviewUrl = `${appUrl}/ops/price-match`;
    const resultUrl = `${appUrl}/price-match/${request.id}`;
    const targetProductUrl = request.targetProductHandle ? `${appUrl}/products/${request.targetProductHandle}` : null;
    const subject = `New price match request${request.targetProductTitle ? `: ${request.targetProductTitle}` : ""}`;
    const recipient = env.ADMIN_ALERT_EMAIL || "hello@dollwow.com";
    const quotedCurrency = request.quotedCurrency || request.parsed?.currency || "USD";
    const quotedPrice = request.quotedPrice ? formatMoney(request.quotedPrice, quotedCurrency) : "Not provided";
    const requestedDiscount =
      typeof request.requestedDiscountAmount === "number" ? formatMoney(request.requestedDiscountAmount, quotedCurrency) : "Not provided";
    const html = `
      <h2>New DollWow price match request</h2>
      <p><strong>Target product:</strong> ${targetProductUrl ? `<a href="${targetProductUrl}">${escapeHtml(request.targetProductTitle || request.targetProductHandle || targetProductUrl)}</a>` : escapeHtml(request.targetProductTitle || request.targetProductHandle || "Not specified")}</p>
      <p><strong>Competitor URL:</strong> <a href="${request.inputUrl}">${escapeHtml(request.inputUrl)}</a></p>
      <p><strong>Quoted price:</strong> ${quotedPrice} (${escapeHtml(quotedCurrency)})</p>
      <p><strong>Requested discount:</strong> ${requestedDiscount}</p>
      <p><strong>Customer email:</strong> ${escapeHtml(request.customerEmail || "Not provided")}</p>
      <p><strong>Screenshot:</strong> ${request.screenshotUrl ? `<a href="${request.screenshotUrl}">Open evidence</a>` : "Not included"}</p>
      <p><strong>Admin queue:</strong> <a href="${reviewUrl}">${escapeHtml(reviewUrl)}</a></p>
      <p><strong>Compare result:</strong> <a href="${resultUrl}">${escapeHtml(resultUrl)}</a></p>
      <p><strong>Public site:</strong> <a href="${siteUrl}">${escapeHtml(siteUrl)}</a></p>
    `;
    const text = [
      "New DollWow price match request",
      `Target product: ${targetProductUrl || request.targetProductTitle || request.targetProductHandle || "Not specified"}`,
      `Competitor URL: ${request.inputUrl}`,
      `Quoted price: ${quotedPrice}`,
      `Requested discount: ${requestedDiscount}`,
      `Customer email: ${request.customerEmail || "Not provided"}`,
      `Screenshot: ${request.screenshotUrl || "Not included"}`,
      `Admin queue: ${reviewUrl}`,
      `Customer result: ${resultUrl}`
    ].join("\n");

    await sendEmail({ to: recipient, replyTo: request.customerEmail, subject, html, text });
  } catch (error) {
    // ponytail: email alerts are best-effort; queue data already lives in Supabase
    console.error("Price match admin alert failed", error);
  }
}

export async function sendPriceMatchCustomerReply(input: {
  request: ComparisonRequest;
  productUrl?: string;
  isApproved: boolean;
}) {
  if (!input.request.customerEmail) return;

  const recipient = input.request.customerEmail;
  const quotedCurrency = input.request.quotedCurrency || input.request.parsed?.currency || "USD";
  const quotedPrice = input.request.quotedPrice ? formatMoney(input.request.quotedPrice, quotedCurrency) : "your quoted total";
  const subject = input.isApproved
    ? `Your DollWow price match is approved`
    : `Your DollWow price match was reviewed`;

  const html = input.isApproved
    ? `
      <h2>Your price match is approved</h2>
      <p>We reviewed your request for <strong>${escapeHtml(input.request.targetProductTitle || "your selected item")}</strong>.</p>
      <p><strong>Quoted competitor total:</strong> ${quotedPrice}</p>
      ${input.request.approvedDiscountCode ? `<p><strong>Your one-time code:</strong> ${escapeHtml(input.request.approvedDiscountCode)}</p>` : ""}
      ${typeof input.request.approvedDiscountAmount === "number" ? `<p><strong>Discount value:</strong> ${formatMoney(input.request.approvedDiscountAmount, input.request.approvedDiscountCurrency || quotedCurrency)}</p>` : ""}
      ${input.productUrl ? `<p><a href="${input.productUrl}">Open your DollWow product page</a></p>` : ""}
      <p>${escapeHtml(input.request.adminNotes || "Use the code at checkout on the matched DollWow product. If anything about the build needs a second look, reply to this email and we will help.")}</p>
    `
    : `
      <h2>Your price match was reviewed</h2>
      <p>We reviewed your request for <strong>${escapeHtml(input.request.targetProductTitle || "your selected item")}</strong>.</p>
      <p><strong>Quoted competitor total:</strong> ${quotedPrice}</p>
      <p>${escapeHtml(input.request.adminNotes || "We could not approve this match as submitted. Reply to this email if you want us to take another look.")}</p>
      <p>${input.productUrl ? `<a href="${input.productUrl}">Open your DollWow product page</a>` : ""}</p>
    `;

  const text = [
    input.isApproved ? "Your price match is approved" : "Your price match was reviewed",
    `Product: ${input.request.targetProductTitle || "your selected item"}`,
    `Quoted competitor total: ${quotedPrice}`,
    input.request.approvedDiscountCode ? `Code: ${input.request.approvedDiscountCode}` : "",
    typeof input.request.approvedDiscountAmount === "number"
      ? `Discount value: ${formatMoney(input.request.approvedDiscountAmount, input.request.approvedDiscountCurrency || quotedCurrency)}`
      : "",
    input.productUrl ? `Product URL: ${input.productUrl}` : "",
    input.request.adminNotes || (input.isApproved ? "Use the code at checkout on the matched DollWow product." : "Reply if you want us to take another look.")
  ]
    .filter(Boolean)
    .join("\n");

  const delivery = await sendEmail({ to: recipient, replyTo: env.ADMIN_ALERT_EMAIL || "hello@dollwow.com", subject, html, text });
  if (!delivery.delivered) {
    throw new Error("Customer email could not be delivered.");
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
