import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { DashboardScreen } from "@/components/screens/DashboardScreen";

export const metadata: Metadata = { title: "Home — Ledger" };

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardScreen />
    </AppShell>
  );
}
