import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );

          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  await supabase.auth.getClaims();
  const path=request.nextUrl.pathname;
  if (!path.startsWith('/auth/') && path!=='/login') {
    const {data:{user}}=await supabase.auth.getUser();
    if(user){
      const {data:allowed,error}=await supabase.rpc('cinema_member_allowed');
      if(error||!allowed){
        await supabase.auth.signOut();
        if(path.startsWith('/api/'))return NextResponse.json({error:'Email is not approved for access'},{status:403});
        const url=request.nextUrl.clone();
        url.pathname='/login';
        url.search='?error=not_allowed';
        const response=NextResponse.redirect(url);
        for(const cookie of supabaseResponse.cookies.getAll())response.cookies.set(cookie);
        return response;
      }
    }
  }
  return supabaseResponse;
}
