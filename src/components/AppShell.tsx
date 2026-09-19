import { BottomNav } from "./BottomNav";
import { RequireAuth } from "./RequireAuth";
import { SyncStatus } from "./SyncStatus";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SyncStatus />
      <RequireAuth>
        <main id="main" className="main-pane">
          {children}
        </main>
        <BottomNav />
      </RequireAuth>
    </div>
  );
}
