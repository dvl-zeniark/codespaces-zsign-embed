import { useEffect, useState } from "react";

type HubView = "all" | "drafts" | "sent" | "received";
type Hub = "drafts" | "sent" | "received";

const HUB_BUTTONS: { id: HubView; label: string; api: string }[] = [
  { id: "all", label: "All hubs", api: "POST /external/embed/requests" },
  { id: "drafts", label: "Drafts", api: "POST …/embed/requests/drafts" },
  { id: "sent", label: "Sent", api: "POST …/embed/requests/sent" },
  {
    id: "received",
    label: "Received",
    api: "POST …/embed/requests/received",
  },
];

const ALL_HUBS: Hub[] = ["drafts", "sent", "received"];

type MintState = {
  view: HubView;
  recipientEmail: string;
  visibleHubs: Hub[];
};

/**
 * Signature requests controls (Requests mint — not full directory app context).
 *
 * Full `directory` (name / people / logo) is for Builder → Add from contacts
 * (Documents + Builder panels). On Requests the useful mint options are:
 * 1. `directory.recipientEmail` — Received / guest scoping
 * 2. Hub view — all hubs, or a fixed single hub
 * 3. Hub hiding — `sigRequest.visibleHubs` on all-hubs only
 */
export function SignatureRequestsPanel() {
  const [email, setEmail] = useState("");
  const [view, setView] = useState<HubView>("all");
  const [visibleHubs, setVisibleHubs] = useState<Hub[]>([...ALL_HUBS]);
  const [mint, setMint] = useState<MintState>({
    view: "all",
    recipientEmail: "",
    visibleHubs: [...ALL_HUBS],
  });
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function load(nextView: HubView = view, nextVisible: Hub[] = visibleHubs) {
    setView(nextView);
    setMint({
      view: nextView,
      recipientEmail: email.trim(),
      visibleHubs: nextVisible,
    });
  }

  function toggleHub(hub: Hub) {
    setVisibleHubs((prev) => {
      const next = prev.includes(hub)
        ? prev.filter((h) => h !== hub)
        : [...prev, hub];
      return next.length === 0 ? prev : next;
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setSrc(null);
      try {
        const body: Record<string, unknown> = { view: mint.view };
        if (mint.recipientEmail) {
          body.directory = { recipientEmail: mint.recipientEmail };
        }
        if (
          mint.view === "all" &&
          mint.visibleHubs.length > 0 &&
          mint.visibleHubs.length < ALL_HUBS.length
        ) {
          body.visibleHubs = mint.visibleHubs;
        }

        const res = await fetch("/api/mint/signature-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
  }, [mint]);

  const activeApi =
    HUB_BUTTONS.find((b) => b.id === view)?.api ?? HUB_BUTTONS[0].api;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="sr-email"
            className="block text-sm font-medium text-zinc-900"
          >
            Recipient email (optional)
          </label>
          <p className="text-xs text-zinc-500">
            Requests app context is email scoping only (
            <code className="text-[11px]">directory.recipientEmail</code>
            ). Full directory people/tab is Documents + Builder (Add from
            contacts). Empty uses the API key owner.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              id="sr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner default, or signer@example.com"
              className="min-w-[16rem] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <button
              type="button"
              onClick={() => load()}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Apply email
            </button>
          </div>
        </div>

        <div className="space-y-2 border-t border-zinc-100 pt-3">
          <p className="text-sm font-medium text-zinc-900">Hub view</p>
          <p className="text-xs text-zinc-500">
            All hubs shows the tab switcher. Drafts / Sent / Received mint a
            fixed single-hub landing (no switcher).
          </p>
          <div className="flex flex-wrap gap-2">
            {HUB_BUTTONS.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => load(btn.id)}
                className={`rounded-md px-3 py-2 text-sm ${
                  view === btn.id
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-100"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500">{activeApi}</p>
        </div>

        {view === "all" ? (
          <div className="space-y-2 border-t border-zinc-100 pt-3">
            <p className="text-sm font-medium text-zinc-900">Hub hiding</p>
            <p className="text-xs text-zinc-500">
              On the all-hubs mint only — uncheck a hub to hide its tab (
              <code className="text-[11px]">sigRequest.visibleHubs</code>).
              Single-hub mints ignore this.
            </p>
            <div className="flex flex-wrap gap-3">
              {ALL_HUBS.map((hub) => (
                <label
                  key={hub}
                  className="flex items-center gap-2 text-sm text-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={visibleHubs.includes(hub)}
                    onChange={() => toggleHub(hub)}
                    className="rounded border-zinc-300"
                  />
                  <span className="capitalize">{hub}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => load("all", visibleHubs)}
              className="text-xs text-zinc-700 underline hover:text-zinc-900"
            >
              Re-mint with hub hiding
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading embed...</p>
      ) : null}
      {src ? (
        <iframe
          title="Signature requests"
          src={src}
          className="h-[min(80vh,840px)] w-full rounded-md border border-zinc-300 bg-white shadow-sm"
          allow="clipboard-write"
        />
      ) : null}
    </div>
  );
}
