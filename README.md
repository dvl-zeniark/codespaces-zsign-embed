# Embed quickstart

Mint sessions on your server; ZSign Documents / Requests / Builder / Signer run in `EmbedFrame`. No custom field UI in the host app.

## Clone

Into the current directory (so `package.json` is at the project root, not in a nested folder):

```bash
git clone https://github.com/dvl-zeniark/-stackblitz-zsign-embed.git .
```

## `.env`

The repo ships an empty `.env`. Paste **your org** keys from ZSign Settings > Integrations.

```
ZSIGN_API_KEY=
ZSIGN_WEBHOOK_SECRET=
```

```bash
# From workspace root (preferred)
./dc.sh up
./dc.sh logs -f partner-quickstart-embed

# Host-native
npm install && npm run dev
```

## Use the app

Compose service **`partner-quickstart-embed`**. Mint steps + large iframe. Upload documents in the Documents hub (or via your API); paste `documentId` for New builder. No auto-uploaded sample PDF.

## Read these

| File | Role |
|---|---|
| `app/api/embed/mint/route.ts` | All mint surfaces |
| `lib/embed-mint.ts` | Hub `?next=`, builder, signer |
| `components/EmbedWorkspace.tsx` | Teaching UI |
| `components/EmbedFrame.tsx` | `iframe.src` only |
