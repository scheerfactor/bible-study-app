import { NextResponse } from "next/server";
import { readTextContent } from "@/lib/server-content-storage";

const publicCommentaryFilePattern = /^[a-z0-9-]+commentary\.json$/;

export async function GET(_request: Request, context: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await context.params;
  const decodedFileName = decodeURIComponent(fileName);

  if (!publicCommentaryFilePattern.test(decodedFileName)) {
    return NextResponse.json({ error: "Invalid commentary import file." }, { status: 400 });
  }

  try {
    const raw = await readTextContent(["data", "imports", decodedFileName], {
      errorLabel: "Commentary import",
      revalidateSeconds: 60 * 60 * 24,
    });

    return new NextResponse(raw, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Commentary import file not found." }, { status: 404 });
  }
}
