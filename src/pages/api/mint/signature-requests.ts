import type { APIRoute } from "astro";
import { jsonError } from "@/lib/http";
import { zsignJson } from "@/lib/zsign";

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const data = await zsignJson<{ url: string }>("embed/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return Response.json({ url: data.url });
  } catch (err) {
    return jsonError(err);
  }
};
