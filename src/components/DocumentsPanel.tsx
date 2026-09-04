import { useEffect, useState } from "react";
import {
  AppContextDirectoryFields,
  directoryMintPayload,
  emptyDirectoryDraft,
  type DirectoryDraft,
} from "@/components/AppContextDirectoryFields";

type MintState = { directory: DirectoryDraft };

/**
 * Documents mint with optional app context (`directory`).
 * Shows up later in Builder → Add from contacts as the host tab.
 */
export function DocumentsPanel() {
  const [directory, setDirectory] = useState<DirectoryDraft>(emptyDirectoryDraft());
  const [mint, setMint] = useState<MintState>({
    directory: emptyDirectoryDraft(),
  });
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function apply() {
    setMint({
      directory: {
        ...directory,
        tabName: directory.tabName.trim() || "Employees",
        people: directory.people.filter((p) => p.name.trim() && p.email.trim()),
      },
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setSrc(null);
      try {
        const dir = directoryMintPayload(mint.directory);
        const body: Record<string, unknown> = dir ? { directory: dir } : {};

        const res = await fetch("/api/mint/documents", {
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-4">
        <AppContextDirectoryFields value={directory} onChange={setDirectory} />
        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3">
          <button
            type="button"
            onClick={apply}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Re-mint documents
          </button>
          <p className="text-[11px] text-zinc-500">
            POST /external/embed/documents
            {mint.directory.enabled ? " { directory }" : ""}
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading embed...</p>
      ) : null}
      {src ? (
        <iframe
          title="Documents"
          src={src}
          className="h-[min(80vh,840px)] w-full rounded-md border border-zinc-300 bg-white shadow-sm"
          allow="clipboard-write"
        />
      ) : null}
    </div>
  );
}
