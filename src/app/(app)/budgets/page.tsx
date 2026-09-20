import type { Metadata } from "next";
import { BudgetsScreen } from "@/components/screens/BudgetsScreen";

export const metadata: Metadata = { title: "Budgets — Ledger" };

export default function BudgetsPage() {
  return <BudgetsScreen />;
}
