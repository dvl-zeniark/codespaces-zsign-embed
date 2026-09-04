import type { APIRoute } from "astro";
import { jsonError } from "@/lib/http";
import { zsignJson } from "@/lib/zsign";

export const prerender = false;

type PersonIn = { name?: string; email?: string; imageUrl?: string };

type MintBody = {
  directory?: {
    name?: string;
    imageUrl?: string;
    recipientEmail?: string;
    people?: PersonIn[];
  };
};

/**
 * Mint Documents landing. Optional `directory` is app context for Add from
 * contacts (session-only — not written to ZSign Contacts).
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as MintBody;
    const dir = body.directory;
    const payload: Record<string, unknown> = {};

    if (dir) {
      const name = dir.name?.trim();
      const recipientEmail = dir.recipientEmail?.trim() || undefined;
      const imageUrl = dir.imageUrl?.trim() || undefined;
      const people = (dir.people ?? [])
        .map((p) => ({
          name: p.name?.trim() || "",
          email: p.email?.trim() || "",
          ...(p.imageUrl?.trim() ? { imageUrl: p.imageUrl.trim() } : {}),
        }))
        .filter((p) => p.name && p.email);

      // name is required by the API when people/imageUrl are set; recipientEmail-only
      // is allowed without a tab label.
      if (name || recipientEmail || people.length > 0) {
        payload.directory = {
          ...(name ? { name } : {}),
          ...(recipientEmail ? { recipientEmail } : {}),
          ...(imageUrl ? { imageUrl } : {}),
          ...(people.length > 0 ? { people } : {}),
        };
      }
    }

    const data = await zsignJson<{ url: string }>("embed/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return Response.json({ url: data.url });
  } catch (err) {
    return jsonError(err);
  }
};
