import { NextResponse } from "next/server";
import { lookupDictionaryWord } from "@/lib/dictionary";

export async function GET(_request: Request, context: { params: Promise<{ word: string }> }) {
  const { word } = await context.params;
  const lookup = await lookupDictionaryWord(decodeURIComponent(word));

  return NextResponse.json(lookup);
}
