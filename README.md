# ZSign embed quickstart

Mint embed sessions on your server, then render ZSign in an `<iframe>`.

> **Branch:** use **`main`** (default; same tip as `redocs`). The old SPA sample
> lives on **`deprecated`** and is not maintained.

## Setup

### 1. API key (required)

Create one in **ZSign → Settings → Integrations**.

### 2. `.env.local`

```sh
cp .env.example .env.local
```

```env
ZSIGN_API_KEY=your-key-here
ZSIGN_API_BASE=https://stg-zsign.zeniark.net
ZSIGN_WEBHOOK_SECRET=whsec_...
```

`ZSIGN_WEBHOOK_SECRET` is optional until you register a webhook endpoint (see below).

### 3. Run

```sh
npm install
npm run dev
```

## Where the integration lives

Read in this order:

1. [`src/lib/zsign.ts`](src/lib/zsign.ts)
2. [`src/pages/api/mint/documents.ts`](src/pages/api/mint/documents.ts)
3. [`src/pages/documents.astro`](src/pages/documents.astro)
4. [`src/components/EmbedFrame.tsx`](src/components/EmbedFrame.tsx)

Each sidebar screen has its own mint route under `src/pages/api/mint/`.

**Documents** + **Builder** share
[`AppContextDirectoryFields`](src/components/AppContextDirectoryFields.tsx) for
full `directory` app context (Add from contacts).

**Signature requests** is different: only `directory.recipientEmail` (Received
scoping), hub buttons, and hub hiding — not name/people/logo. Mint:
[`src/pages/api/mint/signature-requests.ts`](src/pages/api/mint/signature-requests.ts).

## UI routes

| Path | Mint endpoint |
|---|---|
| `/documents` | `POST /api/mint/documents` (optional body: `directory` app context) |
| `/builder` | Document or draft dropdown → mint (optional `directory`) |
| `/builder/[id]` | Resume draft deep-link |
| `/signer` | Sent-request dropdown → mint |
| `/signer/[id]` | Signer deep-link |
| `/signature-requests` | `POST /api/mint/signature-requests` (`view`, optional `directory.recipientEmail`, optional `visibleHubs`) |
| `/webhooks` | (no mint — read-only inbox) |

## Webhooks

Register the webhook URL in **ZSign → Settings → Integrations → Webhooks**.
Paste the signing secret into `.env.local` as `ZSIGN_WEBHOOK_SECRET`.

The **Webhooks** page (`/webhooks`) shows the full endpoint URL for this running instance
(derived from the request origin). Relative path: `POST /api/webhooks/zsign`.

**Codespaces:** on attach, a **webhooks** terminal asks to make port **4321** Public (`y/N`).
Yes → uses the Codespaces session token already in the environment (no login / PAT). No (or if
the flip fails) → terminal prints: **Ports** tab → right-click **4321** → **Port Visibility** →
**Public**.

**Local `./dc.sh`:** use `http://localhost:5002/api/webhooks/zsign` for this embed quickstart sample.

- [`src/pages/api/webhooks/zsign.ts`](src/pages/api/webhooks/zsign.ts) — verify HMAC, push to in-memory inbox
- [`src/pages/webhooks.astro`](src/pages/webhooks.astro) — read-only delivery list

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Dev server (`:5002` under workspace `./dc.sh`) |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
