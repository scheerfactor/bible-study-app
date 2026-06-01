import { NextResponse } from "next/server";
import { searchDictionary } from "@/lib/dictionary";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 25);
  const entries = await searchDictionary(query, Math.min(Math.max(limit, 1), 50));

  return NextResponse.json({
    query,
    count: entries.length,
    entries,
  });
}
