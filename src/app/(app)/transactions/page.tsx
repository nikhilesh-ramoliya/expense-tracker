import type { Metadata } from "next";
import { TransactionsScreen } from "@/components/screens/TransactionsScreen";

export const metadata: Metadata = { title: "Activity — Ledger" };

export default function TransactionsPage() {
  return <TransactionsScreen />;
}
