import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { TransactionsScreen } from "@/components/screens/TransactionsScreen";

export const metadata: Metadata = { title: "Activity — Ledger" };

export default function TransactionsPage() {
  return (
    <AppShell>
      <TransactionsScreen />
    </AppShell>
  );
}
