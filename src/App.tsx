import { AppShell } from "@/components/AppShell";
import { ConnectionPanel } from "@/components/ConnectionPanel";
import { EmbedWorkspace } from "@/components/EmbedWorkspace";

export function App() {
  return (
    <AppShell>
      <ConnectionPanel />
      <EmbedWorkspace />
    </AppShell>
  );
}
