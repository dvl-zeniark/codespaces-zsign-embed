import { Router } from "express";
import { verifyZsignWebhook } from "../lib/hmac.ts";
import { getWebhookSecret, listWebhooks, recordWebhook } from "../lib/inbox.ts";
import { listDocuments } from "../lib/documents.ts";
import { zsignJson } from "../lib/zsign.ts";
import {
  mintEmbedSurface,
  type EmbedSurface,
} from "../lib/embed-mint.ts";
import { getSignatureRequest, listSignatureRequests } from "../lib/signature-requests.ts";
import { jsonError } from "./http.ts";

const SURFACES: EmbedSurface[] = [
  "documents",
  "builder",
  "builder-new",
  "requests",
  "requests-drafts",
  "requests-sent",
  "requests-received",
  "signer",
];

function parseSurface(raw: unknown): EmbedSurface {
  if (typeof raw === "string" && SURFACES.includes(raw as EmbedSurface)) {
    return raw as EmbedSurface;
  }
  return "documents";
}

function q(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function apiRouter(): Router {
  const r = Router();

  r.get("/embed/ping", async (_req, res) => {
    try {
      const pong = await zsignJson<{ pong?: boolean }>("ping");
      res.json({ ok: true, pong });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.get("/webhooks/inbox", (_req, res) => {
    res.json({ events: listWebhooks() });
  });

  r.get("/embed/documents", async (_req, res) => {
    try {
      res.json({ documents: await listDocuments() });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.get("/embed/requests", async (_req, res) => {
    try {
      res.json({ requests: await listSignatureRequests() });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.get("/embed/mint", async (req, res) => {
    try {
      const surface = parseSurface(req.query.surface);
      const requestId = q(req.query.requestId);
      const documentId = q(req.query.documentId);
      let recipientEmail = q(req.query.recipientEmail);

      if (requestId) {
        try {
          const row = await getSignatureRequest(requestId);
          if (!recipientEmail && row.recipientEmail) {
            recipientEmail = row.recipientEmail;
          }
        } catch {
          /* optional */
        }
      }

      const minted = await mintEmbedSurface(
        requestId,
        surface,
        recipientEmail || undefined,
        documentId || undefined,
      );
      res.json({
        url: minted.url,
        surface,
        requestId: requestId || null,
        documentId: documentId || null,
        recipientEmail: minted.recipientEmail ?? (recipientEmail || null),
        recipientIsOrgMember: minted.recipientIsOrgMember,
      });
    } catch (err) {
      jsonError(res, err);
    }
  });

  return r;
}

function header(
  headers: import("express").Request["headers"],
  name: string,
): string | null {
  const value = headers[name];
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

export function webhookHandler(
  req: import("express").Request,
  res: import("express").Response,
) {
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : String(req.body || "");
  const verified = verifyZsignWebhook({
    rawBody,
    signatureHeader: header(req.headers, "x-zsign-signature"),
    timestampHeader: header(req.headers, "x-zsign-timestamp"),
    secret: getWebhookSecret(),
  });
  if (!verified.ok) {
    res.status(401).json({
      received: true,
      verified: false,
      error: verified.error,
    });
    return;
  }
  recordWebhook(header(req.headers, "x-zsign-event") || "unknown");
  res.json({ received: true, verified: true });
}
