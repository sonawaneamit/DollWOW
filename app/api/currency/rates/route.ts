import { NextResponse } from "next/server";

const FALLBACK_RATES = { USD: 1, EUR: 0.86, GBP: 0.75, CAD: 1.37, AUD: 1.53 } as const;

export const revalidate = 86400;

export async function GET() {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CAD,AUD", {
      next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`Rates request failed (${response.status})`);
    const payload = (await response.json()) as { date?: string; rates?: Record<string, number> };
    return NextResponse.json({ base: "USD", date: payload.date, rates: { ...FALLBACK_RATES, ...payload.rates } });
  } catch {
    return NextResponse.json({ base: "USD", date: "fallback", rates: FALLBACK_RATES });
  }
}
