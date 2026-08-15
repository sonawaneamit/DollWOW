import crypto from "node:crypto";
import { env } from "@/lib/utils/env";

export const DOLLVUE_SESSION_COOKIE = "dw_dollvue_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const ACCESS_TTL_SECONDS = 15 * 60;

type SessionPayload = { email: string; exp: number };
type AccessPayload = SessionPayload & { handle: string; nonce: string };

function secret() {
  if (!env.PASSPORT_SESSION_SECRET) throw new Error("DollVue access is not configured.");
  return env.PASSPORT_SESSION_SECRET;
}

function sign(namespace: string, payload: string) {
  return crypto.createHmac("sha256", secret()).update(`${namespace}.${payload}`).digest("base64url");
}

function encode<T>(namespace: string, value: T) {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  return `${payload}.${sign(namespace, payload)}`;
}

function decode<T extends SessionPayload>(namespace: string, value?: string | null, now = Date.now()) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(namespace, payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
    if (!parsed.email || !parsed.exp || parsed.exp <= Math.floor(now / 1000)) return null;
    return { ...parsed, email: normalizeEmail(parsed.email) };
  } catch {
    return null;
  }
}

export function createDollVueAccessToken(email: string, handle: string, now = Date.now()) {
  return encode<AccessPayload>("dollvue-access", {
    email: normalizeEmail(email),
    handle,
    exp: Math.floor(now / 1000) + ACCESS_TTL_SECONDS,
    nonce: crypto.randomBytes(12).toString("base64url")
  });
}

export function verifyDollVueAccessToken(value?: string | null, now = Date.now()) {
  return decode<AccessPayload>("dollvue-access", value, now);
}

export function createDollVueSessionValue(email: string, now = Date.now()) {
  return encode<SessionPayload>("dollvue-session", {
    email: normalizeEmail(email),
    exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS
  });
}

export function verifyDollVueSessionValue(value?: string | null, now = Date.now()) {
  return decode<SessionPayload>("dollvue-session", value, now);
}

export function readDollVueSession(cookieHeader: string | null) {
  const value = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DOLLVUE_SESSION_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  return verifyDollVueSessionValue(value ? decodeURIComponent(value) : null);
}

export function dollVueSessionCookie(email: string) {
  return `${DOLLVUE_SESSION_COOKIE}=${encodeURIComponent(createDollVueSessionValue(email))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}; Secure`;
}

export function dollVueEmailHash(email: string) {
  return crypto.createHmac("sha256", secret()).update(`dollvue-email:${normalizeEmail(email)}`).digest("hex");
}

export function maskedEmail(email: string) {
  const [local, domain] = normalizeEmail(email).split("@");
  if (!domain) return email;
  return `${local.slice(0, 2)}${local.length > 2 ? "•••" : ""}@${domain}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
