import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/documents";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ documents: await listDocuments() });
  } catch (err) {
    return jsonError(err);
  }
}
