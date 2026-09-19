import type { Metadata } from "next";
import { UpdatePasswordScreen } from "@/components/screens/UpdatePasswordScreen";

export const metadata: Metadata = {
  title: "New password — Ledger",
};

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <UpdatePasswordScreen linkError={params.error === "invalid"} />;
}
