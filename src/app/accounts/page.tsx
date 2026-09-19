import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { AccountsScreen } from "@/components/screens/AccountsScreen";

export const metadata: Metadata = { title: "Wallets — Ledger" };

export default function AccountsPage() {
  return (
    <AppShell>
      <AccountsScreen />
    </AppShell>
  );
}
