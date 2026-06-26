import { NextResponse } from "next/server";
import { getVisualSearchRequest } from "@/lib/supabase/repositories";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getVisualSearchRequest(id);

  if (!result) {
    return NextResponse.json({ error: "Visual search request not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}
