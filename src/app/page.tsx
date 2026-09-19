import type { Metadata } from "next";
import { LoginScreen } from "@/components/screens/LoginScreen";

export const metadata: Metadata = {
  title: "Sign in — Ledger",
};

export default function Home() {
  return <LoginScreen />;
}
