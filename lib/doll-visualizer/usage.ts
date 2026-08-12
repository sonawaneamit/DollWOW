import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/utils/env";
import { VISUALIZER_COOKIE, VISUALIZER_FREE_PREVIEWS } from "./config";

type Usage = { count: number; day: string };

export function readVisualizerUsage(cookieHeader: string | null): Usage {
  const value = cookieHeader?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${VISUALIZER_COOKIE}=`))?.split("=").slice(1).join("=");
  if (!value) return freshUsage();
  const [payload, signature] = decodeURIComponent(value).split(".");
  if (!payload || !signature || !validSignature(payload, signature)) return freshUsage();
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Usage;
    return parsed.day === dayKey() ? { count: Math.max(0, Math.min(VISUALIZER_FREE_PREVIEWS, parsed.count)), day: parsed.day } : freshUsage();
  } catch {
    return freshUsage();
  }
}

export function usageCookie(count: number) {
  const payload = Buffer.from(JSON.stringify({ count, day: dayKey() }), "utf8").toString("base64url");
  return `${VISUALIZER_COOKIE}=${payload}.${sign(payload)}; Path=/ops/doll-visualizer; HttpOnly; SameSite=Strict; Max-Age=86400; Secure`;
}

function freshUsage(): Usage { return { count: 0, day: dayKey() }; }
function dayKey() { return new Date().toISOString().slice(0, 10); }
function secret() { return env.PASSPORT_SESSION_SECRET || env.ADMIN_BASIC_AUTH_PASSWORD || "dollwow-local-visualizer-pilot-secret"; }
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
function validSignature(payload: string, signature: string) {
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
