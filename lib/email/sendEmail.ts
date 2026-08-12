import "server-only";

import nodemailer from "nodemailer";
import { env } from "@/lib/utils/env";

export type EmailMessage = {
  to: string;
  bcc?: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string; contentType: string; cid?: string }>;
};

export type EmailDelivery = {
  delivered: boolean;
  provider: "google_workspace" | "cloudflare" | "none";
};

export async function sendEmail(message: EmailMessage): Promise<EmailDelivery> {
  const googleDelivery = await sendWithGoogleWorkspace(message);
  if (googleDelivery.delivered) return googleDelivery;

  const cloudflareDelivery = await sendWithCloudflare(message);
  if (cloudflareDelivery.delivered) return cloudflareDelivery;

  return { delivered: false, provider: "none" };
}

async function sendWithGoogleWorkspace(message: EmailMessage): Promise<EmailDelivery> {
  if (!env.GOOGLE_WORKSPACE_EMAIL || !env.GOOGLE_WORKSPACE_APP_PASSWORD) {
    return { delivered: false, provider: "none" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: env.GOOGLE_WORKSPACE_EMAIL,
        pass: env.GOOGLE_WORKSPACE_APP_PASSWORD.replaceAll(" ", "")
      }
    });

    await transporter.sendMail({
      from: `DollWow <${env.GOOGLE_WORKSPACE_EMAIL}>`,
      to: message.to,
      bcc: message.bcc,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        encoding: "base64",
        contentType: attachment.contentType,
        cid: attachment.cid
      }))
    });

    return { delivered: true, provider: "google_workspace" };
  } catch (error) {
    console.error("Google Workspace email failed", error);
    return { delivered: false, provider: "none" };
  }
}

async function sendWithCloudflare(message: EmailMessage): Promise<EmailDelivery> {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_EMAIL_API_TOKEN) {
    return { delivered: false, provider: "none" };
  }

  try {
    const recipient = message.to;
    const from = env.ADMIN_ALERT_FROM || env.ADMIN_ALERT_EMAIL || "hello@dollwow.com";
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_EMAIL_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: recipient,
          bcc: message.bcc,
          from,
          replyTo: message.replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
          attachments: message.attachments?.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
            type: attachment.contentType,
            disposition: "attachment"
          }))
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare email failed: ${response.status} ${await response.text()}`);
    }

    return { delivered: true, provider: "cloudflare" };
  } catch (error) {
    console.error("Cloudflare email failed", error);
    return { delivered: false, provider: "none" };
  }
}
