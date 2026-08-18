import { WebhookInbox } from "@/components/WebhookInbox";
import { IconSparkle } from "@/components/icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <IconSparkle size={16} />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight">Embed quickstart</p>
              <p className="text-xs text-zinc-500">
                Mint on the server · ZSign UI in{" "}
                <code className="text-[11px]">EmbedFrame</code>
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            <code className="text-[11px]">src/pages/api/embed/mint.ts</code>
            {" · "}
            <code className="text-[11px]">components/EmbedFrame.tsx</code>
          </p>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4">
        {children}
        <WebhookInbox />
      </main>
    </div>
  );
}
