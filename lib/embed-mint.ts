import { zsignJson } from "./zsign.ts";

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

function withNext(url: string, nextPath: string): string {
  if (!url) return "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}next=${encodeURIComponent(nextPath)}`;
}

export async function mintHubUrl(
  nextPath: string,
  recipientEmail?: string,
): Promise<MintResult> {
  const body = recipientEmail ? { recipientEmail } : {};
  const minted = await zsignJson<{
    url?: string;
    recipientEmail?: string | null;
    recipientIsOrgMember?: boolean;
  }>("embed/hub", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    url: withNext(minted.url || "", nextPath),
    recipientEmail: minted.recipientEmail,
    recipientIsOrgMember: minted.recipientIsOrgMember,
  };
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
      return mintHubUrl("/embed/documents");
    case "requests":
      return mintHubUrl("/embed/requests");
    case "requests-drafts":
      return mintHubUrl("/embed/requests/drafts");
    case "requests-sent":
      return mintHubUrl("/embed/requests/sent");
    case "requests-received":
      return mintHubUrl(
        "/embed/requests/received",
        candidateEmail?.trim() || undefined,
      );
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
