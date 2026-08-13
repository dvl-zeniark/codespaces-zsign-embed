import { NextRequest, NextResponse } from "next/server";
import {
  mintEmbedSurface,
  type EmbedSurface,
} from "@/lib/embed-mint";
import { getSignatureRequest } from "@/lib/signature-requests";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

const SURFACES: EmbedSurface[] = [
  "documents",
  "builder",
  "builder-new",
  "requests",
  "requests-drafts",
  "requests-sent",
  "requests-received",
  "signer",
];

function parseSurface(raw: string | null): EmbedSurface {
  if (raw && SURFACES.includes(raw as EmbedSurface)) {
    return raw as EmbedSurface;
  }
  return "documents";
}

export async function GET(req: NextRequest) {
  try {
    const surface = parseSurface(req.nextUrl.searchParams.get("surface"));
    const requestId = req.nextUrl.searchParams.get("requestId")?.trim() || "";
    const documentId = req.nextUrl.searchParams.get("documentId")?.trim() || "";
    let recipientEmail =
      req.nextUrl.searchParams.get("recipientEmail")?.trim() || "";

    if (requestId) {
      try {
        const row = await getSignatureRequest(requestId);
        if (!recipientEmail && row.recipientEmail) {
          recipientEmail = row.recipientEmail;
        }
      } catch {
        /* optional */
      }
    }

    const minted = await mintEmbedSurface(
      requestId,
      surface,
      recipientEmail || undefined,
      documentId || undefined,
    );
    return NextResponse.json({
      url: minted.url,
      surface,
      requestId: requestId || null,
      documentId: documentId || null,
      recipientEmail: minted.recipientEmail ?? (recipientEmail || null),
      recipientIsOrgMember: minted.recipientIsOrgMember,
    });
  } catch (err) {
    return jsonError(err);
  }
}
