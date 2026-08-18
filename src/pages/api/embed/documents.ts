import type { APIRoute } from "astro";
import { listDocuments } from "@/lib/documents";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify({ documents: await listDocuments() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};
