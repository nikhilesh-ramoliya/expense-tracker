import type { Metadata } from "next";
import { SettingsScreen } from "@/components/screens/SettingsScreen";

export const metadata: Metadata = { title: "Settings — Ledger" };

export default function SettingsPage() {
  return <SettingsScreen />;
}
