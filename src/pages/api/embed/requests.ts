import type { APIRoute } from "astro";
import { listSignatureRequests } from "@/lib/signature-requests";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify({ requests: await listSignatureRequests() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};
