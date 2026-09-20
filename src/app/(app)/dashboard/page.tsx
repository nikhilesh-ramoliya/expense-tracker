import type { Metadata } from "next";
import { DashboardScreen } from "@/components/screens/DashboardScreen";

export const metadata: Metadata = { title: "Home — Ledger" };

export default function DashboardPage() {
  return <DashboardScreen />;
}
