import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

function recoveryNext(searchParams: URLSearchParams) {
  const type = searchParams.get("type");
  const next = searchParams.get("next");
  const nextIsUpdate = Boolean(next?.includes("update-password"));
  if (type === "recovery" || nextIsUpdate || !next) return "/auth/update-password";
  if (next.startsWith("/") && !next.startsWith("//") && next !== "/dashboard" && next !== "/") {
    return next;
  }
  return "/auth/update-password";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = recoveryNext(searchParams);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const failed = new URL("/auth/update-password", origin);
  failed.searchParams.set("error", "invalid");
  return NextResponse.redirect(failed);
}
