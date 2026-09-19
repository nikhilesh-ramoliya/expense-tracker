import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { TransactionForm } from "@/components/screens/TransactionForm";

export const metadata: Metadata = { title: "Edit entry — Ledger" };

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <TransactionForm id={id} />
    </AppShell>
  );
}
