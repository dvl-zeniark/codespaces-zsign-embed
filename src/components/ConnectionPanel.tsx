import { useEffect, useState } from "react";
import { IconCheckCircle, IconGlobe, IconLoader, IconWebhook, IconXCircle } from "@/components/icons";

export function ConnectionPanel() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [ping, setPing] = useState<"loading" | "ok" | "fail">("loading");
  const [pingDetail, setPingDetail] = useState("");
  const [apiBase, setApiBase] = useState("");

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks/zsign`);
    fetch("/api/embed/ping")
      .then(async (res) => {
        const body = await res.json();
        if (body.apiBase) setApiBase(body.apiBase);
        if (!res.ok) throw new Error(body.message || `HTTP ${res.status}`);
        setPing("ok");
        setPingDetail("API key works (GET /external/ping)");
      })
      .catch((err) => {
        setPing("fail");
        setPingDetail((err as Error).message);
      });
  }, []);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
        <IconWebhook size={15} className="text-zinc-400" />
        Connection
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        Paste <code className="text-[11px]">ZSIGN_API_KEY</code> and webhook
        secret in <code className="text-[11px]">.env</code> (your org only).
        Never sent to ZSign from the browser.
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-zinc-500">Ping</dt>
          <dd className="flex items-center gap-1.5 text-zinc-800">
            {ping === "loading" ? (
              <>
                <IconLoader size={14} className="animate-spin text-zinc-400" />
                <span>Checking...</span>
              </>
            ) : null}
            {ping === "ok" ? (
              <>
                <IconCheckCircle size={14} className="text-green-600" />
                <span className="text-green-700">{pingDetail}</span>
              </>
            ) : null}
            {ping === "fail" ? (
              <>
                <IconXCircle size={14} className="text-red-500" />
                <span className="text-red-600">{pingDetail}</span>
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs font-medium text-zinc-500">
            <IconWebhook size={12} />
            Webhook receive URL
          </dt>
          <dd className="font-mono text-xs text-zinc-800">{webhookUrl || "..."}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs font-medium text-zinc-500">
            <IconGlobe size={12} />
            Base URL
          </dt>
          <dd className="font-mono text-xs text-zinc-800">{apiBase || "..."}</dd>
        </div>
      </dl>
    </section>
  );
}
