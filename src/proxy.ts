import { type NextRequest, NextResponse } from "next/server";
// import { updateSession } from "@/lib/supabase/proxy";

// Next.js middleware entry point. The product template ships Supabase
// session validation at @/lib/supabase/proxy → updateSession(request), but
// the call is commented out below so a freshly provisioned repo runs
// `bun dev` and serves the seeded landing immediately, without needing
// Supabase env set first.
//
// To enable session validation:
//   1. Fill in .env (or .env.local) with NEXT_PUBLIC_SUPABASE_URL and
//      NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example for the full set
//      of supported variable names.
//   2. Uncomment the import above and the `return updateSession(request)`
//      line below; delete the `return NextResponse.next(...)` placeholder.
//
// The Supabase wiring at src/lib/supabase/* is already in place and ready
// to use — only this middleware call is staged behind a commented switch
// to keep the first-run experience friction-free.
export async function proxy(request: NextRequest) {
  // return updateSession(request);
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
