"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { EmbedFrame } from "@/components/EmbedFrame";
import { api } from "@/lib/client";
import type { EmbedSurface } from "@/lib/embed-mint";
import type { SignatureRequestRow } from "@/lib/signature-requests";
import type { DocumentRow } from "@/lib/documents";
import { useLiveEvents } from "@/lib/use-live-events";

type StepDef = {
  id: EmbedSurface;
  label: string;
  api: string;
  needsDraft?: boolean;
  needsSent?: boolean;
  needsRecipientEmail?: boolean;
  needsDocumentId?: boolean;
};

const SECTIONS: { title: string; blurb: string; steps: StepDef[] }[] = [
  {
    title: "Documents",
    blurb: "Upload the PDF first. Builder needs a documentId.",
    steps: [
      {
        id: "documents",
        label: "Open Documents",
        api: "POST /external/embed/hub + ?next=/embed/documents",
      },
    ],
  },
  {
    title: "Builder",
    blurb: "Create the request, place fields, and Send in the iframe.",
    steps: [
      {
        id: "builder-new",
        label: "New builder (documentId)",
        api: "POST /external/embed/signature-requests { documentId }",
        needsDocumentId: true,
      },
      {
        id: "builder",
        label: "Resume draft",
        api: "POST /external/embed/signature-requests/{id}",
        needsDraft: true,
      },
    ],
  },
  {
    title: "Signature requests",
    blurb: "After Send (or while drafting), list status in the iframe.",
    steps: [
      {
        id: "requests",
        label: "All hubs",
        api: "Hub + ?next=/embed/requests",
      },
      {
        id: "requests-drafts",
        label: "Drafts",
        api: "Hub + ?next=/embed/requests/drafts",
      },
      {
        id: "requests-sent",
        label: "Sent",
        api: "Hub + ?next=/embed/requests/sent",
      },
      {
        id: "requests-received",
        label: "Received",
        api: "POST embed/hub (optional recipientEmail) + ?next=/embed/requests/received",
        needsRecipientEmail: true,
      },
    ],
  },
  {
    title: "Signer",
    blurb: "After Send, mint signing URL for the iframe.",
    steps: [
      {
        id: "signer",
        label: "Open signer",
        api: "GET /external/embed/signature-requests/{id}/recipients/{recipientId}",
        needsSent: true,
      },
    ],
  },
];

