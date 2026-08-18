import type { APIRoute } from "astro";
import { mintEmbedSurface, type EmbedSurface } from "@/lib/embed-mint";
import { getSignatureRequest } from "@/lib/signature-requests";
import { jsonError } from "@/lib/http";

export const prerender = false;

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

export const GET: APIRoute = async ({ url }) => {
  try {
    const surface = parseSurface(url.searchParams.get("surface"));
    const requestId = url.searchParams.get("requestId")?.trim() || "";
    const documentId = url.searchParams.get("documentId")?.trim() || "";
    let recipientEmail = url.searchParams.get("recipientEmail")?.trim() || "";

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
    return new Response(
      JSON.stringify({
        url: minted.url,
        surface,
        requestId: requestId || null,
        documentId: documentId || null,
        recipientEmail: minted.recipientEmail ?? (recipientEmail || null),
        recipientIsOrgMember: minted.recipientIsOrgMember,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return jsonError(err);
  }
};
