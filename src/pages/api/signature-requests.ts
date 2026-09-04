import type { APIRoute } from "astro";
import { listSignatureRequests } from "@/lib/signature-requests";
import { jsonError } from "@/lib/http";

export const prerender = false;

/** Proxy: list signature requests for Builder resume / Signer pickers. */
export const GET: APIRoute = async () => {
  try {
    return Response.json({
      requests: await listSignatureRequests(),
    });
  } catch (err) {
    return jsonError(err);
  }
};
