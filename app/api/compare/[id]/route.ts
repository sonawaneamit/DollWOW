import { NextResponse } from "next/server";
import { getComparisonRequest } from "@/lib/supabase/repositories";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comparison = await getComparisonRequest(id);
  if (!comparison) {
    return NextResponse.json({ error: "Comparison not found." }, { status: 404 });
  }
  return NextResponse.json(comparison);
}
