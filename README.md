# ZSign embed quickstart

A small Astro app showing the embed integration: mint a session on your
server, then render ZSign's own UI in an iframe — documents, builder,
signature requests, and the signer view.

## 1. Get an API key

Create one in **ZSign → Settings → Integrations**.

## 2. Put it in `.env.local`

```sh
cp .env.example .env.local
```

```env
# .env.local
ZSIGN_API_KEY=your-key-here
ZSIGN_WEBHOOK_SECRET=          # only needed to test the webhook receiver, see below
ZSIGN_API_BASE=https://stg-zsign.zeniark.net
```

`.env.local` is read fresh on every request (see `src/lib/config.ts`) — no
dev-server restart needed after saving a change. It's git-ignored; never
commit real keys.

## 3. Run it

```sh
npm install
npm run dev
```

Or skip local setup entirely and open it in a Codespace — `.env.local` is
already wired up, you just need to paste your key in once it boots.

## Where the actual API calls happen

| File | What it does |
|---|---|
| [`src/lib/zsign.ts`](src/lib/zsign.ts) | The one place that calls the ZSign API. `zsign()` attaches the `Authorization: Bearer` header and an `Idempotency-Key` on writes; `zsignJson()` wraps it for JSON. |
| [`src/lib/config.ts`](src/lib/config.ts) | Reads `ZSIGN_API_KEY` / `ZSIGN_API_BASE` from `.env.local`. |
| [`src/lib/embed-mint.ts`](src/lib/embed-mint.ts) | **The core of this sample.** One function per surface: `mintDocumentsLanding()`, `mintRequestsLanding()`, `mintBuilderFromDocument()` / `mintBuilderUrl()`, `mintSignerUrl()` — each calls the matching `POST /embed/...` endpoint and returns the URL to put in an `<iframe>`. `mintEmbedSurface()` is the switch that picks one based on what the UI asked for. |
| [`src/lib/documents.ts`](src/lib/documents.ts) | `listDocuments()` — `GET /documents`, used to populate the "pick a document" dropdown before minting a new builder. |
| [`src/lib/signature-requests.ts`](src/lib/signature-requests.ts) | `listSignatureRequests()`/`getSignatureRequest()` — `GET /signature-requests`, used for the drafts/sent lists and to look up a recipient email before minting. |
| [`src/lib/hmac.ts`](src/lib/hmac.ts) | `verifyZsignWebhook()` — HMAC-SHA256 signature check for incoming webhooks. |

The one route worth reading is
[`src/pages/api/embed/mint.ts`](src/pages/api/embed/mint.ts) — it takes a
`surface` query param from the browser, calls `mintEmbedSurface()`, and
returns `{ url }`. That URL is handed straight to the `<iframe src>` in
[`src/components/EmbedFrame.tsx`](src/components/EmbedFrame.tsx). None of
`src/lib/` runs in the browser — only the `src/pages/api/*.ts` routes import
it, which is what keeps `ZSIGN_API_KEY` server-side.

## The UI, if you want to see it wired end to end

[`src/components/EmbedWorkspace.tsx`](src/components/EmbedWorkspace.tsx) is
the nav shell — Documents / Builder / Signature requests / Signer — and on
every selection it calls `/api/embed/mint` and drops the result into
[`EmbedFrame.tsx`](src/components/EmbedFrame.tsx), which also has the
Desktop/Tablet/Mobile/Compact frame-size presets and the drag-to-resize
handle.

## Webhooks

The receiving endpoint is
[`src/pages/api/webhooks/zsign.ts`](src/pages/api/webhooks/zsign.ts), which
verifies the signature via `verifyZsignWebhook()` and logs the event to
`src/lib/inbox.ts` (shown live in the "Webhook inbox" panel at the bottom of
the page, via SSE — `src/pages/api/events.ts`). Point a webhook at
`<your-url>/api/webhooks/zsign`, set `ZSIGN_WEBHOOK_SECRET` to match what you
configured in ZSign, and deliveries will show up there.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Dev server on `:4321` locally (`:3012` under the workspace's `./dc.sh` stack) |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview the production build |
