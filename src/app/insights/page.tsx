import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { InsightsScreen } from "@/components/screens/InsightsScreen";

export const metadata: Metadata = { title: "Insights — Ledger" };

export default function InsightsPage() {
  return (
    <AppShell>
      <InsightsScreen />
    </AppShell>
  );
}
