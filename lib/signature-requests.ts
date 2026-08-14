import { zsignJson } from "@/lib/zsign";

export type SignatureRequestRow = {
  id: string;
  title: string;
  status: string;
  recipientEmail: string;
  recipientName: string;
};

type Recipient = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type SignatureRequest = {
  id: string;
  title?: string;
  requestStatus?: string;
  recipients?: Recipient[];
};

type ListResponse = { data?: SignatureRequest[] };

export function toRow(sr: SignatureRequest): SignatureRequestRow {
  const r = sr.recipients?.[0];
  const name =
    r?.firstName || r?.lastName
      ? `${r?.firstName || ""} ${r?.lastName || ""}`.trim()
      : "";
  return {
    id: sr.id,
    title: sr.title || "Signature request",
    status: sr.requestStatus || "draft",
    recipientEmail: r?.email || "",
    recipientName: name,
  };
}

export async function listSignatureRequests(): Promise<SignatureRequestRow[]> {
  const drafts = await zsignJson<ListResponse>(
    "signature-requests?status=draft&limit=50",
  );
  const rest = await zsignJson<ListResponse>("signature-requests?limit=50");
  const seen = new Set<string>();
  const rows: SignatureRequestRow[] = [];
  for (const sr of [...(drafts.data || []), ...(rest.data || [])]) {
    if (seen.has(sr.id)) continue;
    seen.add(sr.id);
    rows.push(toRow(sr));
  }
  return rows;
}

export async function getSignatureRequest(id: string): Promise<SignatureRequestRow> {
  const sr = await zsignJson<SignatureRequest>(`signature-requests/${id}`);
  return toRow(sr);
}
