import { BottomNav } from "./BottomNav";
import { RequireAuth } from "./RequireAuth";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <RequireAuth>
        <main id="main" className="main-pane">
          {children}
        </main>
        <BottomNav />
      </RequireAuth>
    </div>
  );
}
