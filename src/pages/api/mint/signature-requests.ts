import type { APIRoute } from "astro";
import { jsonError } from "@/lib/http";
import { zsignJson } from "@/lib/zsign";

export const prerender = false;

const VIEWS = ["all", "drafts", "sent", "received"] as const;
type View = (typeof VIEWS)[number];

const HUBS = ["drafts", "sent", "received"] as const;
type Hub = (typeof HUBS)[number];

type MintBody = {
  view?: string;
  /** Received / guest scoping — preferred as directory.recipientEmail. */
  directory?: { recipientEmail?: string };
  /** Legacy alias; folded into directory.recipientEmail. */
  recipientEmail?: string;
  /** Only for view=all — narrows the tab switcher (hub hiding). */
  visibleHubs?: string[];
};

function parseView(raw: unknown): View {
  if (typeof raw === "string" && (VIEWS as readonly string[]).includes(raw)) {
    return raw as View;
  }
  return "all";
}

function parseVisibleHubs(raw: unknown): Hub[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const hubs = raw.filter(
    (h): h is Hub =>
      typeof h === "string" && (HUBS as readonly string[]).includes(h),
  );
  return hubs.length > 0 ? [...new Set(hubs)] : undefined;
}

/**
 * Mint a Signature-requests embed landing.
 *
 * Requests does **not** use full directory app context (name/people/logo) —
 * that is Documents + Builder for Add from contacts. Here we only pass
 * `directory.recipientEmail` for Received/guest scoping, plus optional
 * `sigRequest.visibleHubs` on the all-hubs landing.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as MintBody;
    const view = parseView(body.view);
    const recipientEmail =
      body.directory?.recipientEmail?.trim() ||
      body.recipientEmail?.trim() ||
      undefined;
    const visibleHubs =
      view === "all" ? parseVisibleHubs(body.visibleHubs) : undefined;

    const path = view === "all" ? "embed/requests" : `embed/requests/${view}`;
    const payload: Record<string, unknown> = {};
    if (recipientEmail) {
      payload.directory = { recipientEmail };
      if (view === "received") payload.recipientEmail = recipientEmail;
    }
    if (visibleHubs && visibleHubs.length < HUBS.length) {
      payload.sigRequest = { visibleHubs };
    }

    const data = await zsignJson<{ url: string }>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return Response.json({ url: data.url, view });
  } catch (err) {
    return jsonError(err);
  }
};
