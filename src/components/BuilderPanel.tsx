import { useEffect, useState } from "react";
import {
  AppContextDirectoryFields,
  directoryMintPayload,
  emptyDirectoryDraft,
  type DirectoryDraft,
} from "@/components/AppContextDirectoryFields";

type Mode = "new" | "resume";

type DocumentRow = { id: string; name: string };

type Props = {
  mode: Mode;
  /** Optional deep-link for mode=new */
  initialDocumentId?: string;
  /** Required for mode=resume */
  requestId?: string;
};

type MintState = {
  directory: DirectoryDraft;
  documentId: string;
};

/**
 * Builder mint with optional app context (`directory`).
 * New: document dropdown → POST /api/mint/builder { documentId, directory? }
 * Resume: POST /api/mint/builder/:id { directory? }
 */
export function BuilderPanel({
  mode,
  initialDocumentId = "",
  requestId,
}: Props) {
  const [directory, setDirectory] = useState<DirectoryDraft>(
    emptyDirectoryDraft(),
  );
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(mode === "new");
  const [docsError, setDocsError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState(initialDocumentId.trim());
  const [mint, setMint] = useState<MintState | null>(
    mode === "resume" || initialDocumentId.trim()
      ? {
          directory: emptyDirectoryDraft(),
          documentId: initialDocumentId.trim(),
        }
      : null,
  );
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mintPath =
    mode === "new"
      ? "/api/mint/builder"
      : `/api/mint/builder/${requestId ?? ""}`;

  useEffect(() => {
    if (mode !== "new") return;
    let cancelled = false;

    async function loadDocs() {
      setDocsLoading(true);
      setDocsError(null);
      try {
        const res = await fetch("/api/documents");
        const data = (await res.json()) as {
          documents?: DocumentRow[];
          message?: string;
        };
        if (!res.ok) {
          throw new Error(data.message || `List failed (${res.status})`);
        }
        if (!cancelled) {
          setDocuments(data.documents ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setDocsError(
            err instanceof Error ? err.message : "Failed to list documents",
          );
        }
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    }

    void loadDocs();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  function snapshotDirectory(): DirectoryDraft {
    return {
      ...directory,
      tabName: directory.tabName.trim() || "Employees",
      people: directory.people.filter((p) => p.name.trim() && p.email.trim()),
    };
  }

  function apply(nextDocumentId: string = documentId) {
    const id = nextDocumentId.trim();
    if (mode === "new" && !id) {
      setError("Select a document first.");
      setSrc(null);
      setMint(null);
      return;
    }
    setDocumentId(id);
    setMint({ directory: snapshotDirectory(), documentId: id });
  }

  useEffect(() => {
    if (!mint) return;
    let cancelled = false;

    async function run() {
      if (mode === "resume" && !requestId?.trim()) return;

      setLoading(true);
      setError(null);
      setSrc(null);
      try {
        const dir = directoryMintPayload(mint.directory);
        const body: Record<string, unknown> =
          mode === "new"
            ? {
                documentId: mint.documentId,
                ...(dir ? { directory: dir } : {}),
              }
            : dir
              ? { directory: dir }
              : {};

        const res = await fetch(mintPath, {
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
  }, [mint, mode, requestId, mintPath]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-4">
        {mode === "new" ? (
          <div className="space-y-2">
            <label
              htmlFor="builder-document"
              className="block text-sm font-medium text-zinc-900"
            >
              Document
            </label>
            <p className="text-xs text-zinc-500">
              Pick a PDF already uploaded in Documents. Mint calls{" "}
              <code className="text-[11px]">
                POST /external/embed/signature-requests {"{ documentId }"}
              </code>
              .
            </p>
            {docsError ? (
              <p className="text-sm text-red-600">{docsError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <select
                id="builder-document"
                value={documentId}
                disabled={docsLoading}
                onChange={(e) => {
                  const id = e.target.value;
                  setDocumentId(id);
                  if (id) apply(id);
                }}
                className="min-w-[16rem] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60"
              >
                <option value="">
                  {docsLoading
                    ? "Loading documents..."
                    : documents.length
                      ? "Select document..."
                      : "No documents yet — upload in Documents first"}
                </option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    setDocsLoading(true);
                    try {
                      const res = await fetch("/api/documents");
                      const data = (await res.json()) as {
                        documents?: DocumentRow[];
                      };
                      setDocuments(data.documents ?? []);
                    } finally {
                      setDocsLoading(false);
                    }
                  })();
                }}
                className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-200"
              >
                Refresh
              </button>
            </div>
            {!docsLoading && documents.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Open{" "}
                <a href="/documents" className="underline hover:text-zinc-900">
                  Documents
                </a>
                , upload a PDF, then refresh this list.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-zinc-600">
            Resume draft{" "}
            <code className="text-xs">{requestId}</code>
          </p>
        )}

        <div className="border-t border-zinc-100 pt-3">
          <AppContextDirectoryFields
            value={directory}
            onChange={setDirectory}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3">
          <button
            type="button"
            onClick={() => apply()}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Re-mint builder
          </button>
          <p className="text-[11px] text-zinc-500">
            {mode === "new"
              ? "POST /external/embed/signature-requests"
              : `POST /external/embed/signature-requests/${requestId}`}
            {mint?.directory.enabled ? " { directory }" : ""}
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading embed...</p>
      ) : null}
      {!mint && mode === "new" && !error ? (
        <p className="text-sm text-zinc-500">
          Select a document to mint the builder iframe.
        </p>
      ) : null}
      {src ? (
        <iframe
          title="Builder"
          src={src}
          className="h-[min(80vh,840px)] w-full rounded-md border border-zinc-300 bg-white shadow-sm"
          allow="clipboard-write"
        />
      ) : null}
    </div>
  );
}
