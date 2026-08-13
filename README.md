# Embed quickstart

Mint sessions on your server; ZSign Documents / Requests / Builder / Signer run in `EmbedFrame`. No custom field UI in the host app.

Vite (not Next.js) so StackBlitz/WebContainers do not hang on WASM SWC. API keys stay in `.env` on the server (`server/api.ts` via a Vite middleware plugin).

## Clone

Into the current directory (so `package.json` is at the project root, not in a nested folder):

```bash
git clone https://github.com/dvl-zeniark/stackblitz-zsign-embed.git .
```

## `.env`

Fill `.env` with **your org** keys from ZSign Settings > Integrations. API base is staging:

```
ZSIGN_API_KEY=
ZSIGN_WEBHOOK_SECRET=
ZSIGN_API_BASE=https://stg-zsign.zeniark.net
```

```bash
npm install && npm run dev
```

## Use the app

Mint steps + iframe. Upload documents in the Documents hub (or via your API); paste `documentId` for New builder.

## Read these

| File | Role |
|---|---|
| `server/api.ts` | Mint, lists, webhooks |
| `lib/embed-mint.ts` | Hub `?next=`, builder, signer |
| `components/EmbedWorkspace.tsx` | Teaching UI |
| `components/EmbedFrame.tsx` | `iframe.src` only |
