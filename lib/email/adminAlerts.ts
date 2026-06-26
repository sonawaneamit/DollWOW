import { env } from "@/lib/utils/env";
import { formatMoney } from "@/lib/utils/currency";
import type { ComparisonRequest } from "@/types/comparison";

type SupportLeadAlert = {
  id?: string | null;
  sourceFlow: string;
  name?: string;
  email: string;
  question: string;
};

export async function sendSupportLeadAdminAlert(lead: SupportLeadAlert) {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_EMAIL_API_TOKEN) return;

  try {
    const appUrl = (env.ADMIN_APP_URL || env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
    const recipient = env.ADMIN_ALERT_EMAIL || "hello@dollwow.com";
    const from = env.ADMIN_ALERT_FROM || recipient;
    const isBrandLead = lead.sourceFlow === "brand-partnership" || lead.sourceFlow === "supplier";
    const subject = isBrandLead
      ? `New DollWow brand partnership message${lead.name ? ` from ${lead.name}` : ""}`
      : `New DollWow support request${lead.name ? ` from ${lead.name}` : ""}`;
    const sourceLabel = isBrandLead ? "Brand partnership" : lead.sourceFlow;
    const adminHref = isBrandLead ? appUrl : `${appUrl}/price-match`;
    const html = `
      <h2>${isBrandLead ? "New DollWow brand partnership message" : "New DollWow support request"}</h2>
      <p><strong>Source:</strong> ${escapeHtml(sourceLabel)}</p>
      <p><strong>Name:</strong> ${escapeHtml(lead.name || "Not provided")}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(lead.question).replaceAll("\n", "<br />")}</p>
      <p><strong>Admin:</strong> <a href="${adminHref}">${escapeHtml(adminHref)}</a></p>
    `;
    const text = [
      isBrandLead ? "New DollWow brand partnership message" : "New DollWow support request",
      `Source: ${sourceLabel}`,
      `Name: ${lead.name || "Not provided"}`,
      `Email: ${lead.email}`,
      "",
      lead.question,
      "",
      `Admin site: ${adminHref}`
    ].join("\n");

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_EMAIL_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: recipient,
        from,
        subject,
        html,
        text
      })
    });
    if (!response.ok) {
      throw new Error(`Cloudflare email failed: ${response.status} ${await response.text()}`);
    }
  } catch (error) {
    console.error("Support lead admin alert failed", error);
  }
}

export async function sendPriceMatchAdminAlert(request: ComparisonRequest) {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_EMAIL_API_TOKEN) return;
  try {
    const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const appUrl = (env.ADMIN_APP_URL || env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");
    const reviewUrl = `${appUrl}/price-match`;
    const resultUrl = `${appUrl}/compare/${request.id}`;
    const targetProductUrl = request.targetProductHandle ? `${appUrl}/products/${request.targetProductHandle}` : null;
    const subject = `New price match request${request.targetProductTitle ? `: ${request.targetProductTitle}` : ""}`;
    const recipient = env.ADMIN_ALERT_EMAIL || "hello@dollwow.com";
    const from = env.ADMIN_ALERT_FROM || recipient;
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

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_EMAIL_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: recipient,
        from,
        subject,
        html,
        text
      })
    });
    if (!response.ok) {
      throw new Error(`Cloudflare email failed: ${response.status} ${await response.text()}`);
    }
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
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_EMAIL_API_TOKEN || !input.request.customerEmail) return;

  const recipient = input.request.customerEmail;
  const from = env.ADMIN_ALERT_FROM || env.ADMIN_ALERT_EMAIL || "hello@dollwow.com";
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

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_EMAIL_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: recipient,
      from,
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    throw new Error(`Cloudflare email failed: ${response.status} ${await response.text()}`);
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
