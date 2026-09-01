import { useEffect, useState } from "react";

type Props = {
  mintPath: string;
  mintBody?: Record<string, unknown>;
  title?: string;
};

export function EmbedFrame({
  mintPath,
  mintBody,
  title = "ZSign embed",
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mintBodyKey = mintBody ? JSON.stringify(mintBody) : "";

  useEffect(() => {
    let cancelled = false;
    const body = mintBodyKey ? (JSON.parse(mintBodyKey) as Record<string, unknown>) : undefined;

    async function load() {
      try {
        const res = await fetch(mintPath, {
          method: "POST",
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const data = (await res.json()) as { url?: string; message?: string };
        if (!res.ok) {
          throw new Error(data.message || `Mint failed (${res.status})`);
        }
        if (!data.url) {
          throw new Error("Mint response missing url");
        }
        if (!cancelled) {
          setSrc(data.url);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mint failed");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [mintPath, mintBodyKey]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!src) {
    return <p className="text-sm text-zinc-500">Loading embed...</p>;
  }

  return (
    <iframe
      title={title}
      src={src}
      className="h-[min(80vh,840px)] w-full rounded-md border border-zinc-300 bg-white shadow-sm"
      allow="clipboard-write"
    />
  );
}
