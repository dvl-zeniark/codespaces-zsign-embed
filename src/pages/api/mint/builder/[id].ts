import type { APIRoute } from "astro";
import { jsonError } from "@/lib/http";
import { zsignJson } from "@/lib/zsign";

export const prerender = false;

export const POST: APIRoute = async ({ params }) => {
  try {
    const id = params.id?.trim();
    if (!id) {
      return Response.json({ message: "Request id is required" }, { status: 400 });
    }

    const data = await zsignJson<{ url?: string }>(
      `embed/signature-requests/${id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
    );

    return Response.json({ url: data.url || "" });
  } catch (err) {
    return jsonError(err);
  }
};
