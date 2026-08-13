# Embed quickstart

Mint sessions on your server; ZSign Documents / Requests / Builder / Signer run in `EmbedFrame`. No custom field UI in the host app.

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

StackBlitz runs Next with WASM SWC (no native compiler). The first `Compiling /` can take a minute; later loads are faster.

## Use the app

Mint steps + iframe. Upload documents in the Documents hub (or via your API); paste `documentId` for New builder.

## Read these

| File | Role |
|---|---|
| `app/api/embed/mint/route.ts` | All mint surfaces |
| `lib/embed-mint.ts` | Hub `?next=`, builder, signer |
| `components/EmbedWorkspace.tsx` | Teaching UI |
| `components/EmbedFrame.tsx` | `iframe.src` only |
