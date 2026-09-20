import type { Metadata } from "next";
import { TransactionForm } from "@/components/screens/TransactionForm";

export const metadata: Metadata = { title: "New entry — Ledger" };

export default function NewTransactionPage() {
  return <TransactionForm />;
}
