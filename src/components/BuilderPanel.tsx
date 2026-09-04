import { useEffect, useMemo, useState } from "react";
import {
  AppContextDirectoryFields,
  directoryMintPayload,
  emptyDirectoryDraft,
  type DirectoryDraft,
} from "@/components/AppContextDirectoryFields";

type Mode = "new" | "resume";

type DocumentRow = { id: string; name: string };
type RequestRow = {
  id: string;
  title: string;
  status: string;
  recipientEmail: string;
  recipientName: string;
};

type Props = {
  /** Optional deep-link for mode=new */
  initialDocumentId?: string;
  /** Optional deep-link for mode=resume (`/builder/[id]`) */
  initialRequestId?: string;
  /** Force a single mode; default shows both pickers when neither id is set. */
  forceMode?: Mode;
};

type MintState =
  | { kind: "new"; documentId: string; directory: DirectoryDraft }
  | { kind: "resume"; requestId: string; directory: DirectoryDraft };

/**
 * Builder mint with document dropdown (new) and draft dropdown (resume),
 * plus optional `directory` app context.
 */
export function BuilderPanel({
  initialDocumentId = "",
  initialRequestId = "",
  forceMode,
}: Props) {
  const startMode: Mode =
    forceMode ??
    (initialRequestId.trim()
      ? "resume"
      : initialDocumentId.trim()
        ? "new"
        : "new");

  const [mode, setMode] = useState<Mode>(startMode);
  const [directory, setDirectory] = useState<DirectoryDraft>(
    emptyDirectoryDraft(),
  );
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [reqsLoading, setReqsLoading] = useState(true);
  const [reqsError, setReqsError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState(initialDocumentId.trim());
  const [requestId, setRequestId] = useState(initialRequestId.trim());
  const [mint, setMint] = useState<MintState | null>(() => {
    if (initialRequestId.trim()) {
      return {
        kind: "resume",
        requestId: initialRequestId.trim(),
        directory: emptyDirectoryDraft(),
      };
    }
    if (initialDocumentId.trim()) {
      return {
        kind: "new",
        documentId: initialDocumentId.trim(),
        directory: emptyDirectoryDraft(),
      };
    }
    return null;
  });
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const drafts = useMemo(
    () => requests.filter((r) => r.status === "draft"),
    [requests],
  );

  const showModeToggle = !forceMode && !initialRequestId.trim();

  useEffect(() => {
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
        if (!cancelled) setDocuments(data.documents ?? []);
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
            err instanceof Error ? err.message : "Failed to list drafts",
          );
        }
      } finally {
        if (!cancelled) setReqsLoading(false);
      }
    }

    void loadDocs();
    void loadReqs();
    return () => {
      cancelled = true;
    };
  }, []);

  function snapshotDirectory(): DirectoryDraft {
    return {
      ...directory,
      tabName: directory.tabName.trim() || "Employees",
      people: directory.people.filter((p) => p.name.trim() && p.email.trim()),
    };
  }

  function applyNew(nextDocumentId: string = documentId) {
    const id = nextDocumentId.trim();
    if (!id) {
      setError("Select a document first.");
      setSrc(null);
      setMint(null);
      return;
    }
    setMode("new");
    setDocumentId(id);
    setMint({ kind: "new", documentId: id, directory: snapshotDirectory() });
  }

  function applyResume(nextRequestId: string = requestId) {
    const id = nextRequestId.trim();
    if (!id) {
      setError("Select a draft first.");
      setSrc(null);
      setMint(null);
      return;
    }
    setMode("resume");
    setRequestId(id);
    setMint({ kind: "resume", requestId: id, directory: snapshotDirectory() });
  }

  function apply() {
    if (mode === "new") applyNew();
    else applyResume();
  }

  useEffect(() => {
    if (!mint) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setSrc(null);
      try {
        const dir = directoryMintPayload(mint.directory);
        const mintPath =
          mint.kind === "new"
            ? "/api/mint/builder"
            : `/api/mint/builder/${mint.requestId}`;
        const body: Record<string, unknown> =
          mint.kind === "new"
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
  }, [mint]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-4">
        {showModeToggle ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`rounded-md px-3 py-2 text-sm ${
                mode === "new"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-100"
              }`}
            >
              New builder
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("resume");
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
              className={`rounded-md px-3 py-2 text-sm ${
                mode === "resume"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-100"
              }`}
            >
              Resume draft
            </button>
          </div>
        ) : null}

        {mode === "new" ? (
          <div className="space-y-2">
            <label
              htmlFor="builder-document"
              className="block text-sm font-medium text-zinc-900"
            >
              Document
            </label>
            <p className="text-xs text-zinc-500">
              Pick a PDF already uploaded in Documents. Mint:{" "}
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
                  if (id) applyNew(id);
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
          </div>
        ) : (
          <div className="space-y-2">
            <label
              htmlFor="builder-draft"
              className="block text-sm font-medium text-zinc-900"
            >
              Draft
            </label>
            <p className="text-xs text-zinc-500">
              Resume an existing draft. Mint:{" "}
              <code className="text-[11px]">
                POST /external/embed/signature-requests/{"{id}"}
              </code>
              .
            </p>
            {reqsError ? (
              <p className="text-sm text-red-600">{reqsError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <select
                id="builder-draft"
                value={requestId}
                disabled={reqsLoading}
                onChange={(e) => {
                  const id = e.target.value;
                  setRequestId(id);
                  if (id) applyResume(id);
                }}
                className="min-w-[16rem] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60"
              >
                <option value="">
                  {reqsLoading
                    ? "Loading drafts..."
                    : drafts.length
                      ? "Select draft..."
                      : "No drafts yet"}
                </option>
                {drafts.map((r) => (
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
            </div>
          </div>
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
            onClick={apply}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Re-mint builder
          </button>
          <p className="text-[11px] text-zinc-500">
            {mint?.kind === "resume"
              ? `POST /external/embed/signature-requests/${mint.requestId}`
              : "POST /external/embed/signature-requests"}
            {mint?.directory.enabled ? " { directory }" : ""}
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading embed...</p>
      ) : null}
      {!mint && !error ? (
        <p className="text-sm text-zinc-500">
          {mode === "new"
            ? "Select a document to mint the builder iframe."
            : "Select a draft to resume in the builder iframe."}
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
