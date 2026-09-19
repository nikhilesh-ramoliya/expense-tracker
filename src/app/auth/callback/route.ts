import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

function safeNext(next: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/auth/update-password";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

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
