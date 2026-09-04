import type { APIRoute } from "astro";
import { listDocuments } from "@/lib/documents";
import { jsonError } from "@/lib/http";

export const prerender = false;

/** Proxy: list documents for the Builder picker (API key stays server-side). */
export const GET: APIRoute = async () => {
  try {
    return Response.json({ documents: await listDocuments() });
  } catch (err) {
    return jsonError(err);
  }
};
