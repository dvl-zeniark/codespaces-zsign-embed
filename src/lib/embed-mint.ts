import { zsignJson } from "@/lib/zsign";

// This is the core of the embed integration: one mint*() function per
// surface, each POSTing to the matching /embed/... endpoint and returning
// the URL to put in an <iframe src>. Called from
// src/pages/api/embed/mint.ts. See README.md for the full map.

export type EmbedSurface =
  | "documents"
  | "builder"
  | "builder-new"
  | "requests"
  | "requests-drafts"
  | "requests-sent"
  | "requests-received"
  | "signer";

export type MintResult = {
  url: string;
  recipientEmail?: string | null;
  recipientIsOrgMember?: boolean;
};

/** Documents landing - `POST /external/embed/documents`. */
export async function mintDocumentsLanding(): Promise<MintResult> {
  return zsignJson<MintResult>("embed/documents", { method: "POST" });
}

/** Requests landing - one of the direct `/external/embed/requests...` routes. */
export async function mintRequestsLanding(
  view: "all" | "drafts" | "sent" | "received",
  recipientEmail?: string,
): Promise<MintResult> {
  const path =
    view === "all" ? "embed/requests" : `embed/requests/${view}`;
  const body = recipientEmail ? { recipientEmail } : {};
  return zsignJson<MintResult>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function mintBuilderUrl(requestId: string): Promise<MintResult> {
  const minted = await zsignJson<{ url?: string }>(
    `embed/signature-requests/${requestId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    },
  );
  return { url: minted.url || "" };
}

export async function mintBuilderFromDocument(params: {
  documentId: string;
  title?: string;
  subject?: string;
}): Promise<MintResult> {
  const minted = await zsignJson<{ url?: string }>("embed/signature-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return { url: minted.url || "" };
}

export async function mintSignerUrl(requestId: string): Promise<MintResult> {
  const detail = await zsignJson<{
    recipients?: { id: string }[];
  }>(`signature-requests/${requestId}`);
  const recipientId = detail.recipients?.[0]?.id;
  if (!recipientId) {
    throw new Error(
      "Send the request in Builder first so a signer session exists.",
    );
  }
  const minted = await zsignJson<{ url?: string }>(
    `embed/signature-requests/${requestId}/recipients/${recipientId}`,
  );
  return { url: minted.url || "" };
}

export async function mintEmbedSurface(
  requestId: string,
  surface: EmbedSurface,
  candidateEmail?: string,
  documentId?: string,
): Promise<MintResult> {
  switch (surface) {
    case "documents":
      return mintDocumentsLanding();
    case "requests":
      return mintRequestsLanding("all");
    case "requests-drafts":
      return mintRequestsLanding("drafts");
    case "requests-sent":
      return mintRequestsLanding("sent");
    case "requests-received":
      return mintRequestsLanding("received", candidateEmail?.trim() || undefined);
    case "signer":
      if (!requestId) {
        throw new Error("Pick a sent request for the signer step.");
      }
      return mintSignerUrl(requestId);
    case "builder-new": {
      const id = documentId?.trim();
      if (!id) {
        throw new Error(
          "Pick a document from the dropdown (upload in Documents first).",
        );
      }
      return mintBuilderFromDocument({
        documentId: id,
        title: "Embed quickstart",
        subject: "Document to sign",
      });
    }
    case "builder":
    default:
      if (!requestId) {
        throw new Error("Pick a draft request for resume builder.");
      }
      return mintBuilderUrl(requestId);
  }
}
