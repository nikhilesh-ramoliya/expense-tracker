import type { Metadata } from "next";
import { ForgotPasswordScreen } from "@/components/screens/ForgotPasswordScreen";

export const metadata: Metadata = {
  title: "Forgot password — Ledger",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
