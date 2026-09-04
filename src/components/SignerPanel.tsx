import { useEffect, useMemo, useState } from "react";

type RequestRow = {
  id: string;
  title: string;
  status: string;
  recipientEmail: string;
  recipientName: string;
};

type Props = {
  /** Optional deep-link from `/signer/[id]`. */
  initialRequestId?: string;
};

/**
 * Signer mint with a sent-request dropdown (parity with main SPA).
 * POST /api/mint/signer/:id → first recipient's embed signing URL.
 */
export function SignerPanel({ initialRequestId = "" }: Props) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [reqsLoading, setReqsLoading] = useState(true);
  const [reqsError, setReqsError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState(initialRequestId.trim());
  const [mintId, setMintId] = useState(initialRequestId.trim() || null);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sent = useMemo(
    () => requests.filter((r) => r.status !== "draft"),
    [requests],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadReqs() {
      setReqsLoading(true);
      setReqsError(null);
      try {
        const res = await fetch("/api/signature-requests");
        const data = (await res.json()) as {
          requests?: RequestRow[];
          message?: string;
        };
        if (!res.ok) {
          throw new Error(data.message || `List failed (${res.status})`);
        }
        if (!cancelled) setRequests(data.requests ?? []);
      } catch (err) {
        if (!cancelled) {
          setReqsError(
            err instanceof Error ? err.message : "Failed to list requests",
          );
        }
      } finally {
        if (!cancelled) setReqsLoading(false);
      }
    }

    void loadReqs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mintId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setSrc(null);
      try {
        const res = await fetch(`/api/mint/signer/${mintId}`, {
          method: "POST",
        });
        const data = (await res.json()) as { url?: string; message?: string };
        if (!res.ok) {
          throw new Error(data.message || `Mint failed (${res.status})`);
        }
        if (!data.url) throw new Error("Mint response missing url");
        if (!cancelled) setSrc(data.url);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mint failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [mintId]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
        <div className="space-y-2">
          <label
            htmlFor="signer-request"
            className="block text-sm font-medium text-zinc-900"
          >
            Sent request
          </label>
          <p className="text-xs text-zinc-500">
            Pick a sent signature request, then mint the first recipient&apos;s
            signing iframe.{" "}
            <code className="text-[11px]">
              GET /external/embed/signature-requests/{"{id}"}/recipients/
              {"{recipientId}"}
            </code>
          </p>
          {reqsError ? (
            <p className="text-sm text-red-600">{reqsError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <select
              id="signer-request"
              value={requestId}
              disabled={reqsLoading}
              onChange={(e) => {
                const id = e.target.value;
                setRequestId(id);
                setMintId(id || null);
              }}
              className="min-w-[16rem] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60"
            >
              <option value="">
                {reqsLoading
                  ? "Loading sent requests..."
                  : sent.length
                    ? "Select sent request..."
                    : "No sent requests yet — send from Builder first"}
              </option>
              {sent.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.recipientName || r.title} ({r.status})
                  {r.recipientEmail ? ` · ${r.recipientEmail}` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  setReqsLoading(true);
                  try {
                    const res = await fetch("/api/signature-requests");
                    const data = (await res.json()) as {
                      requests?: RequestRow[];
                    };
                    setRequests(data.requests ?? []);
                  } finally {
                    setReqsLoading(false);
                  }
                })();
              }}
              className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-200"
            >
              Refresh
            </button>
            {requestId ? (
              <button
                type="button"
                onClick={() => setMintId(requestId)}
                className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Re-mint signer
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading embed...</p>
      ) : null}
      {!mintId && !error ? (
        <p className="text-sm text-zinc-500">
          Select a sent request to mint the signer iframe.
        </p>
      ) : null}
      {src ? (
        <iframe
          title="Signer"
          src={src}
          className="h-[min(80vh,840px)] w-full rounded-md border border-zinc-300 bg-white shadow-sm"
          allow="clipboard-write"
        />
      ) : null}
    </div>
  );
}
