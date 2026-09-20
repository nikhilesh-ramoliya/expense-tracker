import type { Metadata } from "next";
import { AccountsScreen } from "@/components/screens/AccountsScreen";

export const metadata: Metadata = { title: "Wallets — Ledger" };

export default function AccountsPage() {
  return <AccountsScreen />;
}
