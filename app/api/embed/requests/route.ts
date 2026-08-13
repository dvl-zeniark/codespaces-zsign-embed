import { NextResponse } from "next/server";
import { listSignatureRequests } from "@/lib/signature-requests";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ requests: await listSignatureRequests() });
  } catch (err) {
    return jsonError(err);
  }
}
