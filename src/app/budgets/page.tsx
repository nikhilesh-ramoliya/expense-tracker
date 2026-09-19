import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { BudgetsScreen } from "@/components/screens/BudgetsScreen";

export const metadata: Metadata = { title: "Budgets — Ledger" };

export default function BudgetsPage() {
  return (
    <AppShell>
      <BudgetsScreen />
    </AppShell>
  );
}
