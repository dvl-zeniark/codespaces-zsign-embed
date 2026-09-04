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

function buildDirectory(
  dir: MintBody["directory"],
): Record<string, unknown> | undefined {
  if (!dir) return undefined;
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

  if (!name && !recipientEmail && people.length === 0) return undefined;
  return {
    ...(name ? { name } : {}),
    ...(recipientEmail ? { recipientEmail } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(people.length > 0 ? { people } : {}),
  };
}

/** Resume builder on a draft (+ optional directory app context). */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id?.trim();
    if (!id) {
      return Response.json(
        { message: "Request id is required" },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as MintBody;
    const directory = buildDirectory(body.directory);
    const payload: Record<string, unknown> = directory ? { directory } : {};

    const data = await zsignJson<{ url?: string }>(
      `embed/signature-requests/${id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    return Response.json({ url: data.url || "" });
  } catch (err) {
    return jsonError(err);
  }
};
