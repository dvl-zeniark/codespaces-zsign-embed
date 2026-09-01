import type { APIRoute } from "astro";
import { jsonError } from "@/lib/http";
import { zsignJson } from "@/lib/zsign";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as { documentId?: string };
    const documentId = body.documentId?.trim();
    if (!documentId) {
      return Response.json({ message: "documentId is required" }, { status: 400 });
    }

    const data = await zsignJson<{ url?: string }>("embed/signature-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId,
        title: "Embed quickstart",
        subject: "Document to sign",
      }),
    });

    return Response.json({ url: data.url || "" });
  } catch (err) {
    return jsonError(err);
  }
};
