# Embed quickstart

Mint sessions on your server; ZSign Documents / Requests / Builder / Signer run in `EmbedFrame`. No custom field UI in the host app.

## `.env`

Paste **your org** keys from ZSign Settings > Integrations. No bundled demo keys.

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