export function EmbedWorkspace() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requestsQ = useQuery({
    queryKey: ["signature-requests"],
    queryFn: () =>
      api<{ requests: SignatureRequestRow[] }>("/api/embed/requests"),
    // SSE (below) pushes real updates; this interval is just a fallback in
    // case the stream drops, so it stays slow and stops entirely on error.
    refetchInterval: (query) => (query.state.status === "error" ? false : 20000),
  });
  const docsQ = useQuery({
    queryKey: ["documents"],
    queryFn: () => api<{ documents: DocumentRow[] }>("/api/embed/documents"),
  });
  useLiveEvents(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["signature-requests"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }, [queryClient]),
  );

  const [surface, setSurface] = useState<EmbedSurface>("documents");
  const [requestId, setRequestId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [iframeSrc, setIframeSrc] = useState("");
  const [mintMeta, setMintMeta] = useState<{
    recipientEmail?: string | null;
    recipientIsOrgMember?: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [loadingMint, setLoadingMint] = useState(false);

  const requests = requestsQ.data?.requests ?? [];
  const drafts = requests.filter((r) => r.status === "draft");
  const sent = requests.filter((r) => r.status !== "draft");
  const documents = docsQ.data?.documents ?? [];

  useEffect(() => {
    const qEmail = searchParams.get("recipientEmail")?.trim();
    if (qEmail) setRecipientEmail(qEmail);
    const qDoc = searchParams.get("documentId")?.trim();
    if (qDoc) setDocumentId(qDoc);
  }, [searchParams]);

  const activeStep = useMemo(() => {
    for (const section of SECTIONS) {
      const step = section.steps.find((s) => s.id === surface);
      if (step) return step;
    }
    return null;
  }, [surface]);

  const loadSurface = useCallback(
    async (
      nextSurface: EmbedSurface,
      nextRequestId?: string,
      nextRecipientEmail?: string,
      nextDocumentId?: string,
    ) => {
      setSurface(nextSurface);
      setLoadingMint(true);
      setError("");
      setIframeSrc("");
      setMintMeta(null);
      const rid = nextRequestId ?? requestId;
      const email = (nextRecipientEmail ?? recipientEmail).trim();
      const docId = (nextDocumentId ?? documentId).trim();

      if (nextSurface === "builder-new" && !docId) {
        setLoadingMint(false);
        return;
      }
      if (nextSurface === "builder" && !rid) {
        setLoadingMint(false);
        return;
      }
      if (nextSurface === "signer" && !rid) {
        setLoadingMint(false);
        return;
      }

      try {
        const params = new URLSearchParams({ surface: nextSurface });
        if (rid) params.set("requestId", rid);
        if (email) params.set("recipientEmail", email);
        if (docId) params.set("documentId", docId);
        const res = await api<{
          url: string;
          recipientEmail?: string | null;
          recipientIsOrgMember?: boolean;
        }>(`/api/embed/mint?${params}`);
        setIframeSrc(res.url);
        setMintMeta({
          recipientEmail: res.recipientEmail,
          recipientIsOrgMember: res.recipientIsOrgMember,
        });
        if (nextSurface === "builder-new") {
          void requestsQ.refetch();
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingMint(false);
      }
    },
    [requestId, recipientEmail, documentId, requestsQ],
  );

  useEffect(() => {
    const qSurface = searchParams.get("surface");
    const qId = searchParams.get("requestId")?.trim() || "";
    const valid = SECTIONS.flatMap((s) => s.steps).some((s) => s.id === qSurface);
    const initial = valid ? (qSurface as EmbedSurface) : "documents";
    if (qId) setRequestId(qId);
    void loadSurface(initial, qId || undefined);
    // Mint when URL query changes (deep-link to builder/signer).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadSurface reads requestId at call time
  }, [searchParams]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-zinc-200 bg-white p-4"
            >
              <h2 className="text-sm font-semibold text-zinc-900">
                {section.title}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">{section.blurb}</p>
              <ul className="mt-3 space-y-2">
                {section.steps.map((step) => (
                  <li key={step.id} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (step.id === "builder-new") void docsQ.refetch();
                        if (step.id === "builder") void requestsQ.refetch();
                        void loadSurface(step.id);
                      }}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                        surface === step.id
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {step.label}
                    </button>
                    {surface === step.id && (
                      <p className="text-[11px] text-zinc-500">{step.api}</p>
                    )}
                    {step.id === "builder-new" && surface === step.id ? (
                      <select
                        className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm"
                        value={documentId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setDocumentId(id);
                          if (id) {
                            void loadSurface(
                              "builder-new",
                              undefined,
                              undefined,
                              id,
                            );
                          }
                        }}
                      >
                        <option value="">
                          {docsQ.isLoading
                            ? "Loading documents..."
                            : documents.length
                              ? "Select document..."
                              : "No documents yet (upload first)"}
                        </option>
                        {documents.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {step.id === "builder" && surface === step.id ? (
                      <select
                        className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm"
                        value={requestId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setRequestId(id);
                          const picked = requests.find((r) => r.id === id);
                          if (picked?.recipientEmail) {
                            setRecipientEmail(picked.recipientEmail);
                          }
                          if (id) {
                            void loadSurface(
                              "builder",
                              id,
                              picked?.recipientEmail,
                            );
                          }
                        }}
                      >
                        <option value="">
                          {requestsQ.isLoading
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
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {(activeStep?.needsSent || activeStep?.needsRecipientEmail) && (
            <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
              {activeStep?.needsRecipientEmail ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Received as (optional)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Empty uses the API key owner. Set an email only to view
                    Received as that person.
                  </p>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="owner default, or signer@example.com"
                    className="text-sm"
                  />
                  <button
                    type="button"
                    className="text-xs text-zinc-700 underline hover:text-zinc-900"
                    onClick={() =>
                      void loadSurface(
                        "requests-received",
                        undefined,
                        recipientEmail,
                      )
                    }
                  >
                    {recipientEmail.trim()
                      ? "Re-mint Received as this email"
                      : "Re-mint Received as API owner"}
                  </button>
                </div>
              ) : null}

              {activeStep?.needsSent ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Sent request
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Pick a sent signature request to mint the signer iframe.
                  </p>
                  <select
                    className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm"
                    value={requestId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setRequestId(id);
                      const picked = requests.find((r) => r.id === id);
                      if (picked?.recipientEmail) {
                        setRecipientEmail(picked.recipientEmail);
                      }
                      if (id) {
                        void loadSurface(surface, id, picked?.recipientEmail);
                      }
                    }}
                  >
                    <option value="">
                      {sent.length ? "Select sent request..." : "No sent requests yet"}
                    </option>
                    {sent.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.recipientName || r.title} ({r.status})
                        {r.recipientEmail ? ` · ${r.recipientEmail}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </section>
          )}
        </div>

        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-zinc-900">
              ZSign in iframe
              {activeStep ? ` · ${activeStep.label}` : ""}
            </p>
            {loadingMint ? (
              <span className="text-xs text-zinc-500">Minting...</span>
            ) : null}
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {mintMeta?.recipientEmail ? (
            <p className="text-xs text-zinc-600">
              Hub mint: recipientEmail={mintMeta.recipientEmail}
              {mintMeta.recipientIsOrgMember === false
                ? " (not an org member - external signer)"
                : mintMeta.recipientIsOrgMember
                  ? " (org member)"
                  : ""}
            </p>
          ) : null}
          <EmbedFrame src={iframeSrc} title="ZSign embed" />
        </div>
    </div>
  );
}
