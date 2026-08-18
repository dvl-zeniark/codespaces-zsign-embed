import type { APIRoute } from "astro";
import { zsignJson } from "@/lib/zsign";
import { jsonError } from "@/lib/http";
import { getConfig } from "@/lib/config";

export const prerender = false;

export const GET: APIRoute = async () => {
  const { apiBase } = getConfig();
  try {
    const pong = await zsignJson<{ pong?: boolean }>("ping");
    return new Response(JSON.stringify({ ok: true, pong, apiBase }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err, { apiBase });
  }
};
