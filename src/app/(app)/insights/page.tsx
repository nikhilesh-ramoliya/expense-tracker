import type { Metadata } from "next";
import { InsightsScreen } from "@/components/screens/InsightsScreen";

export const metadata: Metadata = { title: "Insights — Ledger" };

export default function InsightsPage() {
  return <InsightsScreen />;
}
