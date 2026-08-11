import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/utils/env";

const COOKIE = "dollwow_passport_session";
const TTL_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  return env.PASSPORT_SESSION_SECRET;
}

export function createPassportSessionValue(email: string, now = Date.now()) {
  const key = secret();
  if (!key) throw new Error("Passport access is not configured.");
  const payload = Buffer.from(JSON.stringify({ email: email.trim().toLowerCase(), exp: Math.floor(now / 1000) + TTL_SECONDS })).toString("base64url");
  const signature = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyPassportSessionValue(value?: string | null, now = Date.now()) {
  const key = secret();
  if (!key || !value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; exp?: number };
    if (!parsed.email || !parsed.exp || parsed.exp <= Math.floor(now / 1000)) return null;
    return { email: parsed.email };
  } catch { return null; }
}

export async function getPassportSession() {
  return verifyPassportSessionValue((await cookies()).get(COOKIE)?.value);
}

export async function setPassportSession(email: string) {
  (await cookies()).set(COOKIE, createPassportSessionValue(email), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: TTL_SECONDS });
}

export async function clearPassportSession() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export function safeAccountRedirect(path?: string | null) {
  return path?.startsWith("/account/") && !path.startsWith("//") ? path : "/account/my-dolls";
}

export function createPassportAccessToken(email: string, redirectPath: string, now = Date.now()) {
  const key = secret();
  if (!key) throw new Error("Passport access is not configured.");
  const payload = Buffer.from(JSON.stringify({ email: email.trim().toLowerCase(), redirectPath: safeAccountRedirect(redirectPath), exp: Math.floor(now / 1000) + 15 * 60, nonce: crypto.randomBytes(12).toString("base64url") })).toString("base64url");
  const signature = crypto.createHmac("sha256", key).update(`access.${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyPassportAccessToken(value?: string | null, now = Date.now()) {
  const key = secret();
  if (!key || !value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", key).update(`access.${payload}`).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string; redirectPath?: string; exp?: number };
    if (!parsed.email || !parsed.exp || parsed.exp <= Math.floor(now / 1000)) return null;
    return { email: parsed.email, redirectPath: safeAccountRedirect(parsed.redirectPath) };
  } catch { return null; }
}
